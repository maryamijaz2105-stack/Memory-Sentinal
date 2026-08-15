"""
modules/anomaly_engine.py
Scikit-learn based AI anomaly classification engine.
Detects buffer overflows and memory leaks from process memory features.
"""

import numpy as np
import pickle
import os
from typing import Tuple, Dict


# ── Feature set for each memory sample ──────────────────────────────────────
# [rss_mb, vms_mb, rss_growth_rate, heap_delta_kb, fd_count, percent]

NORMAL      = 0
SUSPICIOUS  = 1
CRITICAL    = 2

SEVERITY_LABELS = {NORMAL: "normal", SUSPICIOUS: "suspicious", CRITICAL: "critical"}
SEVERITY_COLORS = {NORMAL: "green", SUSPICIOUS: "yellow", CRITICAL: "red"}


def _generate_training_data():
    """Generate synthetic labelled memory patterns for training."""
    rng = np.random.default_rng(42)

    # Normal behaviour: stable RSS, low growth, balanced heap
    normal_n = 800
    normal = np.column_stack([
        rng.uniform(50, 300, normal_n),       # rss_mb
        rng.uniform(200, 800, normal_n),      # vms_mb
        rng.uniform(-0.5, 1.5, normal_n),     # rss_growth_rate MB/s
        rng.uniform(-100, 200, normal_n),     # heap_delta_kb (roughly balanced alloc/free)
        rng.integers(5, 60, normal_n),        # fd_count
        rng.uniform(0.5, 8, normal_n),        # memory percent
    ])

    # Suspicious: moderate growth, unbalanced heap
    susp_n = 400
    suspicious = np.column_stack([
        rng.uniform(200, 600, susp_n),
        rng.uniform(600, 1500, susp_n),
        rng.uniform(2.0, 8.0, susp_n),        # elevated growth
        rng.uniform(400, 2000, susp_n),       # heap growing, no frees
        rng.integers(50, 120, susp_n),
        rng.uniform(8, 20, susp_n),
    ])

    # Critical: rapid growth, massive heap leak or overflow pattern
    crit_n = 200
    critical = np.column_stack([
        rng.uniform(500, 2000, crit_n),
        rng.uniform(1500, 8000, crit_n),
        rng.uniform(10.0, 50.0, crit_n),      # very high growth rate
        rng.uniform(5000, 50000, crit_n),     # massive heap delta
        rng.integers(100, 300, crit_n),
        rng.uniform(20, 80, crit_n),
    ])

    X = np.vstack([normal, suspicious, critical])
    y = np.array([NORMAL] * normal_n + [SUSPICIOUS] * susp_n + [CRITICAL] * crit_n)
    return X, y


class AnomalyEngine:
    MODEL_PATH = "data/anomaly_model.pkl"

    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(self.MODEL_PATH):
            with open(self.MODEL_PATH, "rb") as f:
                bundle = pickle.load(f)
            self.model = bundle["model"]
            self.scaler = bundle["scaler"]
        else:
            self._train()

    def _train(self):
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import train_test_split

        X, y = _generate_training_data()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        self.scaler = StandardScaler()
        X_train_s = self.scaler.fit_transform(X_train)
        X_test_s  = self.scaler.transform(X_test)

        self.model = RandomForestClassifier(
            n_estimators=100, max_depth=10, random_state=42, n_jobs=-1
        )
        self.model.fit(X_train_s, y_train)

        acc = self.model.score(X_test_s, y_test)
        print(f"[AI Engine] Model trained — Test accuracy: {acc:.2%}")

        os.makedirs("data", exist_ok=True)
        with open(self.MODEL_PATH, "wb") as f:
            pickle.dump({"model": self.model, "scaler": self.scaler}, f)

    def classify(self, rss_mb: float, vms_mb: float, rss_growth_rate: float,
                 heap_delta_kb: float, fd_count: int, percent: float
                 ) -> Tuple[str, float]:
        """
        Classify a memory sample.
        Returns (severity_label, confidence_score 0-1).
        """
        features = np.array([[rss_mb, vms_mb, rss_growth_rate,
                               heap_delta_kb, fd_count, percent]])
        features_s = self.scaler.transform(features)
        pred_class = self.model.predict(features_s)[0]
        proba = self.model.predict_proba(features_s)[0]
        confidence = float(proba[pred_class])
        return SEVERITY_LABELS[pred_class], confidence

    def batch_classify(self, samples: list) -> list:
        """Classify a list of feature dicts. Returns list of (severity, confidence)."""
        results = []
        for s in samples:
            label, conf = self.classify(
                s.get("rss_mb", 0), s.get("vms_mb", 0),
                s.get("rss_growth_rate", 0), s.get("heap_delta_kb", 0),
                s.get("fd_count", 0), s.get("percent", 0)
            )
            results.append((label, conf))
        return results
