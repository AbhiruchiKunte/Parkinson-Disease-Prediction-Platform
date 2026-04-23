import logging
import os
import re
import json
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv, dotenv_values
from flask import jsonify
from supabase import Client, create_client

load_dotenv()

logger = logging.getLogger(__name__)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase_admin: Optional[Client] = None
if url and key:
    try:
        supabase_admin = create_client(url, key)
    except Exception as exc:
        logger.error(f"Failed to initialize Supabase client for dashboard: {exc}")

_INSIGHT_CACHE: Dict[str, Any] = {
    "cache_key": None,
    "insights": None,
    "expires_at": None,
    "source": "fallback",
}


def _parse_iso_datetime(value: Any) -> Optional[datetime]:
    if not value or not isinstance(value, str):
        return None
    try:
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except Exception:
        return None


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _extract_probability(prediction_obj: Any) -> Optional[float]:
    if not isinstance(prediction_obj, dict):
        return None

    if "pd_probability" in prediction_obj:
        try:
            return float(prediction_obj["pd_probability"])
        except Exception:
            return None

    nested = prediction_obj.get("prediction")
    if isinstance(nested, dict):
        return _extract_probability(nested)

    return None


def _extract_feature_pairs(top_features: Any) -> List[Tuple[str, float]]:
    if not isinstance(top_features, list):
        return []

    items: List[Tuple[str, float]] = []
    for feature in top_features:
        if isinstance(feature, str):
            try:
                feature = json.loads(feature)
            except Exception:
                continue
        if not isinstance(feature, dict):
            continue
        name = str(feature.get("name", "")).strip()
        if not name:
            continue
        value = _safe_float(feature.get("value"), 0.0)
        items.append((name, value))
    return items


def _fallback_insights(metrics: Dict[str, Any]) -> List[str]:
    detection_rate = metrics["kpis"]["detection_rate"]
    today_total = metrics["today"]["total_predictions"]
    today_detected = metrics["today"]["pd_detected"]
    top_feature = metrics["top_features"][0]["name"] if metrics["top_features"] else "tremor_score"
    trend_delta = metrics["kpis"]["week_over_week_change_percent"]

    return [
        f"Detection rate is {detection_rate:.1f}% across all stored assessments and batch predictions.",
        f"Today there were {today_total} predictions with {today_detected} high-risk detections requiring review.",
        f"The strongest recurring contributor is {top_feature.replace('_', ' ')}, while week-over-week volume changed by {trend_delta:+.1f}%.",
    ]


def _parse_insight_text(raw_text: str) -> List[str]:
    lines = raw_text.splitlines()
    parsed: List[str] = []
    for line in lines:
        clean = line.strip().lstrip("-").lstrip("*").strip()
        clean = re.sub(r"^\d+\.\s*", "", clean)
        if clean and len(clean) > 20:
            parsed.append(clean)

    deduped: List[str] = []
    seen = set()
    for insight in parsed:
        key = insight.lower()
        if key not in seen:
            seen.add(key)
            deduped.append(insight)
        if len(deduped) == 3:
            break
    return deduped


