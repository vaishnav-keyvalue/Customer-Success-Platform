import pandas as pd
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss

def evaluate(y_true, y_prob):
    """Evaluate model performance with handling for single-class scenarios"""
    import numpy as np
    
    # Check if we have both classes
    unique_classes = np.unique(y_true)
    
    if len(unique_classes) < 2:
        print(f"⚠️  Warning: Only one class present in labels: {unique_classes}")
        print("   AUC metrics cannot be calculated. Using fallback metrics.")
        return {
            "auc_roc": 0.5,  # Random performance for single class
            "auc_pr": float(np.mean(y_true)),  # Base rate
            "brier": float(brier_score_loss(y_true, y_prob))
        }
    
    return {
        "auc_roc": float(roc_auc_score(y_true, y_prob)),
        "auc_pr":  float(average_precision_score(y_true, y_prob)),
        "brier":   float(brier_score_loss(y_true, y_prob))
    }

def choose_thresholds(y_prob, high_q=0.85, med_q=0.60):
    import numpy as np
    hi = float(np.quantile(y_prob, high_q))
    md = float(np.quantile(y_prob, med_q))
    return {"med": md, "high": hi}