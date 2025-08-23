from typing import Dict, List

def rule_based_reasons(feat: Dict) -> List[str]:
    r = []
    if feat.get("time_since_last_use_days", 0) >= 14: r.append("inactive_14d")
    if feat.get("failed_renewals_30d", 0) >= 1:       r.append("payment_issue_recent")
    if feat.get("activity_7d", 0) == 0:               r.append("no_recent_activity")
    if feat.get("usage_score", 1.0) < 0.3:            r.append("low_feature_usage")
    if not r: r.append("general_risk_factors")
    return r[:3]