#!/usr/bin/env python3
"""
AI-Driven OS Memory Sentinel
Main entry point — launches dashboard and monitoring engine.
"""

import sys
import time
import argparse
import threading
from modules.dashboard import Dashboard
from modules.monitor import MemoryMonitor
from modules.auth import AuthManager
from modules.database import ThreatDatabase


def parse_args():
    parser = argparse.ArgumentParser(
        description="AI-Driven OS Memory Sentinel — Anomaly Detection for Buffer Overflows and Leak Prevention"
    )
    parser.add_argument("--no-auth", action="store_true", help="Skip authentication (demo mode)")
    parser.add_argument("--scan-interval", type=int, default=3, help="Scan interval in seconds (default: 3)")
    parser.add_argument("--export", choices=["pdf", "csv", "both"], help="Export report on exit")
    parser.add_argument("--pid", type=int, help="Monitor a specific PID only")
    return parser.parse_args()


def main():
    args = parse_args()
    db = ThreatDatabase()
    auth = AuthManager()

    if not args.no_auth:
        print("\n╔══════════════════════════════════════════════╗")
        print("║      AI-Driven OS Memory Sentinel v1.0       ║")
        print("║   Anomaly Detection | Buffer Overflow Guard  ║")
        print("╚══════════════════════════════════════════════╝\n")
        role = auth.login()
        if not role:
            print("[!] Authentication failed. Exiting.")
            sys.exit(1)
        print(f"[✓] Logged in as: {role}\n")
    else:
        role = "admin"

    monitor = MemoryMonitor(db=db, scan_interval=args.scan_interval, target_pid=args.pid)
    dashboard = Dashboard(monitor=monitor, db=db, role=role)

    monitor_thread = threading.Thread(target=monitor.run, daemon=True)
    monitor_thread.start()

    try:
        dashboard.run()
    except KeyboardInterrupt:
        print("\n[*] Shutting down Memory Sentinel...")
        monitor.stop()

    if args.export:
        from modules.reporter import Reporter
        reporter = Reporter(db)
        if args.export in ("pdf", "both"):
            reporter.export_pdf("reports/security_report.pdf")
            print("[✓] PDF report saved to reports/security_report.pdf")
        if args.export in ("csv", "both"):
            reporter.export_csv("reports/security_report.csv")
            print("[✓] CSV report saved to reports/security_report.csv")


if __name__ == "__main__":
    main()
