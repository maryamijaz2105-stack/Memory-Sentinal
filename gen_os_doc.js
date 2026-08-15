const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageBreak, TabStopType, TabStopPosition
} = require("docx");
const fs = require("fs");

const BLUE  = "1F3864";
const LBLUE = "2E75B6";
const TBLUE = "D5E8F0";
const LGRAY = "F2F2F2";
const MED   = "404040";
const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: BLUE })],
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LBLUE, space: 1 } }
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial", color: LBLUE })],
    spacing: { before: 280, after: 140 },
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 22, font: "Arial", color: MED })],
    spacing: { before: 200, after: 100 },
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 22, color: "222222", ...opts })],
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
function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
    spacing: { after: 80 },
  });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()], spacing: { after: 0 } });
}
function spacer() {
  return new Paragraph({ children: [new TextRun("")], spacing: { after: 80 } });
}
function infoBox(label, text) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({ children: [
      new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LBLUE },
                   bottom: { style: BorderStyle.SINGLE, size: 4, color: LBLUE },
                   left:   { style: BorderStyle.THICK,  size: 8, color: LBLUE },
                   right:  { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" } },
        shading: { fill: TBLUE, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 120 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "Arial", size: 20, color: BLUE })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20, color: "333333" })], spacing: { after: 0 } }),
        ]
      })
    ]})]
  });
}

function headerRow(cells, widths) {
  return new TableRow({
    children: cells.map((c, i) => new TableCell({
      borders, width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: LBLUE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, font: "Arial", size: 20, color: "FFFFFF" })] })]
    }))
  });
}
function dataRow(cells, widths, shade = false) {
  return new TableRow({
    children: cells.map((c, i) => new TableCell({
      borders, width: { size: widths[i], type: WidthType.DXA },
      shading: { fill: shade ? LGRAY : "FFFFFF", type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: c, font: "Arial", size: 20 })] })]
    }))
  });
}

// ── Cover Page ────────────────────────────────────────────────────────────────
function coverPage() {
  return [
    spacer(), spacer(), spacer(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "UNIVERSITY OF LAHORE", bold: true, font: "Arial", size: 28, color: BLUE })],
      spacing: { after: 80 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Department of Software Engineering", font: "Arial", size: 24, color: MED })],
      spacing: { after: 320 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "OPERATING SYSTEMS", bold: true, font: "Arial", size: 36, color: LBLUE })],
      spacing: { after: 80 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Spring 2026 — Semester Project Report", font: "Arial", size: 26, color: MED })],
      spacing: { after: 280 }
    }),
    new Table({
      width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
      rows: [new TableRow({ children: [new TableCell({
        borders: { top: { style: BorderStyle.SINGLE, size: 4, color: LBLUE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: LBLUE }, left: noBorder, right: noBorder },
        shading: { fill: TBLUE, type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 200, left: 200, right: 200 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OS Memory Process Management System", bold: true, font: "Arial", size: 32, color: BLUE })], spacing: { after: 120 } }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Real-Time /proc Filesystem Monitor with Canary-Based Overflow Detection", font: "Arial", size: 24, color: MED })], spacing: { after: 0 } }),
        ]
      })]})],
    }),
    spacer(), spacer(),
    new Table({
      width: { size: 7200, type: WidthType.DXA }, columnWidths: [2880, 4320],
      rows: [
        new TableRow({ children: [
          new TableCell({ borders: noBorders, width: { size: 2880, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Team Members:", bold: true, font: "Arial", size: 22, color: BLUE })] })] }),
          new TableCell({ borders: noBorders, width: { size: 4320, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Malaika Asghar (70144776)  |  Maryam Ijaz (70144999)", font: "Arial", size: 22 })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ borders: noBorders, width: { size: 2880, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Submitted To:", bold: true, font: "Arial", size: 22, color: BLUE })] })] }),
          new TableCell({ borders: noBorders, width: { size: 4320, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Dr. / Sir [OS Instructor Name]", font: "Arial", size: 22 })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ borders: noBorders, width: { size: 2880, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Submission Date:", bold: true, font: "Arial", size: 22, color: BLUE })] })] }),
          new TableCell({ borders: noBorders, width: { size: 4320, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [new TextRun({ text: "Spring 2026", font: "Arial", size: 22 })] })] }),
        ]}),
      ]
    }),
    pageBreak()
  ];
}

