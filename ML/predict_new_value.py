#!/usr/bin/env python3
"""
Single Prediction Script for Customer Success ML Model

This script allows you to predict the churn risk for a new customer or set of features.

Usage:
    python predict_new_value.py --user_id="123" --features='{"activity_7d": 15, "activity_30d": 45, ...}'
    python predict_new_value.py --interactive
"""

import os
import sys
import argparse
import json
import pandas as pd
import numpy as np
from app.model_registry import load_model
from app.reasons import rule_based_reasons

def prepare_features(raw_features: dict, feature_order: list, encoders: dict) -> np.ndarray:
    """
    Prepare features for prediction by handling missing values and encoding
    """
    features = {}
    
    # Set defaults for missing features
    defaults = {
        "activity_7d": 0,
        "activity_30d": 0,
        "time_since_last_use_days": 30,
        "failed_renewals_30d": 0,
        "tickets_7d": 0,
        "tickets_30d": 0,
        "plan_value": 100,
        "usage_score": 0.5,
        "region": "US"  # Default region
    }
    
    # Fill in provided features
    for key, value in raw_features.items():
        features[key] = value
    
    # Fill in missing features with defaults
    for key, default_value in defaults.items():
        if key not in features:
            features[key] = default_value
            print(f"⚠️  Using default value for {key}: {default_value}")
    
    # Handle region encoding (one-hot)
    region = features.get("region", "US")
    region_features = {}
    
    if "region_vocab" in encoders:
        for reg in encoders["region_vocab"]:
            region_features[f"region__{reg}"] = 1 if region == reg else 0
    
    # Combine all features
    all_features = {**features, **region_features}
    
    # Remove the original region key as it's now encoded
    if "region" in all_features:
        del all_features["region"]
    
    # Create feature vector in the correct order
    feature_vector = []
    for feature_name in feature_order:
        if feature_name in all_features:
            feature_vector.append(float(all_features[feature_name]))
        else:
            print(f"⚠️  Missing feature {feature_name}, using 0")
            feature_vector.append(0.0)
    
    return np.array(feature_vector).reshape(1, -1)

def get_risk_tier(score: float, thresholds: dict) -> str:
    """Determine risk tier based on score and thresholds"""
    if score < thresholds["med"]:
        return "low"
    elif score < thresholds["high"]:
        return "med"
    else:
        return "high"

def interactive_input():
    """Interactive mode to collect user input"""
    print("\n" + "=" * 50)
    print("Interactive Prediction Mode")
    print("=" * 50)
    print("Enter customer information (press Enter to use defaults):")
    
    features = {}
    
    # Collect numeric features
    numeric_features = [
        ("activity_7d", "Activity last 7 days", 0),
        ("activity_30d", "Activity last 30 days", 0),
        ("time_since_last_use_days", "Days since last use", 30),
        ("failed_renewals_30d", "Failed renewals last 30 days", 0),
        ("tickets_7d", "Support tickets last 7 days", 0),
        ("tickets_30d", "Support tickets last 30 days", 0),
        ("plan_value", "Plan value ($)", 100),
        ("usage_score", "Usage score (0-1)", 0.5)
    ]
    
    for key, description, default in numeric_features:
        while True:
            try:
                value = input(f"{description} [{default}]: ").strip()
                if value == "":
                    features[key] = default
                    break
                else:
                    features[key] = float(value)
                    break
            except ValueError:
                print("Please enter a valid number")
    
    # Collect region
    regions = ["US", "EU", "IN", "SG"]
    print(f"\nRegion options: {', '.join(regions)}")
    while True:
        region = input("Region [US]: ").strip().upper()
        if region == "":
            features["region"] = "US"
            break
        elif region in regions:
            features["region"] = region
            break
        else:
            print(f"Please choose from: {', '.join(regions)}")
    
    user_id = input("\nUser ID [anonymous]: ").strip() or "anonymous"
    
    return user_id, features

def main():
    parser = argparse.ArgumentParser(description='Predict churn risk for a new customer')
    parser.add_argument('--user_id', type=str, default='anonymous',
                       help='Customer/User ID')
    parser.add_argument('--features', type=str,
                       help='JSON string of features (e.g., \'{"activity_7d": 15, "plan_value": 200}\')')
    parser.add_argument('--interactive', action='store_true',
                       help='Interactive mode - prompts for input')
    parser.add_argument('--model_path', type=str, default=None,
                       help='Path to specific model file (default: use latest)')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Customer Success ML Model - Single Prediction")
    print("=" * 60)
    
    try:
        # Load the model
        print("Loading model...")
        model, meta = load_model(args.model_path)
        print(f"✅ Loaded model: {meta['version']}")
        print(f"   Trained on {meta['training_samples']:,} samples")
        print(f"   AUC-ROC: {meta['metrics']['auc_roc']:.3f}")
        print()
        
        # Get input features
        if args.interactive:
            user_id, raw_features = interactive_input()
        else:
            user_id = args.user_id
            if args.features:
                try:
                    raw_features = json.loads(args.features)
                except json.JSONDecodeError:
                    print("❌ Error: Invalid JSON format for features")
                    return 1
            else:
                print("❌ Error: No features provided. Use --features or --interactive")
                return 1
        
        print(f"\n🔍 Predicting for User ID: {user_id}")
        print("Input features:")
        for key, value in raw_features.items():
            print(f"  {key}: {value}")
        
        # Prepare features
        feature_vector = prepare_features(raw_features, meta["feature_order"], meta["encoders"])
        
        # Make prediction
        risk_score = model.predict_proba(feature_vector)[0][1]  # Probability of churn
        risk_tier = get_risk_tier(risk_score, meta["thresholds"])
        
        # Get explanation using rule-based reasoning
        feature_dict = dict(zip(meta["feature_order"], feature_vector[0]))
        reasons = rule_based_reasons(feature_dict)
        
        # Display results
        print("\n" + "=" * 60)
        print("PREDICTION RESULTS")
        print("=" * 60)
        print(f"🎯 Risk Score: {risk_score:.6f}")
        print(f"📊 Risk Tier: {risk_tier.upper()}")
        
        # Risk interpretation
        if risk_tier == "low":
            print("✅ Low churn risk - Customer is likely to stay")
        elif risk_tier == "med":
            print("⚠️  Medium churn risk - Monitor and engage customer")
        else:
            print("🚨 High churn risk - Immediate intervention recommended")
        
        print(f"\n🧠 Top Contributing Factors:")
        for i, reason in enumerate(reasons[:5], 1):
            print(f"   {i}. {reason}")
        
        # Output as JSON for programmatic use
        result = {
            "userId": user_id,
            "risk": risk_score,
            "tier": risk_tier,
            "reasons": reasons,
            "modelVersion": meta["version"]
        }
        
        print(f"\n📋 JSON Output:")
        print(json.dumps(result, indent=2))
        
        return 0
        
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        print("Make sure you have trained a model first by running train_model.py")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())