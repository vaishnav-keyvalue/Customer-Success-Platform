import os

MODEL_DIR = os.getenv("MODEL_DIR", "./model_store")
MODEL_FALLBACK = os.getenv("MODEL_FALLBACK", "latest")  # or explicit filename
FEATURES_REQUIRED = [
    "activity_7d","activity_30d","time_since_last_use_days",
    "failed_renewals_30d","tickets_7d","plan_value","region","usage_score"
]
REGION_VOCAB = ["IN","SG","US","EU"]  # one-hot encode during training; for live, we map unseen to "US"