from fastapi import FastAPI, HTTPException
from .schemas import ScoreIn, ScoreOut, HealthOut
from .model_registry import load_model
from .reasons import rule_based_reasons
from .config import FEATURES_REQUIRED

import numpy as np

app = FastAPI(title="CS-ML Service", version="1.0")

# Load model on startup
MODEL, META = load_model(None)
FEATURE_ORDER = META["feature_order"]           # list[str]
ENCODER = META.get("encoders", {})              # e.g., region one-hot mapping
THRESHOLDS = META.get("thresholds", {"med":0.4, "high":0.7})
MODEL_VERSION = META["version"]

def vectorize(feat: dict) -> np.ndarray:
    # Basic: numerical passthrough + region one-hot (stored in META)
    x = []
    for f in FEATURE_ORDER:
        if f.startswith("region__"):
            reg = f.split("__",1)[1]
            val = 1.0 if feat.get("region","US")==reg else 0.0
            x.append(val)
        else:
            x.append(float(feat.get(f, 0.0)))
    return np.asarray(x, dtype=float)

@app.get("/healthz", response_model=HealthOut)
def health():
    return HealthOut(ok=True, modelVersion=MODEL_VERSION)

@app.post("/score", response_model=ScoreOut)
def score(inp: ScoreIn):
    # Basic input check
    if not inp.features:
        raise HTTPException(400, "features are required for scoring in MVP")
    # Fill missing with sensible defaults
    for k in FEATURES_REQUIRED:
        inp.features.setdefault(k, 0 if k!="region" else "US")

    x = vectorize(inp.features).reshape(1, -1)
    # LightGBM sklearn API uses predict_proba for binary
    if hasattr(MODEL, "predict_proba"):
        p = float(MODEL.predict_proba(x)[0,1])
    else:
        p = float(MODEL.predict(x))  # fallback if calibrated model wrapper
    tier = "high" if p >= THRESHOLDS["high"] else "med" if p >= THRESHOLDS["med"] else "low"
    reasons = rule_based_reasons(inp.features)

    return ScoreOut(risk=round(p, 6), tier=tier, reasons=reasons, modelVersion=MODEL_VERSION)