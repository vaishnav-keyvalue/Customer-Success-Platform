import os, json, glob, joblib
from typing import Tuple, Dict, Any
from .config import MODEL_DIR

def latest_model_path() -> str:
    paths = sorted(glob.glob(os.path.join(MODEL_DIR, "*.pkl")))
    if not paths:
        raise FileNotFoundError("No models found in model_store/")
    return paths[-1]

def load_model(path: str | None = None) -> Tuple[Any, Dict]:
    p = path or latest_model_path()
    model = joblib.load(p)
    meta_path = p.replace(".pkl", ".meta.json")
    with open(meta_path, "r") as f:
        meta = json.load(f)
    return model, meta

def save_model(model, meta: Dict, version: str) -> str:
    os.makedirs(MODEL_DIR, exist_ok=True)
    pkl = os.path.join(MODEL_DIR, f"{version}.pkl")
    joblib.dump(model, pkl, compress=3)
    with open(os.path.join(MODEL_DIR, f"{version}.meta.json"), "w") as f:
        json.dump(meta, f, indent=2)
    return pkl