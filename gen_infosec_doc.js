const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageBreak, TabStopType, TabStopPosition
} = require("docx");
const fs = require("fs");

const DKRED  = "7B0000";
const RED    = "C0392B";
const LRED   = "FADBD8";
const GRAY   = "2C3E50";
const LGRAY  = "F2F2F2";
const MGRAY  = "555555";
const border  = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder  = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: DKRED })],
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RED, space: 1 } }
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: RED })],
    spacing: { before: 280, after: 140 },
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: MGRAY })],
    spacing: { before: 200, after: 100 },
  });
}
function para(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 22, color: "222222" })],
    spacing: { after: 120 },
    alignment: AlignmentType.JUSTIFIED,
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
    spacing: { after: 80 },
  });
}
function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
    spacing: { after: 80 },
  });
}
function pageBreak() { return new Paragraph({ children: [new PageBreak()], spacing: { after: 0 } }); }
function spacer()    { return new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } }); }

function warnBox(label, text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
    rows: [new TableRow({ children: [new TableCell({
      borders: {
        top:    { style: BorderStyle.SINGLE, size: 4, color: RED },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: RED },
        left:   { style: BorderStyle.THICK,  size: 8, color: RED },
        right:  { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" }
      },
      shading: { fill: LRED, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 160, right: 120 },
      width: { size: 9360, type: WidthType.DXA },
      children: [
        new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "Arial", size: 20, color: DKRED })], spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20, color: "333333" })], spacing: { after: 0 } }),
      ]
    })]})],
  });
}

function headerRow(cells, widths) {
  return new TableRow({ children: cells.map((c, i) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    shading: { fill: "8B0000", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, font: "Arial", size: 20, color: "FFFFFF" })] })]
  })) });
}
function dataRow(cells, widths, shade = false) {
  return new TableRow({ children: cells.map((c, i) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    shading: { fill: shade ? LGRAY : "FFFFFF", type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: c, font: "Arial", size: 20 })] })]
  })) });
}

// ── Cover Page ─────────────────────────────────────────────────────────────
function coverPage() {
  return [
    spacer(), spacer(), spacer(),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "UNIVERSITY OF LAHORE", bold: true, font: "Arial", size: 28, color: DKRED })], spacing: { after: 80 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Department of Software Engineering", font: "Arial", size: 24, color: MGRAY })], spacing: { after: 320 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "INFORMATION SECURITY", bold: true, font: "Arial", size: 36, color: RED })], spacing: { after: 80 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Spring 2026 — Semester Project Report", font: "Arial", size: 26, color: MGRAY })], spacing: { after: 280 } }),
    new Table({
      width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
      rows: [new TableRow({ children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: RED }, bottom: { style: BorderStyle.SINGLE, size: 4, color: RED }, left: noBorder, right: noBorder },
        shading: { fill: LRED, type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 200, left: 200, right: 200 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "AI-Driven OS Memory Sentinel", bold: true, font: "Arial", size: 32, color: DKRED })], spacing: { after: 120 } }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Anomaly Detection for Buffer Overflows and Memory Leak Prevention", font: "Arial", size: 24, color: MGRAY })], spacing: { after: 0 } }),
        ]
      })]})],
    }),
    spacer(), spacer(),
    new Table({
      width: { size: 7200, type: WidthType.DXA }, columnWidths: [2880, 4320],
      rows: [
        new TableRow({ children: [
          new TableCell({ borders: noBorders, width: { size: 2880, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Team Members:", bold: true, font: "Arial", size: 22, color: DKRED })] })] }),
          new TableCell({ borders: noBorders, width: { size: 4320, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Malaika Asghar (70144776)  |  Maryam Ijaz (70144999)", font: "Arial", size: 22 })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ borders: noBorders, width: { size: 2880, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Submitted To:", bold: true, font: "Arial", size: 22, color: DKRED })] })] }),
          new TableCell({ borders: noBorders, width: { size: 4320, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Sir Habib Ur Rahman", font: "Arial", size: 22 })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ borders: noBorders, width: { size: 2880, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Submission Date:", bold: true, font: "Arial", size: 22, color: DKRED })] })] }),
          new TableCell({ borders: noBorders, width: { size: 4320, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Spring 2026", font: "Arial", size: 22 })] })] }),
        ]}),
      ]
    }),
    pageBreak()
  ];
}

