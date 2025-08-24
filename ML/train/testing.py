#!/usr/bin/env python3
"""
ML Model Testing Module for Customer Success Platform

Provides comprehensive testing for trained churn prediction models including:
- Model validation and performance testing
- Feature importance analysis
- Business rule validation
- Integration testing with live data
"""

import os, json
import pandas as pd
import numpy as np
from typing import Dict, Tuple, List
from sklearn.metrics import (
    roc_auc_score, average_precision_score, accuracy_score, precision_score, 
    recall_score, f1_score, confusion_matrix, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns
from .data_sources import load_snapshots_from_cs
from .training import prepare, time_split
from app.model_registry import load_model
from app.reasons import rule_based_reasons

def test_model_performance(model, meta: Dict, test_data: pd.DataFrame) -> Dict:
    """Test model performance on held-out data."""
    X, y, _, feature_order = prepare(test_data)
    
    # Get predictions
    y_proba = model.predict_proba(X)[:, 1]
    y_pred = (y_proba >= 0.5).astype(int)
    
    # Calculate comprehensive metrics
    metrics = {
        'auc_roc': float(roc_auc_score(y, y_proba)),
        'auc_pr': float(average_precision_score(y, y_proba)),
        'accuracy': float(accuracy_score(y, y_pred)),
        'precision': float(precision_score(y, y_pred, zero_division=0)),
        'recall': float(recall_score(y, y_pred, zero_division=0)),
        'f1_score': float(f1_score(y, y_pred, zero_division=0)),
        'confusion_matrix': confusion_matrix(y, y_pred).tolist()
    }
    
    # Test thresholds from metadata
    thresholds = meta.get('thresholds', {'med': 0.4, 'high': 0.7})
    tier_pred = pd.cut(y_proba, 
                       bins=[0, thresholds['med'], thresholds['high'], 1], 
                       labels=['low', 'med', 'high'])
    
    metrics['threshold_distribution'] = {
        'low': int(np.sum(tier_pred == 'low')),
        'med': int(np.sum(tier_pred == 'med')),
        'high': int(np.sum(tier_pred == 'high'))
    }
    
    return metrics

def test_feature_importance(model, feature_order: List[str]) -> Dict:
    """Analyze feature importance from trained model."""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        feature_importance = dict(zip(feature_order, importances.tolist()))
        
        # Sort by importance
        sorted_features = sorted(feature_importance.items(), 
                               key=lambda x: x[1], reverse=True)
        
        return {
            'feature_importance': dict(sorted_features),
            'top_5_features': [f[0] for f in sorted_features[:5]],
            'total_features': len(feature_order)
        }
    else:
        return {'feature_importance': {}, 'note': 'Model does not support feature importance'}

def test_business_rules(test_data: pd.DataFrame) -> Dict:
    """Test business rules and reason generation."""
    results = {'rules_tested': 0, 'rules_passed': 0, 'failed_cases': []}
    
    for _, row in test_data.iterrows():
        # Extract features
        features = {}
        for col in test_data.columns:
            if col.startswith('features__'):
                feature_name = col.replace('features__', '')
                features[feature_name] = row[col]
        
        # Test rule logic
        reasons = rule_based_reasons(features)
        results['rules_tested'] += 1
        
        # Check if reasons make sense
        valid_reasons = True
        
        # Test inactive_14d rule
        if 'inactive_14d' in reasons:
            if features.get('time_since_last_use_days', 0) < 14:
                valid_reasons = False
                results['failed_cases'].append({
                    'userId': row.get('userId', 'unknown'),
                    'rule': 'inactive_14d',
                    'expected': 'time_since_last_use_days >= 14',
                    'actual': features.get('time_since_last_use_days', 0)
                })
        
        # Test payment_issue_recent rule
        if 'payment_issue_recent' in reasons:
            if features.get('failed_renewals_30d', 0) < 1:
                valid_reasons = False
                results['failed_cases'].append({
                    'userId': row.get('userId', 'unknown'),
                    'rule': 'payment_issue_recent',
                    'expected': 'failed_renewals_30d >= 1',
                    'actual': features.get('failed_renewals_30d', 0)
                })
        
        # Test no_recent_activity rule
        if 'no_recent_activity' in reasons:
            if features.get('activity_7d', 0) != 0:
                valid_reasons = False
                results['failed_cases'].append({
                    'userId': row.get('userId', 'unknown'),
                    'rule': 'no_recent_activity',
                    'expected': 'activity_7d == 0',
                    'actual': features.get('activity_7d', 0)
                })
        
        if valid_reasons:
            results['rules_passed'] += 1
    
    results['rules_pass_rate'] = results['rules_passed'] / results['rules_tested'] if results['rules_tested'] > 0 else 0
    return results

def test_data_quality(test_data: pd.DataFrame) -> Dict:
    """Test data quality and consistency."""
    quality_report = {
        'total_samples': len(test_data),
        'missing_data': {},
        'data_types': {},
        'outliers': {},
        'label_distribution': {}
    }
    
    # Check missing data
    for col in test_data.columns:
        missing_count = test_data[col].isna().sum()
        if missing_count > 0:
            quality_report['missing_data'][col] = int(missing_count)
    
    # Check data types
    for col in test_data.columns:
        if col.startswith('features__'):
            feature_name = col.replace('features__', '')
            if feature_name != 'region':  # region is categorical
                values = pd.to_numeric(test_data[col], errors='coerce')
                quality_report['data_types'][feature_name] = {
                    'mean': float(values.mean()) if not values.isna().all() else None,
                    'std': float(values.std()) if not values.isna().all() else None,
                    'min': float(values.min()) if not values.isna().all() else None,
                    'max': float(values.max()) if not values.isna().all() else None
                }
    
    # Check label distribution
    if 'label' in test_data.columns:
        label_counts = test_data['label'].value_counts()
        quality_report['label_distribution'] = {
            'positive_samples': int(label_counts.get(1, 0)),
            'negative_samples': int(label_counts.get(0, 0)),
            'positive_rate': float(label_counts.get(1, 0) / len(test_data))
        }
    
    return quality_report

def run_comprehensive_test(start_iso: str, end_iso: str, model_path: str = None) -> Dict:
    """Run comprehensive model testing suite."""
    print("=" * 50)
    print("ML Model Testing Suite")
    print("=" * 50)
    
    # Load model
    print("Loading model...")
    model, meta = load_model(model_path)
    print(f"Loaded model version: {meta.get('version', 'unknown')}")
    
    # Load test data
    print("Loading test data...")
    test_data = load_snapshots_from_cs(start_iso, end_iso)
    if test_data.empty:
        return {'error': 'No test data available for the specified date range'}
    
    print(f"Loaded {len(test_data)} test samples")
    
    # Run tests
    results = {
        'model_version': meta.get('version', 'unknown'),
        'test_period': {'start': start_iso, 'end': end_iso},
        'test_data_size': len(test_data),
        'timestamp': pd.Timestamp.utcnow().isoformat()
    }
    
    # Test 1: Data Quality
    print("\n1. Testing data quality...")
    results['data_quality'] = test_data_quality(test_data)
    print(f"   ✓ {results['data_quality']['total_samples']} samples analyzed")
    
    # Test 2: Model Performance
    print("\n2. Testing model performance...")
    results['performance'] = test_model_performance(model, meta, test_data)
    print(f"   ✓ AUC-ROC: {results['performance']['auc_roc']:.3f}")
    print(f"   ✓ AUC-PR: {results['performance']['auc_pr']:.3f}")
    print(f"   ✓ F1-Score: {results['performance']['f1_score']:.3f}")
    
    # Test 3: Feature Importance
    print("\n3. Testing feature importance...")
    results['feature_analysis'] = test_feature_importance(model, meta.get('feature_order', []))
    if 'top_5_features' in results['feature_analysis']:
        print(f"   ✓ Top 5 features: {', '.join(results['feature_analysis']['top_5_features'])}")
    
    # Test 4: Business Rules
    print("\n4. Testing business rules...")
    results['business_rules'] = test_business_rules(test_data)
    print(f"   ✓ Rules pass rate: {results['business_rules']['rules_pass_rate']:.2%}")
    
    # Overall assessment
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    # Performance assessment
    auc_roc = results['performance']['auc_roc']
    if auc_roc >= 0.8:
        perf_status = "EXCELLENT"
    elif auc_roc >= 0.7:
        perf_status = "GOOD"
    elif auc_roc >= 0.6:
        perf_status = "FAIR"
    else:
        perf_status = "NEEDS IMPROVEMENT"
    
    print(f"Model Performance: {perf_status} (AUC-ROC: {auc_roc:.3f})")
    
    # Data quality assessment
    missing_fields = len(results['data_quality']['missing_data'])
    if missing_fields == 0:
        data_status = "CLEAN"
    elif missing_fields <= 2:
        data_status = "MINOR ISSUES"
    else:
        data_status = "NEEDS ATTENTION"
    
    print(f"Data Quality: {data_status}")
    
    # Business rules assessment
    rules_pass_rate = results['business_rules']['rules_pass_rate']
    if rules_pass_rate >= 0.95:
        rules_status = "EXCELLENT"
    elif rules_pass_rate >= 0.90:
        rules_status = "GOOD"
    else:
        rules_status = "NEEDS REVIEW"
    
    print(f"Business Rules: {rules_status} ({rules_pass_rate:.1%} pass rate)")
    
    results['overall_status'] = {
        'performance': perf_status,
        'data_quality': data_status,
        'business_rules': rules_status
    }
    
    return results

if __name__ == "__main__":
    # Example: test on recent data
    end = pd.Timestamp.utcnow().floor("D")
    start = end - pd.Timedelta(days=30)
    
    results = run_comprehensive_test(start.isoformat(), end.isoformat())
    
    # Save results
    os.makedirs("./test_results", exist_ok=True)
    with open(f"./test_results/test_report_{pd.Timestamp.utcnow().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Test results saved to test_results/")