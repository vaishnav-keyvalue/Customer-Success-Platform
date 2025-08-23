import pandas as pd
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss

def evaluate(y_true, y_prob):
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