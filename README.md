# AI-Driven OS Memory Sentinel

A Python-based Linux system monitoring tool that tracks process memory behaviour in real time and uses machine learning to flag potentially abnormal memory activity.

## Overview

**Memory Sentinel** monitors running processes through Linux `/proc` and `psutil`, collecting memory and process-level metrics such as RSS, VMS, memory growth, heap changes, and file-descriptor counts.

A Random Forest classifier then categorizes observed memory patterns as:

* 🟢 **Normal**
* 🟡 **Suspicious**
* 🔴 **Critical**

The project also provides a live terminal dashboard, SQLite event logging, basic role-based authentication, remediation suggestions, and PDF/CSV reporting.

## Features

* Real-time Linux process memory monitoring
* `/proc/<pid>/maps` inspection
* Stack growth / canary-style heuristic checks
* Heap and memory-growth monitoring
* ML-based anomaly classification
* SQLite storage for snapshots and threat events
* Rich CLI dashboard
* Admin and analyst roles
* Automated remediation suggestions
* PDF and CSV security reports
* Optional monitoring of a specific PID

## Tech Stack

* **Python**
* **psutil** for process and system monitoring
* **scikit-learn** for anomaly classification
* **NumPy** for feature generation
* **SQLite** for event and snapshot storage
* **Rich** for the terminal dashboard
* **ReportLab** for PDF reports

## Project Structure

```text
memory_sentinel/
├── modules/
│   ├── anomaly_engine.py
│   ├── auth.py
│   ├── dashboard.py
│   ├── database.py
│   ├── monitor.py
│   ├── remediation.py
│   └── reporter.py
├── reports/
├── main.py
├── requirements.txt
└── .gitignore
```

## Installation

Linux is recommended because the monitoring logic relies on the `/proc` filesystem.

```bash
git clone https://github.com/maryamijaz2105-stack/Memory-Sentinal.git
cd Memory-Sentinal

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

## Usage

Start the monitor:

```bash
python main.py
```

Run without authentication for demonstration purposes:

```bash
python main.py --no-auth
```

Monitor a specific process:

```bash
python main.py --pid <PID>
```

Change the scan interval:

```bash
python main.py --scan-interval 5
```

Export reports when the program exits:

```bash
python main.py --no-auth --export both
```

Available export options:

```text
--export pdf
--export csv
--export both
```

## Machine Learning

The anomaly engine uses a **Random Forest Classifier** with features including:

* RSS memory
* Virtual memory size
* RSS growth rate
* Heap delta
* File-descriptor count
* Memory percentage

The initial model is trained using synthetic memory-behaviour patterns representing normal, suspicious, and critical conditions.

## Limitations

This is an academic/experimental security monitoring project rather than a production intrusion-detection system.

The buffer-overflow and memory-leak detection mechanisms are **heuristic indicators**, and the ML model is trained on synthetic data. They should therefore be treated as anomaly signals rather than definitive proof of exploitation or vulnerabilities.

The current implementation targets **Linux** and operates from userspace without kernel modules.

## Future Improvements

* Train and evaluate the model using real-world memory traces
* Improve process-level overflow detection
* Add configurable detection thresholds
* Add a web-based dashboard
* Support additional operating systems where equivalent telemetry is available
* Add automated testing and model evaluation metrics

## License

This project was developed as an academic software engineering project.
