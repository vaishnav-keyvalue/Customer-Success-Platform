import os, requests, pandas as pd
from typing import Literal

CS_EXPORT_URL = os.getenv("CS_EXPORT_URL", "http://localhost:4000/ml/export")

def load_snapshots_from_cs(start_iso: str, end_iso: str) -> pd.DataFrame:
    """Pull labeled snapshots from CS API export."""
    url = f"{CS_EXPORT_URL}?from={start_iso}&to={end_iso}"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    rows = resp.json()
    # rows: list of dicts with fields: userId, snapshot_ts, features{}, label
    df = pd.json_normalize(rows, sep="__")
    # features.* columns become feature_name columns; region stays string
    return df