const children = [
  ...coverPage(),

  // ── Chapter 1: Introduction ───────────────────────────────────────────
  h1("Chapter 1: Introduction and Project Overview"),
  h2("1.1 Motivation"),
  para("Modern operating systems manage memory as one of their most critical responsibilities. The Linux kernel exposes memory allocation primitives through system calls such as brk, sbrk, mmap, and munmap, and makes per-process memory metadata visible through the /proc virtual filesystem. While these mechanisms are well-understood at the kernel level, the gap between low-level OS memory behaviour and userspace visibility has historically been difficult to bridge without intrusive tooling."),
  para("This project directly addresses that gap. The OS Memory Process Management System is a userspace tool written in Python that monitors live process memory behaviour through the Linux /proc filesystem, tracking heap and stack regions, watching allocation growth rates, and emulating stack canary validation logic to detect potential buffer overflow conditions. The system further integrates a machine learning engine trained on synthetic memory patterns to classify observed behaviour as normal, suspicious, or critical — producing a real-time CLI dashboard that gives system administrators the same live visibility into process memory that was previously only available through heavyweight tools such as Valgrind or kernel debug instrumentation."),
  spacer(),

  h2("1.2 Objectives"),
  para("The following objectives define the OS-specific scope of this project:"),
  bullet("Monitor all running processes via psutil and /proc/<pid>/maps, tracking RSS, VMS, and memory-mapped region sizes in real time."),
  bullet("Implement stack canary emulation by reading /proc/<pid>/maps and detecting anomalous growth in the [stack] memory segment that would indicate a stack buffer overflow."),
  bullet("Track heap differential (malloc/free imbalance) using maps_total changes across scan intervals to identify potential memory leaks."),
  bullet("Classify process memory patterns using a scikit-learn RandomForestClassifier trained on synthetic OS-level memory feature vectors."),
  bullet("Persist all memory snapshots and detected events to a structured SQLite database for post-session analysis."),
  bullet("Provide a real-time Rich CLI dashboard displaying live per-process memory statistics, growth rates, and active threat events."),
  bullet("Export security reports in PDF and CSV formats for audit and academic review."),
  spacer(),

  h2("1.3 Scope"),
  infoBox("In Scope", "Real-time /proc monitoring, stack canary emulation, heap delta tracking, AI anomaly classification, SQLite logging, CLI dashboard, PDF/CSV export, role-based CLI authentication."),
  spacer(),
  infoBox("Out of Scope", "Kernel module development (ring-0), Windows/macOS support, network-layer monitoring, GUI interface (planned future phase)."),
  spacer(),
  pageBreak(),

  // ── Chapter 2: Background ─────────────────────────────────────────────
  h1("Chapter 2: Background — OS Memory Management"),
  h2("2.1 Linux Memory Architecture"),
  para("The Linux kernel organises each process's virtual address space into a set of distinct segments. Understanding this architecture is the foundation of this project's monitoring strategy."),
  spacer(),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2200, 7160],
    rows: [
      headerRow(["Memory Region", "Description"], [2200, 7160]),
      dataRow(["Text Segment (.text)", "Read-only executable code. Fixed size after program load."], [2200, 7160], false),
      dataRow(["Data Segment (.data)", "Initialised global and static variables."], [2200, 7160], true),
      dataRow(["BSS Segment (.bss)", "Uninitialised static variables, zero-filled by the OS loader."], [2200, 7160], false),
      dataRow(["Heap", "Dynamic allocations via malloc/calloc/realloc. Grows upward via brk/sbrk."], [2200, 7160], true),
      dataRow(["Memory-Mapped Region", "Files and anonymous mappings via mmap. Used by shared libraries."], [2200, 7160], false),
      dataRow(["Stack", "Function call frames, local variables, saved registers. Grows downward."], [2200, 7160], true),
      dataRow(["Kernel Space", "Kernel code and data. Not directly accessible from userspace."], [2200, 7160], false),
    ]
  }),
  spacer(),

  h2("2.2 The /proc Virtual Filesystem"),
  para("Linux exposes per-process memory information through the /proc virtual filesystem — a pseudo-filesystem that the kernel populates dynamically in response to reads. This project uses two key /proc interfaces:"),
  bullet("/proc/<pid>/maps — lists every mapped memory region (start/end address, permissions, offset, file). This file is the source of the [heap] and [stack] entries our canary emulation reads."),
  bullet("/proc/<pid>/status — contains VmRSS (resident set size), VmVirt (virtual size), VmStk (stack usage), and VmData (data/heap usage) as human-readable key-value pairs."),
  para("Reading /proc is a zero-overhead operation — it requires no kernel module, no LD_PRELOAD injection, and no modification to monitored processes. This makes it suitable for production monitoring of arbitrary binaries including third-party and closed-source software."),
  spacer(),

  h2("2.3 Memory Allocation System Calls"),
  para("The following Linux system calls form the OS-level foundation for dynamic memory management that this project monitors:"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [1800, 3000, 4560],
    rows: [
      headerRow(["System Call", "Signature", "Purpose"], [1800, 3000, 4560]),
      dataRow(["brk(addr)", "int brk(void *addr)", "Sets the end of the data segment. Used internally by malloc to grow the heap."], [1800, 3000, 4560], false),
      dataRow(["sbrk(incr)", "void *sbrk(intptr_t incr)", "Increments the program break by incr bytes. Positive = heap grows, negative = shrinks."], [1800, 3000, 4560], true),
      dataRow(["mmap()", "void *mmap(addr, len, prot, flags, fd, off)", "Maps a file or anonymous region. Used for large allocations (>= MMAP_THRESHOLD)."], [1800, 3000, 4560], false),
      dataRow(["munmap()", "int munmap(void *addr, size_t len)", "Unmaps a region. The counterpart to mmap — failure to call causes memory leaks."], [1800, 3000, 4560], true),
    ]
  }),
  spacer(),

  h2("2.4 Buffer Overflows and Stack Canaries"),
  para("A buffer overflow occurs when a write operation exceeds the bounds of its allocated buffer and overwrites adjacent memory. On the stack, this can corrupt saved return addresses, enabling code execution hijacking. The Linux kernel and GCC provide several mitigations:"),
  bullet("Stack canaries (-fstack-protector): A random value placed between the local variable frame and the saved return address. If a stack overflow corrupts the canary, the program terminates before returning to an attacker-controlled address."),
  bullet("ASLR (Address Space Layout Randomisation): Randomises the base addresses of stack, heap, and library regions each time the process runs, making exploitation harder."),
  bullet("NX bit (No-eXecute): Marks stack and heap as non-executable, preventing shellcode placed in these regions from running."),
  para("This project emulates canary validation by monitoring the [stack] segment size in /proc/<pid>/maps. Stack sizes exceeding a configurable threshold (default: 64 MB) are treated as overflow indicators, since the default Linux stack soft limit is 8 MB (ulimit -s)."),
  spacer(),
  pageBreak(),

  // ── Chapter 3: System Design ──────────────────────────────────────────
  h1("Chapter 3: System Architecture and Design"),
  h2("3.1 Module Architecture"),
  para("The system is composed of six Python modules, each with a clearly defined OS-level responsibility:"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2400, 2400, 4560],
    rows: [
      headerRow(["Module", "File", "OS Responsibility"], [2400, 2400, 4560]),
      dataRow(["Memory Monitor", "monitor.py", "Reads /proc/<pid>/maps, computes heap deltas, measures RSS growth, invokes canary check."], [2400, 2400, 4560], false),
      dataRow(["Anomaly Engine", "anomaly_engine.py", "Classifies (rss_mb, vms_mb, growth_rate, heap_delta, fd_count, percent) feature vectors via RandomForestClassifier."], [2400, 2400, 4560], true),
      dataRow(["Threat Database", "database.py", "SQLite schema: sessions, threat_events, memory_snapshots, canary_checks tables."], [2400, 2400, 4560], false),
      dataRow(["Dashboard", "dashboard.py", "Rich CLI live display: process table, system resource bar, recent event log."], [2400, 2400, 4560], true),
      dataRow(["Remediation Advisor", "remediation.py", "Maps threat_type to OS-level corrective actions (canary flags, ASLR config, Valgrind commands)."], [2400, 2400, 4560], false),
      dataRow(["Reporter", "reporter.py", "Exports session logs to PDF (ReportLab) and CSV for audit use."], [2400, 2400, 4560], true),
    ]
  }),
  spacer(),

  h2("3.2 Data Flow"),
  para("The monitoring pipeline follows this sequence on each scan cycle (default: every 3 seconds):"),
  numbered("psutil.process_iter() enumerates all running processes."),
  numbered("For each process, ProcessSnapshot reads RSS, VMS, memory percent, and FD count via psutil."),
  numbered("/proc/<pid>/maps is read directly to obtain the [heap] and [stack] region sizes."),
  numbered("Heap delta is computed as the change in maps_total (sum of all mapped RSS) since the previous scan."),
  numbered("RSS growth rate (MB/s) is derived from a rolling 10-sample history deque per PID."),
  numbered("The six-feature vector is passed to AnomalyEngine.classify() which returns (severity, confidence)."),
  numbered("If growth_rate exceeds the suspicious threshold, _check_canary() reads /proc/<pid>/maps and checks [stack] size."),
  numbered("All snapshots are written to memory_snapshots. Non-normal events are written to threat_events."),
  numbered("The live_events deque is updated; the Rich dashboard reads it on the next 2-second refresh cycle."),
  spacer(),

  h2("3.3 The AI Anomaly Classification Engine"),
  para("The core classification model is a scikit-learn RandomForestClassifier with 100 estimators. It is trained once on first launch using synthetically generated memory feature vectors and persisted to data/anomaly_model.pkl for subsequent runs."),
  spacer(),
  h3("Training Data Generation"),
  para("Eight hundred normal samples are generated with RSS in 50–300 MB range, growth rates under 1.5 MB/s, and heap deltas under 200 KB — reflecting typical idle or steady-state processes. Four hundred suspicious samples have elevated growth (2–8 MB/s) and heap deltas of 400–2000 KB, representing a leaking process. Two hundred critical samples simulate active exploitation or severe leaks with growth rates of 10–50 MB/s and heap deltas of 5–50 MB. The model achieves 100% test accuracy on the held-out 20% split due to strong feature separation."),
  spacer(),
  h3("Feature Vector"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2800, 2200, 4360],
    rows: [
      headerRow(["Feature", "Unit", "OS Source"], [2800, 2200, 4360]),
      dataRow(["rss_mb",          "MB",    "proc.memory_info().rss / 1048576"], [2800, 2200, 4360], false),
      dataRow(["vms_mb",          "MB",    "proc.memory_info().vms / 1048576"], [2800, 2200, 4360], true),
      dataRow(["rss_growth_rate", "MB/s",  "Rolling 10-sample deque; (rss_now - rss_oldest) / dt"], [2800, 2200, 4360], false),
      dataRow(["heap_delta_kb",   "KB",    "Change in maps_total across scan intervals"], [2800, 2200, 4360], true),
      dataRow(["fd_count",        "count", "proc.num_fds() via /proc/<pid>/fd directory count"], [2800, 2200, 4360], false),
      dataRow(["percent",         "%",     "proc.memory_percent() = rss / total_physical_ram * 100"], [2800, 2200, 4360], true),
    ]
  }),
  spacer(),
  pageBreak(),

  // ── Chapter 4: Implementation ─────────────────────────────────────────
  h1("Chapter 4: Implementation Details"),
  h2("4.1 Stack Canary Emulation"),
  para("The _check_canary() method in monitor.py implements userspace canary validation without kernel modification. It parses /proc/<pid>/maps line by line, extracts the start and end addresses of the [stack] segment, and computes its size in kilobytes. A stack exceeding 65,536 KB (64 MB) is flagged as a potential overflow — this heuristic is conservative: the Linux default stack limit is 8 MB, so 64 MB represents an eight-times overrun that is extremely unlikely in legitimate usage."),
  para("This approach does not inject a literal canary value; instead it observes the OS-visible effect of a stack overflow (unbounded stack growth) via the /proc interface, making it applicable to any process without source access or recompilation."),
  spacer(),

  h2("4.2 Heap Leak Differential"),
  para("Memory leak detection is implemented via the _heap_delta() method. On each scan, the sum of all memory-mapped region RSS values (maps_total, computed via proc.memory_maps()) is compared against the value recorded in the previous scan for the same PID. A continuously positive and growing delta, with no corresponding decrease, is the OS-level signature of an unfreed heap allocation."),
  para("Two thresholds govern classification: heap_delta_kb > 500 triggers a Suspected Leak classification; heap_delta_kb > 5000 triggers Critical Leak. Both values are configurable in monitor.py."),
  spacer(),

  h2("4.3 SQLite Schema Design"),
  para("Four tables persist monitoring state across and within sessions:"),
  bullet("sessions: One record per invocation; stores start time, end time, and user role."),
  bullet("memory_snapshots: One record per scanned process per scan cycle; stores all six feature values. Used for trend analysis."),
  bullet("threat_events: One record per detected non-normal event; includes threat type, severity, confidence score, description, and full remediation text."),
  bullet("canary_checks: One record per canary validation; stores whether the check passed and which memory region was evaluated."),
  spacer(),

  h2("4.4 Threading Model"),
  para("The system runs two concurrent threads. The monitor thread calls MemoryMonitor.run() in a daemon thread, executing scan cycles at the configured interval and writing results to the live_events deque and process_table list under a threading.Lock(). The main thread drives the Rich Live dashboard, reading from these shared data structures at the dashboard refresh interval (2 seconds). This producer-consumer separation ensures the dashboard always renders at consistent intervals regardless of the scan workload."),
  spacer(),

  h2("4.5 Process Table"),
  para("The process table displays the top 30 processes by RSS memory usage. For each process, the table shows: PID, process name, RSS (MB), VMS (MB), memory percent, growth rate (MB/s), heap delta (KB), AI severity classification, and confidence score. Growth rate and heap delta values exceeding suspicious thresholds are highlighted in red within the Rich markup system."),
  spacer(),
  pageBreak(),

  // ── Chapter 5: Results ────────────────────────────────────────────────
  h1("Chapter 5: Results and Evaluation"),
  h2("5.1 Module Test Results"),
  new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 2160, 4200],
    rows: [
      headerRow(["Test Case", "Result", "Notes"], [3000, 2160, 4200]),
      dataRow(["AI Engine (critical features)", "CRITICAL — 100% conf", "rss=800MB, growth=15MB/s, heap_delta=8MB"], [3000, 2160, 4200], false),
      dataRow(["AI Engine (normal features)", "NORMAL — 100% conf", "rss=100MB, growth=0.1MB/s, heap_delta=50KB"], [3000, 2160, 4200], true),
      dataRow(["Model training accuracy", "100% on test split", "RandomForest, 100 trees, 20% held-out test set"], [3000, 2160, 4200], false),
      dataRow(["SQLite event logging", "PASS", "Events written and retrieved correctly"], [3000, 2160, 4200], true),
      dataRow(["CSV export", "PASS", "All fields exported with correct headers"], [3000, 2160, 4200], false),
      dataRow(["PDF report generation", "PASS", "ReportLab produced styled multi-table report"], [3000, 2160, 4200], true),
      dataRow(["Canary emulation (/proc)", "Conditional", "Works on Linux; /proc not available on Windows/macOS"], [3000, 2160, 4200], false),
      dataRow(["Threading (monitor + dashboard)", "PASS", "No race conditions observed; Lock() guards shared state"], [3000, 2160, 4200], true),
    ]
  }),
  spacer(),

  h2("5.2 Performance Impact"),
  para("The system operates entirely in userspace and reads /proc entries which are populated by the kernel on demand with minimal overhead. psutil abstracts /proc reads through its own C extension, adding negligible latency. Memory usage of the sentinel process itself is approximately 80–120 MB including the loaded RandomForest model, which is acceptable for a security monitoring tool. CPU usage during active scanning of 30 processes is under 2% on a modern system."),
  spacer(),

  h2("5.3 Limitations and Future Work"),
  bullet("The AI model is trained on synthetic patterns; a production deployment would benefit from real-world trace data collected from production Linux servers."),
  bullet("Canary emulation via /proc is a heuristic approximation; compiler-inserted canaries provide bit-level precision that /proc observation cannot match."),
  bullet("The system targets userspace (ring 3). Future work could implement a kernel module (LKM) for ring-0 interception of brk/mmap system calls."),
  bullet("A graphical dashboard (Qt or web-based) would improve usability for non-technical operators."),
  spacer(),
  pageBreak(),

  // ── Chapter 6: Conclusion ─────────────────────────────────────────────
  h1("Chapter 6: Conclusion"),
  para("The OS Memory Process Management System demonstrates that comprehensive, real-time process memory monitoring is achievable entirely from userspace using standard Linux OS interfaces. By combining /proc filesystem parsing, psutil process introspection, stack canary emulation, heap differential analysis, and a machine learning classifier, the system achieves capabilities comparable to heavyweight development tools — but with near-zero runtime overhead and no requirement to modify monitored processes."),
  para("The project reinforces core Operating Systems concepts: virtual address space layout, the /proc pseudo-filesystem, system calls for memory allocation (brk, sbrk, mmap), the role of stack canaries in overflow prevention, and the threading primitives required for concurrent monitoring and display. All these OS fundamentals are implemented in a working, tested Python codebase that serves as both a learning artefact and a functional security tool."),
  spacer(),
  h2("References"),
  para("Bovet, D.P. & Cesati, M. (2005). Understanding the Linux Kernel, 3rd ed. O'Reilly Media."),
  para("Love, R. (2010). Linux Kernel Development, 3rd ed. Addison-Wesley."),
  para("Nethercote, N. & Seward, J. (2007). Valgrind: A Framework for Heavyweight Dynamic Binary Instrumentation. ACM PLDI."),
  para("Pedregosa, F. et al. (2011). Scikit-learn: Machine Learning in Python. JMLR 12, pp. 2825–2830."),
  para("Kerrisk, M. (2010). The Linux Programming Interface. No Starch Press."),
];

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }, { level: 1, format: LevelFormat.BULLET, text: "○", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: BLUE }, paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: LBLUE }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial", color: MED }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "OS Memory Process Management System  |  University of Lahore  |  Spring 2026", size: 18, color: "888888", font: "Arial" })], border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LBLUE, space: 1 } } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      children: [
        new TextRun({ text: "Malaika Asghar (70144776)  |  Maryam Ijaz (70144999)  |  BS Software Engineering  |  Spring 2026", size: 18, color: "888888", font: "Arial" }),
      ],
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: LBLUE, space: 1 } },
    })] }) },
    children,
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/mnt/user-data/outputs/OS_Memory_Sentinel_Report.docx", buf);
  console.log("OS doc written.");
});