def _generate_hf_insights(metrics: Dict[str, Any]) -> Tuple[List[str], str]:
    cache_key = (
        metrics["kpis"]["total_predictions"],
        metrics["kpis"]["pd_detected"],
        round(metrics["kpis"]["detection_rate"], 2),
        metrics["today"]["total_predictions"],
        metrics["today"]["pd_detected"],
    )

    now = datetime.now(timezone.utc)
    if (
        _INSIGHT_CACHE["cache_key"] == cache_key
        and _INSIGHT_CACHE["insights"]
        and _INSIGHT_CACHE["expires_at"]
        and now < _INSIGHT_CACHE["expires_at"]
    ):
        return _INSIGHT_CACHE["insights"], _INSIGHT_CACHE["source"]

    model_id = os.environ.get("HF_INSIGHTS_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
    hf_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACEHUB_API_TOKEN")
    if not hf_token:
        frontend_env_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "frontend", ".env")
        )
        if os.path.exists(frontend_env_path):
            env_values = dotenv_values(frontend_env_path)
            hf_token = env_values.get("HF_TOKEN") or env_values.get("HUGGINGFACEHUB_API_TOKEN")

    prompt = (
        "You are a clinical analytics assistant. "
        "Return exactly 3 concise insights (one sentence each) from these metrics.\n"
        f"- Total predictions: {metrics['kpis']['total_predictions']}\n"
        f"- PD detected: {metrics['kpis']['pd_detected']}\n"
        f"- Detection rate: {metrics['kpis']['detection_rate']:.2f}%\n"
        f"- Clinical records: {metrics['kpis']['clinical_assessments']}\n"
        f"- Batch predicted records: {metrics['kpis']['batch_predictions']}\n"
        f"- Today predictions: {metrics['today']['total_predictions']}\n"
        f"- Today detections: {metrics['today']['pd_detected']}\n"
        f"- Week-over-week change: {metrics['kpis']['week_over_week_change_percent']:+.2f}%\n"
        "Output format:\n"
        "1. ...\n"
        "2. ...\n"
        "3. ..."
    )

    try:
        from transformers import pipeline

        generator = pipeline(
            "text-generation",
            model=model_id,
            token=hf_token,
        )
        output = generator(
            prompt,
            max_new_tokens=180,
            do_sample=False,
            return_full_text=False,
        )
        raw_text = output[0].get("generated_text", "") if output else ""
        insights = _parse_insight_text(raw_text)
        if len(insights) != 3:
            raise ValueError("HF output was not parseable into 3 insights")

        _INSIGHT_CACHE["cache_key"] = cache_key
        _INSIGHT_CACHE["insights"] = insights
        _INSIGHT_CACHE["expires_at"] = now + timedelta(minutes=5)
        _INSIGHT_CACHE["source"] = f"huggingface:{model_id}"
        return insights, _INSIGHT_CACHE["source"]
    except Exception as exc:
        logger.warning(f"Hugging Face insight generation failed. Using fallback. Error: {exc}")
        fallback = _fallback_insights(metrics)
        _INSIGHT_CACHE["cache_key"] = cache_key
        _INSIGHT_CACHE["insights"] = fallback
        _INSIGHT_CACHE["expires_at"] = now + timedelta(minutes=5)
        _INSIGHT_CACHE["source"] = "fallback"
        return fallback, "fallback"


