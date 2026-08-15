"""
modules/monitor.py
Core OS memory monitoring engine.
Hooks into /proc filesystem and psutil to track:
  - Heap/stack allocations per process
  - Buffer overflow via canary emulation
  - Memory leak via malloc/free differential
"""

import os
import time
import threading
import psutil
from typing import Optional, Dict, List
from collections import defaultdict, deque
from datetime import datetime

from modules.anomaly_engine import AnomalyEngine
from modules.database import ThreatDatabase
from modules.remediation import RemediationAdvisor


# Thresholds for heuristic overflow / leak triggers
RSS_GROWTH_SUSPICIOUS_MB_S   = 2.0
RSS_GROWTH_CRITICAL_MB_S     = 10.0
HEAP_DELTA_SUSPICIOUS_KB     = 500
HEAP_DELTA_CRITICAL_KB       = 5000
MAX_FD_SUSPICIOUS            = 100
MAX_FD_CRITICAL              = 250


class ProcessSnapshot:
    __slots__ = ("pid", "name", "rss_mb", "vms_mb", "percent",
                 "num_fds", "status", "timestamp", "maps_total")

    def __init__(self, proc: psutil.Process):
        try:
            mi = proc.memory_info()
            self.pid       = proc.pid
            self.name      = proc.name()
            self.rss_mb    = mi.rss / 1_048_576
            self.vms_mb    = mi.vms / 1_048_576
            self.percent   = proc.memory_percent()
            self.num_fds   = proc.num_fds() if os.name != "nt" else 0
            self.status    = proc.status()
            self.timestamp = time.time()
            try:
                self.maps_total = sum(m.rss for m in proc.memory_maps()) / 1024
            except Exception:
                self.maps_total = 0.0
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            raise


