#!/usr/bin/env python3
"""
Training Script for Customer Success ML Model

This script trains a churn prediction model using data from the backend API.
Run this after starting the backend server with the mock data loaded.

Usage:
    python train_model.py [--days=90] [--backend_url=http://localhost:3000]
"""

import os
import sys
import argparse
import pandas as pd
from train.training import train_model

def main():
    parser = argparse.ArgumentParser(description='Train Customer Success ML Model')
    parser.add_argument('--days', type=int, default=90, 
                       help='Number of days of historical data to use for training (default: 90)')
    parser.add_argument('--backend_url', type=str, default='http://localhost:3000',
                       help='Backend API URL (default: http://localhost:3000)')
    parser.add_argument('--tenant_id', type=str, 
                       default='e0028c9a-8c0b-48a9-889a-9420c0e62662',
                       help='Tenant ID to use for training data')
    parser.add_argument('--mock_data_date', type=str, default='2025-08-22',
                       help='Date of mock data events (default: 2025-08-22)')
    
    args = parser.parse_args()
    
    # Set environment variables for the training process
    os.environ['CS_FEATURES_URL'] = f"{args.backend_url}/customers/features/public"
    os.environ['TENANT_ID'] = args.tenant_id
    
    print("=" * 60)
    print("Customer Success ML Model Training")
    print("=" * 60)
    print(f"Backend URL: {args.backend_url}")
    print(f"Training Days: {args.days}")
    print(f"Tenant ID: {args.tenant_id}")
    print(f"Mock Data Date: {args.mock_data_date}")
    print()
    
    # Calculate date range for training
    # Use fixed dates that align with mock data (all events are on specified date)
    # For development, we'll use a period that includes the mock data
    mock_data_date = pd.Timestamp(args.mock_data_date)  # Date of mock events
    end = mock_data_date + pd.Timedelta(days=1)  # Day after mock data
    start = end - pd.Timedelta(days=args.days)   # Training window
    
    print(f"Training period: {start.strftime('%Y-%m-%d')} to {end.strftime('%Y-%m-%d')}")
    print()
    
    try:
        # Train the model
        print("Starting model training...")
        meta = train_model(start.isoformat(), end.isoformat())
        
        print("\n" + "=" * 60)
        print("TRAINING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"Model Version: {meta['version']}")
        print(f"Training Samples: {meta.get('training_samples', 'Unknown')}")
        print(f"AUC-ROC: {meta.get('metrics', {}).get('auc_roc', 'Unknown'):.3f}")
        print(f"AUC-PR: {meta.get('metrics', {}).get('auc_pr', 'Unknown'):.3f}")
        print(f"Brier Score: {meta.get('metrics', {}).get('brier', 'Unknown'):.3f}")
        print()
        print("Model saved to model_store/")
        print("You can now start the ML API server with: uvicorn app.main:app --host 0.0.0.0 --port 8000")
        
        return 0
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("TRAINING FAILED!")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print()
        print("Troubleshooting:")
        print("1. Make sure the backend server is running")
        print("2. Check that mock data is loaded in the database")
        print("3. Verify the backend URL is correct")
        print("4. Ensure the tenant ID exists in the database")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())