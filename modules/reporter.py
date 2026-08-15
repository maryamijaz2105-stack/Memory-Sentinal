"""
modules/reporter.py
PDF and CSV security report exporter.
"""

import csv
import os
from datetime import datetime
from pathlib import Path


class Reporter:
    def __init__(self, db):
        self.db = db
        Path("reports").mkdir(exist_ok=True)

    def export_csv(self, path: str = "reports/security_report.csv"):
        events = self.db.get_recent_events(limit=1000)
        if not events:
            print("[!] No events to export.")
            return
        fieldnames = list(events[0].keys())
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(events)
        print(f"[✓] CSV exported: {path}")

    def export_pdf(self, path: str = "reports/security_report.pdf"):
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                            Table, TableStyle)

            events = self.db.get_recent_events(limit=50)
            stats  = self.db.get_session_stats()
            counts = self.db.get_event_counts()

            doc    = SimpleDocTemplate(path, pagesize=letter)
            styles = getSampleStyleSheet()
            story  = []

            # Title
            story.append(Paragraph("AI-Driven OS Memory Sentinel", styles["Title"]))
            story.append(Paragraph("Security Incident Report", styles["Heading2"]))
            story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                                   styles["Normal"]))
            story.append(Spacer(1, 12))

            # Summary
            story.append(Paragraph("Executive Summary", styles["Heading2"]))
            summary_data = [
                ["Metric", "Value"],
                ["Session ID",       str(stats["session_id"])],
                ["Total Events",     str(stats["total_events"])],
                ["Snapshots Taken",  str(stats["snapshots"])],
                ["Normal Events",    str(counts.get("normal", 0))],
                ["Suspicious Events",str(counts.get("suspicious", 0))],
                ["Critical Events",  str(counts.get("critical", 0))],
            ]
            t = Table(summary_data, colWidths=[200, 250])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E75B6")),
                ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
                ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
                ("GRID",       (0, 0), (-1, -1), 0.5, colors.grey),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(t)
            story.append(Spacer(1, 16))

            # Event table
            if events:
                story.append(Paragraph("Threat Event Log (Last 50)", styles["Heading2"]))
                headers = ["Time", "PID", "Process", "Type", "Severity", "Confidence"]
                rows = [headers]
                for e in events:
                    rows.append([
                        e["timestamp"][:19],
                        str(e["pid"]),
                        e["process_name"][:20],
                        e["threat_type"][:25],
                        e["severity"].upper(),
                        f"{e['confidence']:.0%}",
                    ])
                t2 = Table(rows, colWidths=[110, 45, 100, 130, 75, 60])
                sev_styles = []
                for i, e in enumerate(events, 1):
                    if e["severity"] == "critical":
                        sev_styles.append(("TEXTCOLOR", (4, i), (4, i), colors.red))
                    elif e["severity"] == "suspicious":
                        sev_styles.append(("TEXTCOLOR", (4, i), (4, i), colors.orange))
                t2.setStyle(TableStyle([
                    ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#404040")),
                    ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
                    ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE",      (0, 0), (-1, -1), 8),
                    ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
                    ("GRID",          (0, 0), (-1, -1), 0.3, colors.lightgrey),
                    ("LEFTPADDING",   (0, 0), (-1, -1), 4),
                ] + sev_styles))
                story.append(t2)

            doc.build(story)
            print(f"[✓] PDF exported: {path}")

        except ImportError:
            print("[!] reportlab not installed. Install with: pip install reportlab")
            self.export_csv(path.replace(".pdf", ".csv"))
