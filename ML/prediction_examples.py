#!/usr/bin/env python3
"""
Prediction Examples for Customer Success ML Model

This file shows various examples of how to use the prediction functionality
"""

import json
from predict_new_value import main as predict_main
import sys

def example_high_risk_customer():
    """Example of a high-risk customer"""
    print("=" * 60)
    print("EXAMPLE 1: High-Risk Customer")
    print("=" * 60)
    
    features = {
        "activity_7d": 1,        # Very low recent activity
        "activity_30d": 3,       # Low monthly activity
        "time_since_last_use_days": 25,  # Haven't used in a while
        "failed_renewals_30d": 2,        # Failed to renew
        "tickets_7d": 3,         # Multiple support issues
        "tickets_30d": 8,        # Many support issues
        "plan_value": 500,       # High-value customer
        "usage_score": 0.1,      # Very low usage
        "region": "US"
    }
    
    print("Customer profile:")
    for key, value in features.items():
        print(f"  {key}: {value}")
    
    return "high_risk_customer", features

def example_healthy_customer():
    """Example of a healthy, low-risk customer"""
    print("=" * 60)
    print("EXAMPLE 2: Healthy Customer")
    print("=" * 60)
    
    features = {
        "activity_7d": 45,       # High recent activity
        "activity_30d": 180,     # High monthly activity
        "time_since_last_use_days": 1,   # Used very recently
        "failed_renewals_30d": 0,        # No renewal issues
        "tickets_7d": 0,         # No support issues
        "tickets_30d": 1,        # Minimal support needs
        "plan_value": 200,       # Standard plan
        "usage_score": 0.85,     # High usage
        "region": "EU"
    }
    
    print("Customer profile:")
    for key, value in features.items():
        print(f"  {key}: {value}")
    
    return "healthy_customer", features

def example_medium_risk_customer():
    """Example of a medium-risk customer"""
    print("=" * 60)
    print("EXAMPLE 3: Medium-Risk Customer")
    print("=" * 60)
    
    features = {
        "activity_7d": 8,        # Moderate activity
        "activity_30d": 25,      # Below average monthly activity
        "time_since_last_use_days": 5,   # Used recently
        "failed_renewals_30d": 1,        # One renewal issue
        "tickets_7d": 1,         # Some support contact
        "tickets_30d": 3,        # Moderate support needs
        "plan_value": 150,       # Standard plan
        "usage_score": 0.4,      # Below average usage
        "region": "IN"
    }
    
    print("Customer profile:")
    for key, value in features.items():
        print(f"  {key}: {value}")
    
    return "medium_risk_customer", features

def run_example(user_id: str, features: dict):
    """Run a single prediction example"""
    # We'll simulate calling the prediction function
    # In a real scenario, you'd import and call the prediction functions directly
    features_json = json.dumps(features)
    
    print(f"\n🔍 Running prediction...")
    print(f"Command: python predict_new_value.py --user_id='{user_id}' --features='{features_json}'")
    print()

if __name__ == "__main__":
    print("Customer Success ML Model - Prediction Examples")
    print("These examples show different customer risk profiles")
    print()
    
    # Run examples
    examples = [
        example_high_risk_customer,
        example_healthy_customer,
        example_medium_risk_customer
    ]
    
    for example_func in examples:
        user_id, features = example_func()
        run_example(user_id, features)
        
        # Ask if user wants to run this example
        response = input("Would you like to run this prediction? (y/n): ").strip().lower()
        if response in ['y', 'yes']:
            # Temporarily modify sys.argv to simulate command line args
            original_argv = sys.argv.copy()
            sys.argv = [
                'predict_new_value.py',
                '--user_id', user_id,
                '--features', json.dumps(features)
            ]
            
            try:
                predict_main()
            except SystemExit:
                pass  # Ignore sys.exit calls
            finally:
                sys.argv = original_argv
        
        print("\n" + "-" * 60 + "\n")
    
    print("Examples completed!")
    print("\nTo run your own predictions:")
    print("1. Interactive mode: python predict_new_value.py --interactive")
    print("2. Command line: python predict_new_value.py --user_id='123' --features='{...}'")