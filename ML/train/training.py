import os, json, time
import pandas as pd
import numpy as np
from dateutil import parser as dtp
from sklearn.model_selection import GroupShuffleSplit
from lightgbm import LGBMClassifier
from joblib import dump
from .data_sources import load_snapshots_from_cs
from .utils import evaluate, choose_thresholds
from app.model_registry import save_model

MODEL_DIR = os.getenv("MODEL_DIR", "./model_store")

# Define the canonical feature set (must match CS features)
BASE_FEATURES = [
    "activity_7d","activity_30d","time_since_last_use_days",
    "failed_renewals_30d","tickets_7d","tickets_30d","plan_value","usage_score"
]
REGION_VOCAB = ["IN","SG","US","EU"]

def prepare(df: pd.DataFrame):
    # Expect columns: snapshot_ts, label, features__<name>, features__region
    df = df.copy()
    df["snapshot_ts"] = pd.to_datetime(df["snapshot_ts"])
    df["label"] = df["label"].astype(int)

    # Bring features into flat columns
    for f in BASE_FEATURES:
        if f"features__{f}" not in df.columns:
            df[f"features__{f}"] = 0
    # One-hot region
    reg = df.get("features__region", pd.Series(["US"] * len(df)))
    for r in REGION_VOCAB:
        df[f"region__{r}"] = (reg == r).astype(int)

    feature_order = BASE_FEATURES + [f"region__{r}" for r in REGION_VOCAB]
    X = df[[f"features__{f}" for f in BASE_FEATURES] + [f"region__{r}" for r in REGION_VOCAB]].to_numpy(dtype=float)
    y = df["label"].to_numpy(dtype=int)
    groups = df["snapshot_ts"].dt.to_period("W").astype(str)  # weekly grouping for time-aware split
    return X, y, groups, feature_order

def time_split(X, y, groups):
    gss = GroupShuffleSplit(n_splits=1, train_size=0.8, random_state=42)
    train_idx, val_idx = next(gss.split(X, y, groups))
    return train_idx, val_idx

def train_model(start_iso: str, end_iso: str):
    df = load_snapshots_from_cs(start_iso, end_iso)
    if df.empty:
        raise RuntimeError("No snapshots returned for training window")
    
    X, y, groups, feature_order = prepare(df)
    
    # Check class distribution
    unique, counts = np.unique(y, return_counts=True)
    class_distribution = dict(zip(unique, counts))
    print(f"📊 Class Distribution: {class_distribution}")
    
    if len(unique) < 2:
        print("⚠️  Warning: Only one class present in labels!")
        print("   This will prevent proper model training.")
        print(f"   All labels are: {unique[0]}")
        # Continue anyway to test the evaluation fix
    
    train_idx, val_idx = time_split(X, y, groups)
    Xtr, Xva, ytr, yva = X[train_idx], X[val_idx], y[train_idx], y[val_idx]
    
    # Check validation split class distribution too
    unique_val, counts_val = np.unique(yva, return_counts=True)
    val_distribution = dict(zip(unique_val, counts_val))
    print(f"📊 Validation Class Distribution: {val_distribution}")

    clf = LGBMClassifier(
        n_estimators=600, learning_rate=0.03,
        max_depth=-1, num_leaves=63,
        subsample=0.9, colsample_bytree=0.8,
        reg_alpha=0.1, reg_lambda=0.2,
        random_state=42, n_jobs=-1
    )
    clf.fit(Xtr, ytr)
    p_va = clf.predict_proba(Xva)[:,1]
    metrics = evaluate(yva, p_va)
    thresholds = choose_thresholds(p_va, high_q=0.85, med_q=0.60)

    version = f"risk-lgbm-{pd.Timestamp.utcnow().strftime('%Y-%m-%d-%H%M')}"
    meta = {
        "version": version,
        "trained_from": start_iso,
        "trained_to": end_iso,
        "training_samples": len(X),
        "validation_samples": len(Xva),
        "feature_order": feature_order,
        "encoders": {"region_vocab": REGION_VOCAB},
        "thresholds": thresholds,
        "metrics": metrics
    }
    save_model(clf, meta, version)
    return meta

if __name__ == "__main__":
    # Example: train on last 90 days fully labeled (you can pass custom dates via env)
    end = pd.Timestamp.utcnow().floor("D") - pd.Timedelta(days=30)  # ensure labels exist
    start = end - pd.Timedelta(days=90)
    meta = train_model(start.isoformat(), end.isoformat())
    print(json.dumps(meta, indent=2))