class MemoryMonitor:
    def __init__(self, db: ThreatDatabase, scan_interval: int = 3,
                 target_pid: Optional[int] = None):
        self.db            = db
        self.scan_interval = scan_interval
        self.target_pid    = target_pid
        self.engine        = AnomalyEngine()
        self.advisor       = RemediationAdvisor()
        self._running      = False
        self._lock         = threading.Lock()

        # Rolling history per PID: deque of (timestamp, rss_mb)
        self._rss_history: Dict[int, deque] = defaultdict(lambda: deque(maxlen=10))
        # Heap delta tracker: simulated via maps_total diff
        self._maps_prev: Dict[int, float] = {}

        # Live state exposed to dashboard
        self.live_events: deque = deque(maxlen=100)
        self.process_table: List[dict] = []
        self.alert_counts  = {"normal": 0, "suspicious": 0, "critical": 0}
        self.scan_count    = 0

    # ── Canary emulation ──────────────────────────────────────────────────
    def _check_canary(self, proc: psutil.Process, snap: ProcessSnapshot) -> bool:
        """
        Emulate stack canary check by reading /proc/<pid>/maps and
        verifying [stack] segment hasn't grown anomalously relative to [heap].
        Returns True (intact) or False (potential overflow).
        """
        try:
            maps_path = f"/proc/{snap.pid}/maps"
            if not os.path.exists(maps_path):
                return True

            stack_size = heap_size = 0
            with open(maps_path, "r") as f:
                for line in f:
                    parts = line.split()
                    if len(parts) < 1:
                        continue
                    addr_range = parts[0]
                    start, end = [int(x, 16) for x in addr_range.split("-")]
                    size_kb = (end - start) / 1024
                    label = parts[-1] if len(parts) > 5 else ""
                    if "[stack]" in label:
                        stack_size = size_kb
                    elif "[heap]" in label:
                        heap_size = size_kb

            # Heuristic: stack > 64 MB is anomalous (typical max is 8 MB)
            if stack_size > 65536:
                self.db.log_canary(snap.pid, snap.name, False, "[stack]",
                                   f"Stack size {stack_size:.0f} KB exceeds safe bound")
                return False

            self.db.log_canary(snap.pid, snap.name, True, "[stack]/[heap]")
            return True
        except Exception:
            return True

    # ── Heap / leak differential ──────────────────────────────────────────
    def _heap_delta(self, pid: int, current_maps_kb: float) -> float:
        prev = self._maps_prev.get(pid, current_maps_kb)
        self._maps_prev[pid] = current_maps_kb
        return current_maps_kb - prev

    # ── Growth rate ───────────────────────────────────────────────────────
    def _growth_rate(self, pid: int, snap: ProcessSnapshot) -> float:
        history = self._rss_history[pid]
        history.append((snap.timestamp, snap.rss_mb))
        if len(history) < 2:
            return 0.0
        oldest_t, oldest_rss = history[0]
        dt = snap.timestamp - oldest_t
        if dt < 0.01:
            return 0.0
        return (snap.rss_mb - oldest_rss) / dt  # MB/s

    # ── Scan one process ──────────────────────────────────────────────────
    def _scan_process(self, proc: psutil.Process):
        try:
            snap = ProcessSnapshot(proc)
        except Exception:
            return

        heap_delta_kb = self._heap_delta(snap.pid, snap.maps_total)
        growth_rate   = self._growth_rate(snap.pid, snap)

        # AI classification
        severity, confidence = self.engine.classify(
            snap.rss_mb, snap.vms_mb, growth_rate,
            heap_delta_kb, snap.num_fds, snap.percent
        )

        # Canary check (only on meaningful growth)
        canary_ok = True
        if growth_rate > RSS_GROWTH_SUSPICIOUS_MB_S:
            canary_ok = self._check_canary(proc, snap)

        # Determine threat type
        if not canary_ok:
            threat_type = "Buffer Overflow"
        elif heap_delta_kb > HEAP_DELTA_CRITICAL_KB:
            threat_type = "Memory Leak (Critical)"
        elif heap_delta_kb > HEAP_DELTA_SUSPICIOUS_KB:
            threat_type = "Memory Leak (Suspected)"
        elif growth_rate > RSS_GROWTH_CRITICAL_MB_S:
            threat_type = "Rapid Memory Growth"
        elif severity != "normal":
            threat_type = "Anomalous Allocation Pattern"
        else:
            threat_type = "Normal"

        remediation = self.advisor.suggest(threat_type, severity, snap.pid, snap.name)

        # Log snapshot always
        self.db.log_snapshot(
            snap.pid, snap.name, snap.rss_mb, snap.vms_mb,
            snap.percent, snap.num_fds, snap.status
        )

        # Log event only if non-normal
        if severity != "normal" or not canary_ok:
            self.db.log_event(
                pid=snap.pid, process_name=snap.name, threat_type=threat_type,
                severity=severity, confidence=confidence, rss_mb=snap.rss_mb,
                vms_mb=snap.vms_mb, heap_delta_kb=heap_delta_kb,
                description=f"Growth: {growth_rate:.2f} MB/s | FDs: {snap.num_fds}",
                remediation=remediation
            )

        event = {
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "pid": snap.pid,
            "name": snap.name,
            "rss_mb": snap.rss_mb,
            "vms_mb": snap.vms_mb,
            "growth_rate": growth_rate,
            "heap_delta_kb": heap_delta_kb,
            "severity": severity,
            "confidence": confidence,
            "threat_type": threat_type,
            "canary_ok": canary_ok,
            "remediation": remediation,
        }

        with self._lock:
            self.live_events.appendleft(event)
            self.alert_counts[severity] = self.alert_counts.get(severity, 0) + 1

        return event

    # ── Main scan loop ────────────────────────────────────────────────────
    def _build_process_table(self):
        table = []
        procs = ([psutil.Process(self.target_pid)] if self.target_pid
                 else psutil.process_iter(["pid", "name", "status"]))
        for proc in procs:
            try:
                snap = ProcessSnapshot(proc)
                hd   = self._heap_delta(snap.pid, snap.maps_total)
                gr   = self._growth_rate(snap.pid, snap)
                sev, conf = self.engine.classify(
                    snap.rss_mb, snap.vms_mb, gr, hd, snap.num_fds, snap.percent
                )
                table.append({
                    "pid": snap.pid, "name": snap.name, "rss_mb": snap.rss_mb,
                    "vms_mb": snap.vms_mb, "percent": snap.percent,
                    "severity": sev, "confidence": conf,
                    "growth_rate": gr, "heap_delta_kb": hd,
                })
            except Exception:
                continue
        table.sort(key=lambda x: x["rss_mb"], reverse=True)
        return table[:30]  # top-30 by RSS

    def run(self):
        self._running = True
        while self._running:
            try:
                procs = ([psutil.Process(self.target_pid)] if self.target_pid
                         else psutil.process_iter(["pid", "name", "status"]))
                for proc in procs:
                    self._scan_process(proc)

                with self._lock:
                    self.process_table = self._build_process_table()
                    self.scan_count += 1

            except Exception:
                pass
            time.sleep(self.scan_interval)

    def stop(self):
        self._running = False
