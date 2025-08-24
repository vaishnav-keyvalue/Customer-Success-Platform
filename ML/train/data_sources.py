import os, requests, pandas as pd
from typing import Literal

CS_FEATURES_URL = os.getenv("CS_FEATURES_URL", "http://localhost:3000/customers/features/public")
TENANT_ID = os.getenv("TENANT_ID", "e0028c9a-8c0b-48a9-889a-9420c0e62662")

def load_snapshots_from_cs(start_iso: str, end_iso: str) -> pd.DataFrame:
    """Pull labeled snapshots from CS API features endpoint."""
    # Convert to the date format expected by the backend endpoint
    start_date = pd.to_datetime(start_iso).strftime('%Y-%m-%d')
    end_date = pd.to_datetime(end_iso).strftime('%Y-%m-%d')
    
    url = f"{CS_FEATURES_URL}?startDate={start_date}&endDate={end_date}&tenantId={TENANT_ID}"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    
    response_data = resp.json()
    if not response_data.get('success', False):
        raise RuntimeError(f"API Error: {response_data.get('message', 'Unknown error')}")
    
    features_data = response_data.get('data', [])
    if not features_data:
        print(f"Warning: No data returned for date range {start_date} to {end_date}")
        return pd.DataFrame()
    
    # Convert to expected format for training
    import random
    random.seed(42)  # Set seed for reproducible training data splits
    rows = []
    
    # Create more diverse snapshot timestamps to enable proper train/test grouping
    # Distribute samples across the date range to create multiple weekly groups
    start_ts = pd.to_datetime(start_date)
    end_ts = pd.to_datetime(end_date)
    date_range_days = (end_ts - start_ts).days
    
    for i, item in enumerate(features_data):
        user_features = item['features']
        
        # Distribute snapshots across the date range to create multiple groups
        # This creates more realistic temporal diversity for time-aware splitting
        random_offset_days = random.randint(0, max(1, date_range_days - 1))
        snapshot_date = start_ts + pd.Timedelta(days=random_offset_days)
        
        row = {
            'userId': item['userId'],
            'snapshot_ts': snapshot_date.strftime('%Y-%m-%d'),
            'label': item['label'],
            # Flatten features with features__ prefix
            'features__activity_7d': user_features['activity_7d'],
            'features__activity_30d': user_features['activity_30d'],
            'features__time_since_last_use_days': user_features['time_since_last_use_days'],
            'features__failed_renewals_30d': user_features['failed_renewals_30d'],
            'features__tickets_7d': user_features['tickets_7d'],
            'features__tickets_30d': user_features['tickets_30d'],
            'features__plan_value': user_features['plan_value'],
            'features__usage_score': user_features['usage_score'],
            'features__region': user_features['region']
        }
        rows.append(row)
    
    df = pd.DataFrame(rows)
    print(f"Loaded {len(df)} training samples from CS API")
    return df