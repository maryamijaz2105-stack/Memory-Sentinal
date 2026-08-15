"""
modules/database.py
SQLite-backed threat event database.
Stores all memory events, snapshots, and session metadata.
"""

import sqlite3
import json
import time
from datetime import datetime
from pathlib import Path


class ThreatDatabase:
    def __init__(self, db_path: str = "data/sentinel.db"):
        Path("data").mkdir(exist_ok=True)
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self):
        cur = self.conn.cursor()
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at  TEXT    NOT NULL,
                ended_at    TEXT,
                user_role   TEXT    NOT NULL DEFAULT 'analyst',
                notes       TEXT
            );

            CREATE TABLE IF NOT EXISTS threat_events (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id      INTEGER REFERENCES sessions(id),
                timestamp       TEXT    NOT NULL,
                pid             INTEGER NOT NULL,
                process_name    TEXT    NOT NULL,
                threat_type     TEXT    NOT NULL,
                severity        TEXT    NOT NULL,
                confidence      REAL    NOT NULL,
                rss_mb          REAL,
                vms_mb          REAL,
                heap_delta_kb   REAL,
                description     TEXT,
                remediation     TEXT
            );

            CREATE TABLE IF NOT EXISTS memory_snapshots (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id      INTEGER REFERENCES sessions(id),
                timestamp       TEXT    NOT NULL,
                pid             INTEGER NOT NULL,
                process_name    TEXT    NOT NULL,
                rss_mb          REAL,
                vms_mb          REAL,
                percent         REAL,
                num_fds         INTEGER,
                status          TEXT
            );

            CREATE TABLE IF NOT EXISTS canary_checks (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp       TEXT    NOT NULL,
                pid             INTEGER NOT NULL,
                process_name    TEXT    NOT NULL,
                canary_intact   INTEGER NOT NULL,
                region          TEXT,
                notes           TEXT
            );
        """)
        self.conn.commit()
        # Start a new session
        cur.execute(
            "INSERT INTO sessions (started_at, user_role) VALUES (?, ?)",
            (datetime.now().isoformat(), "analyst")
        )
        self.conn.commit()
        self.session_id = cur.lastrowid

    def log_event(self, pid: int, process_name: str, threat_type: str,
                  severity: str, confidence: float, rss_mb: float = 0,
                  vms_mb: float = 0, heap_delta_kb: float = 0,
                  description: str = "", remediation: str = ""):
        self.conn.execute(
            """INSERT INTO threat_events
               (session_id, timestamp, pid, process_name, threat_type, severity,
                confidence, rss_mb, vms_mb, heap_delta_kb, description, remediation)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (self.session_id, datetime.now().isoformat(), pid, process_name,
             threat_type, severity, confidence, rss_mb, vms_mb, heap_delta_kb,
             description, remediation)
        )
        self.conn.commit()

    def log_snapshot(self, pid: int, process_name: str, rss_mb: float,
                     vms_mb: float, percent: float, num_fds: int, status: str):
        self.conn.execute(
            """INSERT INTO memory_snapshots
               (session_id, timestamp, pid, process_name, rss_mb, vms_mb, percent, num_fds, status)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (self.session_id, datetime.now().isoformat(), pid, process_name,
             rss_mb, vms_mb, percent, num_fds, status)
        )
        self.conn.commit()

    def log_canary(self, pid: int, process_name: str, intact: bool, region: str = "", notes: str = ""):
        self.conn.execute(
            """INSERT INTO canary_checks
               (timestamp, pid, process_name, canary_intact, region, notes)
               VALUES (?,?,?,?,?,?)""",
            (datetime.now().isoformat(), pid, process_name, int(intact), region, notes)
        )
        self.conn.commit()

    def get_recent_events(self, limit: int = 20):
        cur = self.conn.execute(
            "SELECT * FROM threat_events ORDER BY id DESC LIMIT ?", (limit,)
        )
        return [dict(row) for row in cur.fetchall()]

    def get_event_counts(self):
        cur = self.conn.execute(
            "SELECT severity, COUNT(*) as cnt FROM threat_events GROUP BY severity"
        )
        counts = {"normal": 0, "suspicious": 0, "critical": 0}
        for row in cur.fetchall():
            counts[row["severity"].lower()] = row["cnt"]
        return counts

    def get_session_stats(self):
        cur = self.conn.execute(
            "SELECT COUNT(*) as total FROM threat_events WHERE session_id=?",
            (self.session_id,)
        )
        total = cur.fetchone()["total"]
        cur = self.conn.execute(
            "SELECT COUNT(*) as snaps FROM memory_snapshots WHERE session_id=?",
            (self.session_id,)
        )
        snaps = cur.fetchone()["snaps"]
        return {"total_events": total, "snapshots": snaps, "session_id": self.session_id}

    def close(self):
        self.conn.execute(
            "UPDATE sessions SET ended_at=? WHERE id=?",
            (datetime.now().isoformat(), self.session_id)
        )
        self.conn.commit()
        self.conn.close()
