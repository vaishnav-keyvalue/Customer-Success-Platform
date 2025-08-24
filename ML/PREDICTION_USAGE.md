# Customer Success ML Model - Prediction Usage

## Overview
You have successfully trained and tested your churn prediction model! Now you can predict the churn risk for new customers using the provided scripts.

## Available Models
Your latest trained model: `risk-lgbm-2025-08-24-0748`
- Trained on 5,000 samples
- AUC-ROC: 1.000 (perfect score on test data)
- Features 12 input features including activity metrics, support tickets, plan value, etc.

## Making Predictions

### Option 1: Command Line Prediction
```bash
# Activate virtual environment
source venv/bin/activate

# Predict for a specific customer
python predict_new_value.py --user_id="customer_123" --features='{"activity_7d": 15, "activity_30d": 45, "tickets_30d": 2, "plan_value": 200, "usage_score": 0.6, "region": "US"}'
```

### Option 2: Interactive Mode
```bash
# Activate virtual environment
source venv/bin/activate

# Run in interactive mode (prompts for input)
python predict_new_value.py --interactive
```

### Option 3: Example Scenarios
```bash
# Run predefined examples
python prediction_examples.py
```

## Required Features
The model expects these features:
- `activity_7d`: Activity in last 7 days (number)
- `activity_30d`: Activity in last 30 days (number)
- `time_since_last_use_days`: Days since last use (number)
- `failed_renewals_30d`: Failed renewals in last 30 days (number)
- `tickets_7d`: Support tickets in last 7 days (number)
- `tickets_30d`: Support tickets in last 30 days (number)
- `plan_value`: Plan value in dollars (number)
- `usage_score`: Usage score 0-1 (number)
- `region`: Customer region - US, EU, IN, or SG (string)

**Note**: Missing features will use sensible defaults automatically.

## Output
The prediction returns:
- **Risk Score**: Probability of churn (0-1)
- **Risk Tier**: Low/Medium/High risk classification
- **Reasons**: Rule-based explanations for the prediction
- **Model Version**: Version of the model used

## Example Output
```json
{
  "userId": "test_customer",
  "risk": 0.999760171589528,
  "tier": "med",
  "reasons": [
    "inactive_14d"
  ],
  "modelVersion": "risk-lgbm-2025-08-24-0748"
}
```

## Risk Tiers
- **Low**: Customer likely to stay
- **Medium**: Monitor and engage customer
- **High**: Immediate intervention recommended

## Example Customer Profiles

### High-Risk Customer
```json
{
  "activity_7d": 1,
  "activity_30d": 3,
  "time_since_last_use_days": 25,
  "failed_renewals_30d": 2,
  "tickets_30d": 8,
  "plan_value": 500,
  "usage_score": 0.1,
  "region": "US"
}
```

### Healthy Customer
```json
{
  "activity_7d": 45,
  "activity_30d": 180,
  "time_since_last_use_days": 1,
  "failed_renewals_30d": 0,
  "tickets_30d": 1,
  "plan_value": 200,
  "usage_score": 0.85,
  "region": "EU"
}
```

## Integration Options
1. **API Integration**: Use the ML service API (port 8001)
2. **Direct Script**: Use the prediction scripts directly
3. **Batch Processing**: Modify scripts for bulk predictions

## Next Steps
1. Test with your real customer data
2. Integrate predictions into your customer success workflows
3. Monitor model performance over time
4. Retrain periodically with new data

## Troubleshooting
- Ensure virtual environment is activated: `source venv/bin/activate`
- Make sure model files exist in `model_store/`
- Check feature names match exactly (case-sensitive)
- Verify JSON format for features parameter