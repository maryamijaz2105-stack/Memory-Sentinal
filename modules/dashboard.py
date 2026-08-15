"""
modules/dashboard.py
Rich-powered CLI dashboard for real-time memory security monitoring.
Displays live process table, alert counts, and recent threat events.
"""

import time
import threading
from datetime import datetime

from rich.console import Console
from rich.live import Live
from rich.table import Table
from rich.panel import Panel
from rich.columns import Columns
from rich.text import Text
from rich.layout import Layout
from rich.progress import SpinnerColumn, TextColumn, BarColumn

from modules.monitor import MemoryMonitor
from modules.database import ThreatDatabase


SEVERITY_STYLE = {
    "normal":     "green",
    "suspicious": "yellow",
    "critical":   "bold red",
}

THREAT_ICONS = {
    "Buffer Overflow":            "💥",
    "Memory Leak (Critical)":     "🔴",
    "Memory Leak (Suspected)":    "🟡",
    "Rapid Memory Growth":        "📈",
    "Anomalous Allocation Pattern":"⚠️",
    "Normal":                     "✅",
}


class Dashboard:
    REFRESH_INTERVAL = 2  # seconds

    def __init__(self, monitor: MemoryMonitor, db: ThreatDatabase, role: str = "analyst"):
        self.monitor = monitor
        self.db      = db
        self.role    = role
        self.console = Console()
        self._stop   = threading.Event()

    # ── Layout builders ───────────────────────────────────────────────────
    def _header(self) -> Panel:
        now  = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        scans = self.monitor.scan_count
        text = Text()
        text.append("🛡  AI-Driven OS Memory Sentinel", style="bold cyan")
        text.append(f"   |   {now}", style="dim")
        text.append(f"   |   Scans: {scans}", style="dim")
        text.append(f"   |   Role: {self.role.upper()}", style="bold magenta")
        return Panel(text, border_style="cyan")

    def _alert_summary(self) -> Panel:
        c = self.monitor.alert_counts
        text = Text()
        text.append(f"  🟢 Normal: {c.get('normal', 0)}    ", style="green bold")
        text.append(f"  🟡 Suspicious: {c.get('suspicious', 0)}    ", style="yellow bold")
        text.append(f"  🔴 Critical: {c.get('critical', 0)}  ", style="red bold")
        return Panel(text, title="[bold]Alert Summary[/bold]", border_style="white")

    def _process_table(self) -> Table:
        table = Table(
            title="[bold cyan]Live Process Memory Table (Top 15)[/bold cyan]",
            border_style="blue",
            header_style="bold white on blue",
            show_lines=False,
        )
        table.add_column("PID",      style="cyan",  width=7)
        table.add_column("Process",  style="white", width=20)
        table.add_column("RSS MB",   style="green", width=8,  justify="right")
        table.add_column("VMS MB",   style="dim",   width=8,  justify="right")
        table.add_column("Mem %",    style="cyan",  width=6,  justify="right")
        table.add_column("Growth/s", style="white", width=9,  justify="right")
        table.add_column("Heap Δ KB",style="white", width=10, justify="right")
        table.add_column("Severity", width=12)
        table.add_column("Conf",     width=6,  justify="right")

        procs = self.monitor.process_table[:15]
        for p in procs:
            sev   = p.get("severity", "normal")
            style = SEVERITY_STYLE.get(sev, "white")
            conf  = f"{p.get('confidence', 0):.0%}"
            gr    = p.get("growth_rate", 0)
            gr_s  = f"[red]{gr:.2f}[/red]" if gr > 5 else f"{gr:.2f}"
            hd    = p.get("heap_delta_kb", 0)
            hd_s  = f"[red]{hd:.0f}[/red]" if hd > 1000 else f"{hd:.0f}"
            table.add_row(
                str(p["pid"]),
                p["name"][:20],
                f"{p['rss_mb']:.1f}",
                f"{p['vms_mb']:.1f}",
                f"{p['percent']:.1f}",
                gr_s,
                hd_s,
                f"[{style}]{sev.upper()}[/{style}]",
                conf,
            )
        return table

    def _recent_events(self) -> Table:
        table = Table(
            title="[bold yellow]Recent Threat Events[/bold yellow]",
            border_style="yellow",
            header_style="bold white on dark_orange",
            show_lines=True,
        )
        table.add_column("Time",     width=9)
        table.add_column("PID",      width=7)
        table.add_column("Process",  width=18)
        table.add_column("Threat",   width=28)
        table.add_column("Sev",      width=12)
        table.add_column("Conf",     width=6)
        table.add_column("Remedy (short)",  width=40)

        events = list(self.monitor.live_events)[:12]
        for e in events:
            sev   = e.get("severity", "normal")
            style = SEVERITY_STYLE.get(sev, "white")
            if sev == "normal":
                continue  # only show non-normal events
            icon  = THREAT_ICONS.get(e["threat_type"], "⚠️")
            # Short remedy: first sentence
            remedy = e.get("remediation", "")
            short  = remedy.split("\n")[3] if "\n" in remedy else remedy
            short  = short.strip().lstrip("0123456789. ")[:40]
            table.add_row(
                e["timestamp"],
                str(e["pid"]),
                e["name"][:18],
                f"{icon} {e['threat_type']}",
                f"[{style}]{sev.upper()}[/{style}]",
                f"{e['confidence']:.0%}",
                short,
            )
        return table

    def _system_bar(self) -> Panel:
        import psutil
        cpu   = psutil.cpu_percent(interval=None)
        mem   = psutil.virtual_memory()
        swap  = psutil.swap_memory()
        text  = Text()
        text.append(f"CPU: {cpu:.1f}%   ", style="cyan")
        text.append(f"RAM: {mem.used/1e9:.1f}/{mem.total/1e9:.1f} GB ({mem.percent:.1f}%)   ",
                    style="green" if mem.percent < 70 else "yellow" if mem.percent < 85 else "red")
        text.append(f"Swap: {swap.percent:.1f}%", style="dim")
        return Panel(text, title="System Resources", border_style="dim")

    # ── Main run loop ─────────────────────────────────────────────────────
    def _build_layout(self):
        return Layout(
            Panel(
                Layout(
                    name="inner"
                )
            )
        )

    def run(self):
        self.console.clear()
        with Live(
            self._render(),
            console=self.console,
            refresh_per_second=0.5,
            screen=True,
        ) as live:
            while not self._stop.is_set():
                live.update(self._render())
                time.sleep(self.REFRESH_INTERVAL)

    def _render(self):
        from rich.console import Group
        return Group(
            self._header(),
            self._alert_summary(),
            self._system_bar(),
            self._process_table(),
            self._recent_events(),
            Panel("[dim]Press Ctrl+C to exit  |  --export pdf/csv for reports[/dim]",
                  border_style="dim"),
        )

    def stop(self):
        self._stop.set()
