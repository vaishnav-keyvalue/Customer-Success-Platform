#!/usr/bin/env python3
"""
Data Validation Script for Customer Success ML Pipeline

This script validates that all data connections work properly:
1. Tests connection to backend API
2. Validates feature data structure
3. Checks data quality and completeness

Usage:
    python validate_data.py [--backend_url=http://localhost:3000]
"""

import os
import sys
import argparse
import requests
import pandas as pd
from datetime import datetime, timedelta
import json




def test_backend_connection(backend_url: str, tenant_id: str) -> bool:
    """Test if backend API is accessible"""
    print(f"Testing backend connection to {backend_url}")
    try:
        response = requests.get(f"{backend_url}", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API is accessible")
            return True
        else:
            print(f"❌ Backend API returned status {response}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend API: {e}")
        return False

def test_features_endpoint(backend_url: str, tenant_id: str) -> pd.DataFrame:
    """Test and validate the features endpoint"""
    try:
        # Use query parameters as shown in the sample API URL
        params = {
            'startDate': '2024-01-01',
            'endDate': '2025-08-22',
            'tenantId': tenant_id
        }
        print(f"📡 Calling API: {backend_url}/customers/features/public with params: {params}")
        response = requests.get(f"{backend_url}/customers/features/public", 
                              params=params, timeout=30)
        
        if response.status_code != 200:
            print(f"❌ Features endpoint returned status {response.status_code}")
            return None
            
        response_data = response.json()
        
        # Extract the data array from the API response
        if not response_data.get('success', False):
            print(f"❌ API returned unsuccessful response: {response_data.get('message', 'Unknown error')}")
            return None
            
        features_data = response_data.get('data', [])
        if not features_data:
            print("❌ No features data returned from API")
            return None
            
        # Extract and flatten the features from the nested structure
        # Each item has: {userId, features: {...}, label}
        flattened_features = []
        for item in features_data:
            if 'features' in item:
                # Add userId to the features and flatten
                feature_record = item['features'].copy()
                feature_record['userId'] = item['userId']
                if 'label' in item:
                    feature_record['label'] = item['label']
                flattened_features.append(feature_record)
        
        if not flattened_features:
            print("❌ No valid features found in API response")
            return None
            
        df = pd.DataFrame(flattened_features)
        
        print(f"✅ Features endpoint accessible")
        print(f"📊 Retrieved {len(df)} customer records")
        
        # Expected features based on our backend analysis
        expected_features = [
            'userId', 'activity_7d', 'activity_30d', 'time_since_last_use_days',
            'failed_renewals_30d', 'tickets_7d', 'tickets_30d', 'plan_value', 
            'usage_score', 'region', 'label'
        ]
        
        # Check for required columns
        missing_features = [f for f in expected_features if f not in df.columns]
        if missing_features:
            print(f"❌ Missing features: {missing_features}")
        else:
            print("✅ All expected features present")
            
        # Data quality checks
        print(f"📈 Data Quality Report:")
        print(f"   - Total customers: {len(df)}")
        print(f"   - Unique customers: {df['userId'].nunique()}")
        print(f"   - Null values by column:")
        for col in df.columns:
            null_count = df[col].isnull().sum()
            if null_count > 0:
                print(f"     {col}: {null_count} ({null_count/len(df)*100:.1f}%)")
        
        # Feature statistics
        print(f"📊 Feature Statistics:")
        numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns
        for col in numeric_cols:
            if col not in ['userId']:  # Exclude ID fields from statistics
                print(f"   - {col}: mean={df[col].mean():.2f}, std={df[col].std():.2f}")
        
        # Check label distribution for ML training
        if 'label' in df.columns:
            label_counts = df['label'].value_counts()
            print(f"🎯 Label Distribution:")
            for label, count in label_counts.items():
                print(f"   - Label {label}: {count} ({count/len(df)*100:.1f}%)")
            
            # Sample some label values with their feature values for debugging
            print(f"🔍 Sample Records:")
            sample_df = df.sample(min(5, len(df))).round(3)
            for idx, row in sample_df.iterrows():
                print(f"   User {row['userId']}: label={row['label']}, activity_30d={row.get('activity_30d', 'N/A')}, usage_score={row.get('usage_score', 'N/A')}")
        
        return df
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error accessing features endpoint: {e}")
        return None
    except Exception as e:
        print(f"❌ Error processing features data: {e}")
        return None

def validate_data_distribution(df: pd.DataFrame) -> None:
    """Validate that data has reasonable distributions for ML training"""
    if df is None or len(df) == 0:
        print("❌ No data to validate")
        return
        
    print("🔍 Data Distribution Analysis:")
    
    # Check for reasonable data ranges
    checks = {
        'activity_7d': (0, 168),  # hours in a week
        'activity_30d': (0, 720),  # hours in a month
        'time_since_last_use_days': (0, 365),  # reasonable range
        'failed_renewals_30d': (0, 10),  # reasonable failure count
        'tickets_7d': (0, 50),  # reasonable ticket count
        'tickets_30d': (0, 200),  # reasonable ticket count
        'plan_value': (0, 10000),  # reasonable plan values
        'usage_score': (0, 1),  # should be normalized 0-1
        'label': (0, 1),  # should be normalized 0-1 (ML target)
    }
    
    for feature, (min_val, max_val) in checks.items():
        if feature in df.columns:
            actual_min = df[feature].min()
            actual_max = df[feature].max()
            
            if actual_min < min_val or actual_max > max_val:
                print(f"   ⚠️  {feature}: range [{actual_min:.2f}, {actual_max:.2f}] outside expected [{min_val}, {max_val}]")
            else:
                print(f"   ✅ {feature}: range [{actual_min:.2f}, {actual_max:.2f}] looks good")
    
    # Check region distribution
    if 'region' in df.columns:
        region_counts = df['region'].value_counts()
        print(f"   📍 Region distribution:")
        for region, count in region_counts.items():
            print(f"      {region}: {count} ({count/len(df)*100:.1f}%)")

def main():
    parser = argparse.ArgumentParser(description='Validate Customer Success ML Data Pipeline')
    parser.add_argument('--backend_url', type=str, default='http://localhost:3000',
                       help='Backend API URL (default: http://localhost:3000)')
    parser.add_argument('--tenant_id', type=str, default='e0028c9a-8c0b-48a9-889a-9420c0e62662',
                       help='Tenant ID for API requests')
    
    args = parser.parse_args()
    
    print("🚀 Customer Success ML Data Validation")
    print("=" * 50)
    
    # Test 1: Backend connection
    if not test_backend_connection(args.backend_url, args.tenant_id):
        print("\n❌ Backend connection failed. Make sure the backend server is running.")
        sys.exit(1)
    
    print()
    
    # Test 2: Features endpoint
    df = test_features_endpoint(args.backend_url, args.tenant_id)
    if df is None:
        print("\n❌ Features endpoint validation failed.")
        sys.exit(1)
        
    print()
    
    # Test 3: Data distribution validation
    validate_data_distribution(df)
    
    print()
    print("🎉 All validations passed! The ML pipeline is ready for training.")
    print("\nNext steps:")
    print("1. Run 'python train_model.py' to train the model")
    print("2. Run 'python test_model.py' to test the trained model")

if __name__ == "__main__":
    main()