const children = [
  ...coverPage(),

  // ── Chapter 1 ─────────────────────────────────────────────────────────
  h1("Chapter 1: Introduction and Problem Statement"),
  h2("1.1 Background — The Memory Exploitation Threat Landscape"),
  para("Memory corruption vulnerabilities have consistently ranked among the most severe and exploited categories in the Common Weakness Enumeration (CWE) and the OWASP Top 10. Buffer overflows (CWE-120/CWE-787) and memory leaks (CWE-401) represent two distinct but related threat classes: the former enables an attacker to overwrite adjacent memory, corrupt control flow, and achieve arbitrary code execution; the latter degrades system availability through progressive resource exhaustion until a crash or denial-of-service condition occurs."),
  para("Despite decades of research and tooling, memory exploitation remains a dominant attack vector. High-profile vulnerabilities such as Heartbleed (CVE-2014-0160), a memory disclosure bug in OpenSSL, demonstrated that even critical, widely-audited software remains susceptible. The exploitation chain — unchecked buffer write, canary bypass, ROP chain execution — follows a well-documented pattern that this project's detection engine is specifically trained to identify at the OS memory level."),
  spacer(),

  h2("1.2 Problem Statement"),
  warnBox("Security Gap Identified", "Existing open-source tools either require source recompilation (ASan, SafeStack), impose prohibitive runtime overhead (Valgrind: 10–50x slowdown), operate at the network layer (Snort, Suricata), or provide no memory-level visibility (OSSEC/Wazuh). No existing free tool combines real-time OS memory monitoring with AI-based anomaly classification and operator-facing remediation guidance."),
  spacer(),
  para("The AI-Driven OS Memory Sentinel directly addresses this gap by operating at the OS userspace layer — reading /proc filesystem memory maps, monitoring system call effects via psutil, and applying a trained machine learning classifier to distinguish normal memory behaviour from active exploit patterns or leak conditions — without modifying monitored software, installing kernel modules, or recompiling application code."),
  spacer(),

  h2("1.3 Security Objectives"),
  bullet("Detect buffer overflow attempts in real time via stack-canary emulation using /proc/<pid>/maps segment size analysis."),
  bullet("Identify memory leak conditions by tracking malloc/free differential via heap delta monitoring across scan intervals."),
  bullet("Classify memory events as normal, suspicious, or critical using a scikit-learn RandomForestClassifier with confidence scoring."),
  bullet("Log all detected threat events to a tamper-evident SQLite audit trail for forensic review and compliance reporting."),
  bullet("Provide role-based access control (admin/analyst) to protect monitoring data from unauthorised modification."),
  bullet("Generate exportable PDF and CSV incident reports for security audit and compliance documentation."),
  bullet("Deliver AI-powered remediation guidance that reduces Mean Time to Remediate (MTTR) for detected vulnerabilities."),
  spacer(),
  pageBreak(),

  // ── Chapter 2 ─────────────────────────────────────────────────────────
  h1("Chapter 2: Threat Analysis and Related Work"),
  h2("2.1 Attack Taxonomy"),
  para("This project addresses the following memory-level attack classes, drawn from the taxonomy established by Szekeres et al. (2013) in 'SoK: Eternal War in Memory':"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2800, 1800, 4760],
    rows: [
      headerRow(["Attack Class", "CWE", "Description and Detection Mechanism"], [2800, 1800, 4760]),
      dataRow(["Stack Buffer Overflow", "CWE-121", "Write past fixed-size stack buffer, overwriting saved return address. Detected via [stack] segment size anomaly in /proc/<pid>/maps."], [2800, 1800, 4760], false),
      dataRow(["Heap Buffer Overflow", "CWE-122", "Write past dynamically allocated buffer. Detected via rapid heap delta growth and AI anomaly classification."], [2800, 1800, 4760], true),
      dataRow(["Memory Leak", "CWE-401", "Allocated memory never freed; RSS grows unboundedly. Detected via continuous positive heap delta with no deallocation signal."], [2800, 1800, 4760], false),
      dataRow(["Use After Free", "CWE-416", "Accessing memory after free(). Detected indirectly via anomalous allocation patterns and rapid heap fluctuation."], [2800, 1800, 4760], true),
      dataRow(["Resource Exhaustion (DoS)", "CWE-400", "Unbounded memory consumption crashing the process. Detected via critical RSS growth rate and memory percent thresholds."], [2800, 1800, 4760], false),
    ]
  }),
  spacer(),

  h2("2.2 Review of Existing Tools"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2400, 6960],
    rows: [
      headerRow(["Tool", "Security Relevance and Limitations"], [2400, 6960]),
      dataRow(["Valgrind / Memcheck", "Highly accurate memory error detection but 10–50x runtime overhead makes it unsuitable for live production monitoring. No AI classification or operator dashboard."], [2400, 6960], false),
      dataRow(["AddressSanitizer (ASan)", "Compiler-level instrumentation catching overflows and use-after-free. Requires source recompilation — inapplicable to third-party or legacy binaries."], [2400, 6960], true),
      dataRow(["OSSEC / Wazuh HIDS", "Monitors log files and file integrity. Provides no memory-level visibility and cannot detect in-process buffer overflows."], [2400, 6960], false),
      dataRow(["Snort / Suricata IDS", "Network-layer threat detection. Entirely blind to memory-resident exploits that do not generate network traffic."], [2400, 6960], true),
      dataRow(["Microsoft SafeStack / LLVM CFI", "Compile-time control-flow integrity. No runtime alerting, no logging, no operator visibility. Requires rebuild."], [2400, 6960], false),
    ]
  }),
  spacer(),

  h2("2.3 Competitive Advantage"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [3200, 1200, 1200, 1200, 1200, 1360],
    rows: [
      headerRow(["Capability", "Valgrind", "ASan", "OSSEC", "Snort", "Our Sentinel"], [3200, 1200, 1200, 1200, 1200, 1360]),
      dataRow(["Real-time monitoring",          "✗", "✗", "Partial", "✗", "✔"], [3200, 1200, 1200, 1200, 1200, 1360], false),
      dataRow(["No recompilation required",      "✔", "✗", "✔", "✔", "✔"], [3200, 1200, 1200, 1200, 1200, 1360], true),
      dataRow(["Buffer overflow detection",      "✔", "✔", "✗", "✗", "✔"], [3200, 1200, 1200, 1200, 1200, 1360], false),
      dataRow(["Memory leak detection",          "✔", "Partial", "✗", "✗", "✔"], [3200, 1200, 1200, 1200, 1200, 1360], true),
      dataRow(["AI anomaly classification",      "✗", "✗", "✗", "✗", "✔"], [3200, 1200, 1200, 1200, 1200, 1360], false),
      dataRow(["Threat logging and reporting",   "✗", "✗", "✔", "✔", "✔"], [3200, 1200, 1200, 1200, 1200, 1360], true),
      dataRow(["Remediation suggestions",        "✗", "✗", "✗", "✗", "✔"], [3200, 1200, 1200, 1200, 1200, 1360], false),
      dataRow(["Low runtime overhead",           "✗", "Partial", "✔", "✔", "✔"], [3200, 1200, 1200, 1200, 1200, 1360], true),
    ]
  }),
  spacer(),
  pageBreak(),

  // ── Chapter 3 ─────────────────────────────────────────────────────────
  h1("Chapter 3: Security System Architecture"),
  h2("3.1 Threat Detection Pipeline"),
  para("The sentinel implements a multi-stage detection pipeline. Each stage corresponds to a distinct security control layer:"),
  numbered("Data Collection Layer: psutil and /proc filesystem reads gather raw memory telemetry (RSS, VMS, heap regions, FD count) for all running processes at configurable intervals."),
  numbered("Canary Emulation Layer: Stack segment size analysis via /proc/<pid>/maps detects overflow conditions without requiring compiler-inserted canary values."),
  numbered("Leak Detection Layer: Continuous heap delta tracking identifies malloc/free imbalances indicative of memory leaks."),
  numbered("AI Classification Layer: A trained RandomForestClassifier assigns severity (normal/suspicious/critical) and a confidence score to each process memory snapshot."),
  numbered("Audit Layer: All events are persisted to a SQLite threat database with timestamps, severity, confidence scores, and full remediation guidance."),
  numbered("Alerting Layer: The Rich CLI dashboard presents live threat intelligence to authorised operators with colour-coded severity indicators."),
  numbered("Remediation Layer: The AI Remediation Advisor maps each threat type to concrete, actionable developer and sysadmin guidance, reducing MTTR."),
  spacer(),

  h2("3.2 Authentication and Access Control"),
  para("The system implements role-based access control (RBAC) with two roles: admin and analyst. Credentials are validated against SHA-256 password hashes stored in the auth module. Three login attempts are permitted before the session is rejected."),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 1800, 4560],
    rows: [
      headerRow(["Action", "Analyst", "Admin"], [3000, 1800, 4560]),
      dataRow(["View live dashboard",     "✔", "✔"], [3000, 1800, 4560], false),
      dataRow(["Export CSV reports",       "✔", "✔"], [3000, 1800, 4560], true),
      dataRow(["Export PDF reports",       "✗", "✔"], [3000, 1800, 4560], false),
      dataRow(["Configure scan intervals", "✗", "✔"], [3000, 1800, 4560], true),
      dataRow(["Delete event records",     "✗", "✔"], [3000, 1800, 4560], false),
    ]
  }),
  spacer(),

  h2("3.3 The AI Threat Classification Engine"),
  para("The core detection engine is a scikit-learn RandomForestClassifier trained on six OS-derived memory features. The three-class output (0: normal, 1: suspicious, 2: critical) maps to an information security severity taxonomy."),
  spacer(),
  h3("Training Corpus and Threat Class Definitions"),
  para("The training data models three distinct threat conditions:"),
  bullet("Normal (800 samples): Stable RSS (50–300 MB), growth rate under 1.5 MB/s, heap delta under 200 KB. Represents healthy idle or working processes."),
  bullet("Suspicious (400 samples): RSS 200–600 MB, growth 2–8 MB/s, heap delta 400–2000 KB. Represents early-stage memory leaks or unusual allocation patterns warranting investigation."),
  bullet("Critical (200 samples): RSS 500–2000 MB, growth 10–50 MB/s, heap delta 5–50 MB. Represents active exploitation, severe leaks, or resource exhaustion conditions requiring immediate response."),
  spacer(),
  h3("Model Performance"),
  warnBox("Classification Accuracy", "Test accuracy: 100% on held-out 20% split (240 samples). The high accuracy reflects strong feature separation between the three class distributions in the synthetic training set. Real-world deployment would require retraining on production traces."),
  spacer(),

  h2("3.4 Buffer Overflow Detection via Canary Emulation"),
  para("Stack canary emulation is implemented in the _check_canary() method. The method reads /proc/<pid>/maps and locates the [stack] segment. A stack segment exceeding 65,536 KB (64 MB) triggers a canary failure event, since the Linux default stack limit (ulimit -s) is 8,192 KB. A legitimate process operating within normal bounds will never exceed this threshold; a stack overflow resulting from an unchecked buffer write, recursive call chain, or exploit payload will cause measurable, observable stack growth captured here."),
  para("On detection, the event is classified as a Buffer Overflow threat, severity is set to critical, and a canary_checks record is written to the SQLite database. The Remediation Advisor immediately generates ASLR configuration commands, compiler flag recommendations, and Valgrind verification steps for the operator."),
  spacer(),

  h2("3.5 Memory Leak Detection"),
  para("Memory leak detection uses a differential analysis approach. On each scan, the total mapped RSS (maps_total, derived from proc.memory_maps()) is compared to the previous scan value. A positive and growing delta with no corresponding decrease over multiple scan cycles is the OS-level signature of heap memory being allocated but never freed."),
  para("Two thresholds govern the InfoSec classification: heap_delta_kb > 500 KB triggers Suspected Leak (suspicious severity); heap_delta_kb > 5,000 KB triggers Critical Leak. Both thresholds are visible and configurable in monitor.py, enabling tuning to the deployment environment's baseline allocation behaviour."),
  spacer(),
  pageBreak(),

  // ── Chapter 4 ─────────────────────────────────────────────────────────
  h1("Chapter 4: Implementation — Security Controls"),
  h2("4.1 Threat Event Schema"),
  para("The threat_events SQLite table captures the complete security context for every detected anomaly:"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2200, 1600, 5560],
    rows: [
      headerRow(["Column", "Type", "Security Purpose"], [2200, 1600, 5560]),
      dataRow(["session_id",    "INTEGER", "Links event to authenticated session for accountability."], [2200, 1600, 5560], false),
      dataRow(["timestamp",     "TEXT",    "ISO 8601 timestamp for forensic timeline reconstruction."], [2200, 1600, 5560], true),
      dataRow(["pid",           "INTEGER", "Identifies the compromised or leaking process."], [2200, 1600, 5560], false),
      dataRow(["threat_type",   "TEXT",    "Categorised threat class (Buffer Overflow, Memory Leak, etc.)."], [2200, 1600, 5560], true),
      dataRow(["severity",      "TEXT",    "AI-classified severity: normal / suspicious / critical."], [2200, 1600, 5560], false),
      dataRow(["confidence",    "REAL",    "Model confidence score (0.0–1.0) for alert triage."], [2200, 1600, 5560], true),
      dataRow(["heap_delta_kb", "REAL",    "Heap growth since last scan — key metric for leak evidence."], [2200, 1600, 5560], false),
      dataRow(["remediation",   "TEXT",    "Full remediation guidance stored for audit trail completeness."], [2200, 1600, 5560], true),
    ]
  }),
  spacer(),

  h2("4.2 Remediation Advisor — Security Guidance Catalogue"),
  para("The RemediationAdvisor module maps each threat type to a prioritised list of security countermeasures drawn from industry best practices (OWASP, NIST SP 800-123, CWE Top 25 mitigations):"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360],
    rows: [
      headerRow(["Threat Type", "Primary Remediation Actions"], [3000, 6360]),
      dataRow(["Buffer Overflow", "Enable -fstack-protector-all; enforce ASLR via kernel sysctl; replace unsafe libc functions (strcpy → strncpy); enable NX bit; audit with ASan."], [3000, 6360], false),
      dataRow(["Memory Leak (Critical)", "URGENT: Audit all malloc/calloc calls for matching free(); run Valgrind --leak-check=full; implement RAII patterns; enable jemalloc profiling."], [3000, 6360], true),
      dataRow(["Memory Leak (Suspected)", "Monitor with /proc/<pid>/status; add memory checkpoints; use Python tracemalloc; audit caching structures for TTL eviction."], [3000, 6360], false),
      dataRow(["Rapid Memory Growth", "Profile with perf/gprof; check for unbounded data structures; review recursive functions; implement backpressure mechanisms."], [3000, 6360], true),
      dataRow(["Anomalous Pattern", "Compare pmap <pid> against known-good baseline; check third-party library behaviour; verify FD management; review recent code changes."], [3000, 6360], false),
    ]
  }),
  spacer(),

  h2("4.3 Audit Trail Integrity"),
  para("The SQLite database is written to data/sentinel.db. Each monitoring session creates a sessions record with start/end timestamps and the authenticated user role. All threat_events records reference their parent session_id, creating a linked audit chain from authentication to detection to remediation. The canary_checks table provides a separate record of every stack validation performed, supporting forensic reconstruction of overflow detection sequences."),
  para("In a production deployment, the database file should be protected with filesystem permissions (chmod 640), and the data/ directory should be mounted on encrypted storage to prevent tampering with the audit trail."),
  spacer(),

  h2("4.4 Incident Reporting"),
  para("The Reporter module generates two output formats aligned with security audit requirements:"),
  bullet("PDF Report (ReportLab): Styled executive summary with session metadata, event count by severity, and a full chronological threat event table with colour-coded severity indicators. Suitable for submission to security operations teams or academic review."),
  bullet("CSV Report: Raw event data export suitable for ingestion into SIEM platforms (Splunk, Elastic SIEM) or further statistical analysis."),
  spacer(),
  pageBreak(),

  // ── Chapter 5 ─────────────────────────────────────────────────────────
  h1("Chapter 5: Testing and Validation"),
  h2("5.1 Security Test Cases"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 1800, 4560],
    rows: [
      headerRow(["Test Case", "Expected Result", "Observed Result"], [3000, 1800, 4560]),
      dataRow(["AI: critical memory features injected (rss=800MB, growth=15MB/s, heap=8MB)", "CRITICAL, high confidence", "CRITICAL — 100.00%"], [3000, 1800, 4560], false),
      dataRow(["AI: normal memory features injected (rss=100MB, growth=0.1MB/s)", "NORMAL, high confidence", "NORMAL — 100.00%"], [3000, 1800, 4560], true),
      dataRow(["Model test accuracy on 20% held-out split", ">= 95%", "100.00%"], [3000, 1800, 4560], false),
      dataRow(["SQLite event persistence", "Event retrievable after logging", "PASS — 1 event logged and retrieved"], [3000, 1800, 4560], true),
      dataRow(["Authentication: 3 failed attempts", "Session rejected", "PASS — 'Authentication failed. Exiting.'"], [3000, 1800, 4560], false),
      dataRow(["PDF report generation", "Styled PDF with event table", "PASS — reports/test_report.pdf generated"], [3000, 1800, 4560], true),
      dataRow(["CSV report export", "All fields present with correct headers", "PASS — reports/test_report.csv verified"], [3000, 1800, 4560], false),
      dataRow(["Canary emulation (Linux /proc)", "Stack > 64MB flagged as overflow", "PASS on Linux; graceful fallback elsewhere"], [3000, 1800, 4560], true),
    ]
  }),
  spacer(),

  h2("5.2 False Positive / False Negative Analysis"),
  para("The synthetic training corpus is designed to minimise false positives for typical system processes. The critical class threshold (growth > 10 MB/s, heap_delta > 5 MB) is conservative enough that normal processes — including web browsers and development tools — will not trigger critical alerts under typical workloads. Suspicious alerts may occur for processes with naturally high memory churn (e.g., video encoding, large database queries); operators should tune thresholds in monitor.py to their environment's baseline."),
  spacer(),

  h2("5.3 Limitations"),
  warnBox("Known Limitations", "The AI model is trained on synthetic data; adversarially crafted exploits designed to evade ML classifiers are not addressed. Canary emulation is heuristic-based and cannot achieve the bit-level precision of compiler-inserted canaries. The system operates at ring-3 (userspace) and can be bypassed by a sufficiently privileged attacker."),
  spacer(),
  pageBreak(),

  // ── Chapter 6 ─────────────────────────────────────────────────────────
  h1("Chapter 6: Conclusion and Future Work"),
  h2("6.1 Summary"),
  para("The AI-Driven OS Memory Sentinel delivers a functioning, tested implementation of real-time memory security monitoring that combines OS-level process introspection, stack canary emulation, heap differential leak detection, AI-powered anomaly classification, SQLite audit logging, role-based access control, and automated remediation guidance — entirely within the Python userspace toolchain at zero cost."),
  para("The project fills a documented gap in the open-source security tooling landscape: no existing free tool provides the combination of real-time monitoring, ML classification, operator-facing alerting, and integrated remediation guidance that this sentinel delivers. It is immediately applicable to educational institutions, small organisations, and development teams seeking production-grade memory security visibility without the complexity or cost of enterprise APM solutions."),
  spacer(),

  h2("6.2 Future Security Enhancements"),
  bullet("Kernel module (LKM) development to intercept brk/mmap/munmap system calls at ring-0, enabling true bit-level canary injection rather than /proc heuristics."),
  bullet("Production ML training on real system traces collected from diverse Linux workloads to reduce false-positive rates and improve adversarial robustness."),
  bullet("Integration with SIEM platforms via syslog forwarding or direct Elasticsearch/Splunk API ingestion for enterprise-grade alert management."),
  bullet("HTTPS-secured web dashboard to replace the CLI interface for multi-operator deployment."),
  bullet("Digital signature of audit logs to provide cryptographic tamper evidence for compliance use cases (ISO 27001, SOC 2)."),
  spacer(),

  h2("References"),
  para("Szekeres, L. et al. (2013). SoK: Eternal War in Memory. IEEE Security and Privacy (Oakland), pp. 48–62."),
  para("Serebryany, K. et al. (2012). AddressSanitizer: A Fast Address Sanity Checker. USENIX ATC."),
  para("Nethercote, N. & Seward, J. (2007). Valgrind: A Framework for Heavyweight Dynamic Binary Instrumentation. ACM PLDI."),
  para("OWASP Foundation (2021). OWASP Top 10: A05:2021 — Security Misconfiguration. owasp.org."),
  para("NIST (2013). SP 800-123: Guide to General Server Security. National Institute of Standards and Technology."),
  para("Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. JMLR 12, pp. 2825–2830."),
  para("CWE Program (2023). CWE Top 25 Most Dangerous Software Weaknesses. MITRE Corporation."),
];

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: DKRED }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: RED }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial", color: MGRAY }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "AI-Driven OS Memory Sentinel  |  Information Security  |  University of Lahore  |  Spring 2026", size: 18, color: "888888", font: "Arial" })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RED, space: 1 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: "Malaika Asghar (70144776)  |  Maryam Ijaz (70144999)  |  Submitted to: Sir Habib Ur Rahman", size: 18, color: "888888", font: "Arial" })], border: { top: { style: BorderStyle.SINGLE, size: 4, color: RED, space: 1 } } })] }) },
    children,
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/mnt/user-data/outputs/InfoSec_Memory_Sentinel_Report.docx", buf);
  console.log("InfoSec doc written.");
});
