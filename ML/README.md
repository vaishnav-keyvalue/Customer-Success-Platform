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

**Option A: Standard Installation**
```bash
pip install -r requirements.txt
```

**Option B: If matplotlib installation fails (macOS)**
```bash
# Install system dependencies using Homebrew
brew install pkg-config freetype

# Install matplotlib separately using pre-built wheel
pip install --only-binary=matplotlib matplotlib

# Then install remaining dependencies
pip install -r requirements.txt
```

**Option C: Alternative approach for macOS**
```bash
# Use conda instead of pip for better compatibility
conda install matplotlib
pip install -r requirements.txt --no-deps
```

### 3. Validate Data Connection
```bash
python validate_data.py
```

### 4. Train Initial Model (requires CS API running)
```bash
python train_model.py --days=90
```

### 5. Test Trained Model
```bash
python test_model.py --days=30
```

### 6. Start API Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 7. Test Scoring
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
- `CS_FEATURES_URL`: CS API features endpoint (default: `http://localhost:3000/customers/features/public`)
- `TENANT_ID`: Tenant ID for API requests (default: `e0028c9a-8c4e-4f3b-9d8a-f2e5c7d1b9a4`)

## Feature Engineering

The service handles these features:

**Numerical Features:**
- `activity_7d`, `activity_30d`: User activity counts
- `time_since_last_use_days`: Days since last activity
- `failed_renewals_30d`: Failed payment attempts
- `tickets_7d`, `tickets_30d`: Support tickets created
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

1. **CS API** provides customer features via `/customers/features/public`
2. **Training module** pulls feature data, generates labels, trains models
3. **Testing module** validates model performance on recent data  
4. **Inference service** loads latest model and serves real-time scores
5. **CS API** calls `/score` with live features for policy decisions

## New Training & Testing Scripts

- `validate_data.py` - Validates data connection and quality
- `train_model.py` - Complete training pipeline with feature extraction
- `test_model.py` - Comprehensive model testing and validation
- `train/testing.py` - Testing utilities and performance analysis

## Troubleshooting

### matplotlib Installation Issues on macOS

If you encounter compilation errors when installing matplotlib (like "Command '['make']' returned non-zero exit status 2"):

1. **Install system dependencies**:
   ```bash
   # Using Homebrew
   brew install pkg-config freetype

   # Or using MacPorts
   sudo port install pkgconfig freetype
   ```

2. **Force pre-built wheel installation**:
   ```bash
   pip install --only-binary=matplotlib matplotlib
   ```

3. **Alternative: Use conda**:
   ```bash
   conda install matplotlib
   ```

4. **If using Apple Silicon (M1/M2)**:
   ```bash
   # Ensure you're using the correct architecture
   arch -x86_64 pip install matplotlib
   ```

### Common Issues

- **ImportError**: Make sure all dependencies are installed and your Python environment is activated
- **Database Connection**: Verify your database credentials in the environment configuration  
- **Model Training**: Ensure the CS API is running and accessible when training models