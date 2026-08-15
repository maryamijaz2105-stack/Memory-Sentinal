"""
modules/remediation.py
AI-powered Remediation Advisor.
Maps detected threat types to actionable developer guidance.
"""


REMEDIATION_MAP = {
    "Buffer Overflow": [
        "Enable stack canaries via -fstack-protector-all at compile time.",
        "Enforce ASLR: echo 2 > /proc/sys/kernel/randomize_va_space",
        "Replace unsafe functions: use strncpy/snprintf instead of strcpy/sprintf.",
        "Enable NX bit protection (non-executable stack) via kernel configuration.",
        "Consider AddressSanitizer (ASan) during development: compile with -fsanitize=address.",
        "Review all array indexing operations for out-of-bounds writes.",
    ],
    "Memory Leak (Critical)": [
        "URGENT: Audit every malloc/calloc/realloc call — ensure matching free() exists.",
        "Use Valgrind: valgrind --leak-check=full ./your_binary to identify exact leak sources.",
        "Check for dangling references preventing garbage collection (Python/Java).",
        "Review destructor logic and RAII patterns in C++ code.",
        "Implement a memory pool with explicit lifecycle to bound growth.",
        "Consider enabling jemalloc profiling for detailed allocation traces.",
    ],
    "Memory Leak (Suspected)": [
        "Monitor heap growth over time with: watch -n1 cat /proc/<pid>/status | grep VmRSS",
        "Add memory usage checkpoints to identify growing allocations.",
        "Use Python tracemalloc or C Valgrind for allocation tracing.",
        "Audit caching structures — ensure TTL eviction or size bounds are in place.",
    ],
    "Rapid Memory Growth": [
        "Profile the application with perf or gprof to identify the allocating code path.",
        "Check for unbounded data structures (lists, queues growing without limits).",
        "Review recursive functions for potential stack exhaustion.",
        "Implement rate limiting or backpressure to control input-driven memory growth.",
    ],
    "Anomalous Allocation Pattern": [
        "Review recently changed code for new allocation patterns.",
        "Compare current memory map with a known-good baseline using pmap <pid>.",
        "Check for third-party library memory misuse or unexpected background threads.",
        "Verify file descriptor management — excessive FDs may indicate resource leaks.",
    ],
    "Normal": [
        "No action required. Continue monitoring.",
    ],
}

SEVERITY_PREFIX = {
    "critical":   "🔴 CRITICAL — Immediate action required.",
    "suspicious": "🟡 SUSPICIOUS — Investigate promptly.",
    "normal":     "🟢 NORMAL — No action required.",
}


class RemediationAdvisor:
    def suggest(self, threat_type: str, severity: str, pid: int, process_name: str) -> str:
        steps = REMEDIATION_MAP.get(threat_type, REMEDIATION_MAP["Anomalous Allocation Pattern"])
        prefix = SEVERITY_PREFIX.get(severity, "")
        lines = [f"{prefix}"]
        lines.append(f"Process: {process_name} (PID {pid})")
        lines.append(f"Threat: {threat_type}")
        lines.append("Recommended Actions:")
        for i, step in enumerate(steps, 1):
            lines.append(f"  {i}. {step}")
        return "\n".join(lines)

    def format_short(self, threat_type: str) -> str:
        steps = REMEDIATION_MAP.get(threat_type, [])
        if not steps:
            return "No specific guidance."
        return steps[0]  # First step as a summary