def _build_metrics(clinical_rows: List[Dict[str, Any]], batch_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    today = datetime.now(timezone.utc).date()

    risk_distribution = {"low": 0, "moderate": 0, "high": 0}
    date_buckets: Dict[str, Dict[str, int]] = defaultdict(
        lambda: {"clinical": 0, "batch": 0, "total": 0, "detected": 0}
    )
    top_feature_scores: Dict[str, float] = defaultdict(float)
    top_feature_counts: Dict[str, int] = defaultdict(int)

    clinical_count = len(clinical_rows)
    batch_total_predictions = 0
    pd_detected = 0
    today_total = 0
    today_detected = 0

    def register_probability(probability: float, date_key: Optional[str], origin: str) -> None:
        nonlocal pd_detected, today_total, today_detected

        if probability < 0.35:
            risk_distribution["low"] += 1
        elif probability < 0.65:
            risk_distribution["moderate"] += 1
        else:
            risk_distribution["high"] += 1
            pd_detected += 1

        if date_key:
            date_buckets[date_key][origin] += 1
            date_buckets[date_key]["total"] += 1
            if probability >= 0.65:
                date_buckets[date_key]["detected"] += 1

            bucket_date = datetime.fromisoformat(date_key).date()
            if bucket_date == today:
                today_total += 1
                if probability >= 0.65:
                    today_detected += 1

    for row in clinical_rows:
        probability = _safe_float(row.get("pd_probability"), 0.0)
        created_at = _parse_iso_datetime(row.get("created_at"))
        date_key = created_at.date().isoformat() if created_at else None
        register_probability(probability, date_key, "clinical")

        for feature_name, feature_value in _extract_feature_pairs(row.get("top_features")):
            top_feature_scores[feature_name] += feature_value
            top_feature_counts[feature_name] += 1

    for row in batch_rows:
        batch_payload = row.get("results_json", {})
        predictions = batch_payload.get("predictions", []) if isinstance(batch_payload, dict) else []
        created_at = _parse_iso_datetime(row.get("created_at"))
        date_key = created_at.date().isoformat() if created_at else None

        for prediction_item in predictions:
            probability = _extract_probability(prediction_item)
            if probability is None:
                continue
            batch_total_predictions += 1
            register_probability(probability, date_key, "batch")

            if isinstance(prediction_item, dict):
                nested_prediction = prediction_item.get("prediction", {})
                for feature_name, feature_value in _extract_feature_pairs(
                    nested_prediction.get("top_features")
                    if isinstance(nested_prediction, dict)
                    else []
                ):
                    top_feature_scores[feature_name] += feature_value
                    top_feature_counts[feature_name] += 1

    total_predictions = clinical_count + batch_total_predictions
    detection_rate = (pd_detected / total_predictions * 100) if total_predictions else 0.0

    last_14_days = [(today - timedelta(days=offset)).isoformat() for offset in range(13, -1, -1)]
    trend = [
        {
            "date": date_key,
            "clinical": date_buckets[date_key]["clinical"],
            "batch": date_buckets[date_key]["batch"],
            "total": date_buckets[date_key]["total"],
            "detected": date_buckets[date_key]["detected"],
        }
        for date_key in last_14_days
    ]

    current_7 = sum(item["total"] for item in trend[-7:])
    previous_7 = sum(item["total"] for item in trend[:-7])
    week_delta = 0.0
    if previous_7 > 0:
        week_delta = ((current_7 - previous_7) / previous_7) * 100
    elif current_7 > 0:
        week_delta = 100.0

    top_features = sorted(
        (
            {
                "name": name,
                "score": round(top_feature_scores[name], 2),
                "mentions": top_feature_counts[name],
            }
            for name in top_feature_scores
        ),
        key=lambda item: item["score"],
        reverse=True,
    )[:6]

    batch_runs = [
        {
            "created_at": row.get("created_at"),
            "filename": row.get("filename"),
            "total_records": int(_safe_float(row.get("total_records"), 0)),
            "successful_predictions": int(_safe_float(row.get("successful_predictions"), 0)),
            "failed_predictions": int(_safe_float(row.get("failed_predictions"), 0)),
            "status": row.get("status", "completed"),
        }
        for row in batch_rows
    ][:5]

    return {
        "kpis": {
            "clinical_assessments": clinical_count,
            "batch_predictions": batch_total_predictions,
            "total_predictions": total_predictions,
            "pd_detected": pd_detected,
            "detection_rate": round(detection_rate, 2),
            "week_over_week_change_percent": round(week_delta, 2),
        },
        "today": {
            "date": today.isoformat(),
            "total_predictions": today_total,
            "pd_detected": today_detected,
        },
        "risk_distribution": risk_distribution,
        "daily_trend": trend,
        "top_features": top_features,
        "recent_batch_runs": batch_runs,
    }


def get_dashboard_summary(request):
    try:
        if not supabase_admin:
            return jsonify({"error": "Database connection unavailable"}), 503

        user_id = request.args.get("user_id")

        clinical_query = supabase_admin.from_("clinical_assessments").select(
            "created_at,pd_probability,prediction_status,top_features"
        )
        batch_query = supabase_admin.from_("batch_process_results").select(
            "created_at,filename,total_records,successful_predictions,failed_predictions,results_json,status"
        )

        if user_id:
            clinical_query = clinical_query.eq("user_id", user_id)
            batch_query = batch_query.eq("user_id", user_id)

        clinical_response = clinical_query.order("created_at", desc=False).limit(5000).execute()
        batch_response = batch_query.order("created_at", desc=True).limit(5000).execute()

        clinical_rows = clinical_response.data or []
        batch_rows = batch_response.data or []

        metrics = _build_metrics(clinical_rows, batch_rows)
        insights, insight_source = _generate_hf_insights(metrics)

        return jsonify(
            {
                **metrics,
                "insights": insights[:3],
                "insight_source": insight_source,
                "last_updated": datetime.now(timezone.utc).isoformat(),
            }
        ), 200
    except Exception as exc:
        logger.error(f"Dashboard summary error: {exc}")
        return jsonify({"error": "Failed to fetch dashboard summary"}), 500
