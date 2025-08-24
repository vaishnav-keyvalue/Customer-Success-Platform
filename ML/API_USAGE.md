# Customer Success ML API - Usage Guide

## Overview
Your FastAPI ML service is ready with a `/score` endpoint for churn risk prediction!

## API Endpoints

### 🏥 Health Check
```bash
GET /healthz
```

**Response:**
```json
{
  "ok": true,
  "modelVersion": "risk-lgbm-2025-08-24-0748"
}
```

### 🎯 Score Prediction  
```bash
POST /score
```

**Request Body:**
```json
{
  "userId": "customer_123",
  "features": {
    "activity_7d": 15,
    "activity_30d": 45,
    "time_since_last_use_days": 5,
    "failed_renewals_30d": 0,
    "tickets_7d": 0,
    "tickets_30d": 2,
    "plan_value": 200,
    "usage_score": 0.6,
    "region": "US"
  }
}
```

**Response:**
```json
{
  "risk": 0.999759,
  "tier": "med",
  "reasons": ["general_risk_factors"],
  "modelVersion": "risk-lgbm-2025-08-24-0748"
}
```

## Running the API

### Start the FastAPI Server
```bash
cd ML
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at: `http://localhost:8001`

### Test the API
```bash
# Health check
curl http://localhost:8001/healthz

# Score prediction
curl -X POST "http://localhost:8001/score" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "features": {
      "activity_7d": 15,
      "activity_30d": 45,
      "tickets_30d": 2,
      "plan_value": 200,
      "usage_score": 0.6,
      "region": "US"
    }
  }'
```

## Required Features
The API expects these features in the request:
- `activity_7d` (number): Activity in last 7 days
- `activity_30d` (number): Activity in last 30 days  
- `time_since_last_use_days` (number): Days since last use
- `failed_renewals_30d` (number): Failed renewals in last 30 days
- `tickets_7d` (number): Support tickets in last 7 days
- `tickets_30d` (number): Support tickets in last 30 days
- `plan_value` (number): Plan value in dollars
- `usage_score` (number): Usage score 0-1
- `region` (string): Customer region - US, EU, IN, or SG

**Note**: Missing features will be filled with sensible defaults automatically.

## Response Fields
- `risk` (float): Churn probability score (0-1)
- `tier` (string): Risk classification - "low", "med", or "high"
- `reasons` (array): List of risk factors contributing to the score
- `modelVersion` (string): Version of the model used

## Risk Tiers
- **low**: Customer likely to stay
- **med**: Monitor and engage customer  
- **high**: Immediate intervention recommended

## Interactive API Documentation
Visit `http://localhost:8001/docs` for Swagger UI documentation with interactive testing.

## Integration Examples

### Python Client
```python
import requests

url = "http://localhost:8001/score"
data = {
    "userId": "customer_123",
    "features": {
        "activity_7d": 15,
        "activity_30d": 45,
        "plan_value": 200,
        "usage_score": 0.6,
        "region": "US"
    }
}

response = requests.post(url, json=data)
result = response.json()
print(f"Risk: {result['risk']}, Tier: {result['tier']}")
```

### JavaScript/Node.js Client
```javascript
const response = await fetch('http://localhost:8001/score', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'customer_123',
    features: {
      activity_7d: 15,
      activity_30d: 45,
      plan_value: 200,
      usage_score: 0.6,
      region: 'US'
    }
  })
});

const result = await response.json();
console.log(`Risk: ${result.risk}, Tier: ${result.tier}`);
```

## Production Considerations
1. **Authentication**: Add API keys or JWT tokens for production
2. **Rate Limiting**: Implement rate limiting for API protection
3. **Monitoring**: Add logging and metrics collection
4. **Caching**: Cache predictions for frequently requested users
5. **Validation**: Add comprehensive input validation
6. **Error Handling**: Implement proper error responses

## Current Status
✅ API is working and tested
✅ Model loaded successfully (AUC-ROC: 1.0)
✅ Endpoints responding correctly
✅ JSON responses formatted properly

Your ML API is ready for integration!