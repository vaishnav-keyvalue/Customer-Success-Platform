#!/usr/bin/env python3
"""
Testing Script for Customer Success ML Model

This script runs comprehensive tests on a trained churn prediction model.
Run this after training a model to validate its performance.

Usage:
    python test_model.py [--days=30] [--backend_url=http://localhost:3000] [--model_path=path/to/model.pkl]
"""

import os
import sys
import argparse
import pandas as pd
import json
from train.testing import run_comprehensive_test

def main():
    parser = argparse.ArgumentParser(description='Test Customer Success ML Model')
    parser.add_argument('--days', type=int, default=30, 
                       help='Number of days of recent data to use for testing (default: 30)')
    parser.add_argument('--backend_url', type=str, default='http://localhost:3000',
                       help='Backend API URL (default: http://localhost:3000)')
    parser.add_argument('--tenant_id', type=str, 
                       default='e0028c9a-8c0b-48a9-889a-9420c0e62662',
                       help='Tenant ID to use for test data')
    parser.add_argument('--model_path', type=str, default=None,
                       help='Path to specific model file (default: use latest)')
    parser.add_argument('--save_report', action='store_true',
                       help='Save detailed test report to JSON file')
    
    args = parser.parse_args()
    
    # Set environment variables for the testing process
    os.environ['CS_FEATURES_URL'] = f"{args.backend_url}/customers/features/public"
    os.environ['TENANT_ID'] = args.tenant_id
    
    print("=" * 60)
    print("Customer Success ML Model Testing")
    print("=" * 60)
    print(f"Backend URL: {args.backend_url}")
    print(f"Testing Days: {args.days}")
    print(f"Tenant ID: {args.tenant_id}")
    print(f"Model Path: {args.model_path or 'Latest available'}")
    print()
    
    # Calculate date range for testing (use very recent data)
    end = pd.Timestamp.utcnow().floor("D")
    start = end - pd.Timedelta(days=args.days)
    
    print(f"Testing period: {start.strftime('%Y-%m-%d')} to {end.strftime('%Y-%m-%d')}")
    print()
    
    try:
        # Run comprehensive tests
        results = run_comprehensive_test(
            start.isoformat(), 
            end.isoformat(), 
            args.model_path
        )
        
        if 'error' in results:
            print(f"Testing failed: {results['error']}")
            return 1
        
        # Save report if requested
        if args.save_report:
            os.makedirs("./test_results", exist_ok=True)
            report_file = f"./test_results/test_report_{pd.Timestamp.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_file, "w") as f:
                json.dump(results, f, indent=2)
            print(f"\n📊 Detailed report saved to: {report_file}")
        
        # Display recommendations
        print("\n" + "=" * 60)
        print("RECOMMENDATIONS")
        print("=" * 60)
        
        overall = results.get('overall_status', {})
        
        # Performance recommendations
        auc_roc = results.get('performance', {}).get('auc_roc', 0)
        if auc_roc < 0.7:
            print("🔧 Model Performance:")
            print("   - Consider retraining with more data")
            print("   - Review feature engineering")
            print("   - Check for data quality issues")
        elif auc_roc < 0.8:
            print("📈 Model Performance:")
            print("   - Good performance, consider feature tuning")
            print("   - Monitor for data drift")
        else:
            print("✅ Model Performance: Excellent!")
        
        # Data quality recommendations
        data_issues = len(results.get('data_quality', {}).get('missing_data', {}))
        if data_issues > 0:
            print("\n🔍 Data Quality:")
            print("   - Address missing data issues")
            print("   - Implement data validation checks")
            print("   - Review data pipeline")
        else:
            print("\n✅ Data Quality: Clean!")
        
        # Business rules recommendations
        rules_pass_rate = results.get('business_rules', {}).get('rules_pass_rate', 0)
        failed_cases = len(results.get('business_rules', {}).get('failed_cases', []))
        if failed_cases > 0:
            print(f"\n⚠️  Business Rules: {failed_cases} rule violations found")
            print("   - Review business logic implementation")
            print("   - Validate rule definitions")
        else:
            print("\n✅ Business Rules: All tests passed!")
        
        # Feature analysis
        top_features = results.get('feature_analysis', {}).get('top_5_features', [])
        if top_features:
            print(f"\n🎯 Key Features: {', '.join(top_features[:3])}")
            print("   - Monitor these features for data drift")
            print("   - Consider feature interaction analysis")
        
        return 0
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("TESTING FAILED!")
        print("=" * 60)
        print(f"Error: {str(e)}")
        print()
        print("Troubleshooting:")
        print("1. Make sure a model has been trained first")
        print("2. Check that the backend server is running")
        print("3. Verify model files exist in model_store/")
        print("4. Ensure test data is available for the specified period")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())