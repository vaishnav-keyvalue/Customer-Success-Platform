# CS-ML Service

FastAPI-based machine learning service for churn prediction in the Customer Success Platform.

## Architecture

- **FastAPI Inference Service** (`/app`): Low-latency scoring endpoint
- **Offline Training Module** (`/train`): Pulls snapshots from CS API, trains LightGBM models
- **Model Registry**: Versioned model storage and loading
- **Rule-based Reasons**: Human-readable explanations for risk scores

## API Endpoints

### POST /score
Real-time churn risk scoring.

**Request:**
```json
{
  "userId": "u_001",
  "features": {
    "activity_7d": 2,
    "activity_30d": 6,
    "time_since_last_use_days": 15,
    "failed_renewals_30d": 1,
    "tickets_7d": 0,
    "plan_value": 49,
    "region": "IN",
    "usage_score": 0.2
  }
}
```

**Response:**
```json
{
  "risk": 0.73,
  "tier": "high",
  "reasons": ["inactive_14d","payment_issue_recent"],
  "modelVersion": "risk-lgbm-2025-08-22-0900"
}
```

### GET /healthz
Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "modelVersion": "risk-lgbm-2025-08-22-0900"
}
```

## Training Data Contract

The training module expects labeled snapshots from the CS API in this format:

```json
[
  {
    "userId": "u_001",
    "snapshot_ts": "2025-07-01T00:00:00Z",
    "features": {
      "activity_7d": 3,
      "activity_30d": 10,
      "time_since_last_use_days": 2,
      "failed_renewals_30d": 0,
      "tickets_7d": 1,
      "plan_value": 49,
      "region": "IN",
      "usage_score": 0.4
    },
    "label": 0,
    "label_ts": "2025-07-31T00:00:00Z"
  }
]
```

## Quick Start

### 1. Navigate to ML Directory
```bash
cd ML
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Train Initial Model (requires CS API running)
```bash
export CS_EXPORT_URL="http://localhost:4000/ml/export"
python -m train.training
```

### 4. Start API Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 5. Test Scoring
```bash
curl -X POST localhost:8000/score -H 'content-type: application/json' -d '{
  "userId":"u_demo",
  "features":{
    "activity_7d":0,"activity_30d":2,"time_since_last_use_days":18,
    "failed_renewals_30d":1,"tickets_7d":0,"plan_value":49,"region":"IN","usage_score":0.2
  }
}'
```

## Docker

### Build
```bash
docker build -t cs-ml-service .
```

### Run (after training a model)
```bash
docker run -p 8000:8000 -v $(pwd)/model_store:/app/model_store cs-ml-service
```

## Configuration

Environment variables:

- `MODEL_DIR`: Directory for model storage (default: `./model_store`)
- `CS_EXPORT_URL`: CS API export endpoint (default: `http://localhost:4000/ml/export`)

## Feature Engineering

The service handles these features:

**Numerical Features:**
- `activity_7d`, `activity_30d`: User activity counts
- `time_since_last_use_days`: Days since last activity
- `failed_renewals_30d`: Failed payment attempts
- `tickets_7d`: Support tickets created
- `plan_value`: Subscription value
- `usage_score`: Feature usage score (0-1)

**Categorical Features:**
- `region`: One-hot encoded (IN, SG, US, EU)

## Risk Tiers

- **Low**: risk < 0.4
- **Medium**: 0.4 ≤ risk < 0.7  
- **High**: risk ≥ 0.7

Thresholds are automatically calibrated during training based on validation data quantiles.

## Reasons (Rule-based)

Current rule-based reasons:
- `inactive_14d`: No activity for 14+ days
- `payment_issue_recent`: Failed renewals in last 30 days
- `no_recent_activity`: Zero activity in last 7 days
- `low_feature_usage`: Usage score < 0.3
- `general_risk_factors`: Fallback when no specific rules trigger

## Model Versioning

Models are versioned with timestamp format: `risk-lgbm-YYYY-MM-DD-HHMM`

Each model includes:
- Trained model (`.pkl`)
- Metadata (`.meta.json`) with feature order, thresholds, metrics

## Integration with CS Platform

1. **CS API** exports labeled training snapshots via `/ml/export`
2. **Training module** pulls snapshots, trains models, registers new versions
3. **Inference service** loads latest model and serves real-time scores
4. **CS API** calls `/score` with live features for policy decisions