from flask import Blueprint, request
from controllers.prediction_controller import (
    predict_single, predict_batch, predict_audio_file, predict_video_file, 
    get_audio_history, get_video_history, get_model_info, get_benchmarks, 
    parse_file_data, get_analytics_aggregate, get_training_logs
)
from controllers.dashboard_controller import get_dashboard_summary

prediction_bp = Blueprint('prediction_bp', __name__)

@prediction_bp.route('/parse_file', methods=['POST'])
def parse_file_route():
    return parse_file_data(request)

@prediction_bp.route('/model_info', methods=['GET'])
def model_info_route():
    return get_model_info()

@prediction_bp.route('/predict', methods=['POST'])
def predict_route():
    return predict_single(request.get_json())

@prediction_bp.route('/predict_csv', methods=['POST'])
def predict_csv_route():
    return predict_batch(request)

@prediction_bp.route('/predict_audio', methods=['POST'])
def predict_audio_route():
    return predict_audio_file(request)

@prediction_bp.route('/predict_video', methods=['POST'])
def predict_video_route():
    return predict_video_file(request)

@prediction_bp.route('/audio_history', methods=['GET'])
def audio_history_route():
    return get_audio_history(request)

@prediction_bp.route('/video_history', methods=['GET'])
def video_history_route():
    return get_video_history(request)

@prediction_bp.route('/benchmarks', methods=['GET'])
def benchmarks_route():
    return get_benchmarks()

@prediction_bp.route('/analytics_aggregate', methods=['GET'])
def analytics_aggregate_route():
    return get_analytics_aggregate()

@prediction_bp.route('/training_logs', methods=['GET'])
def training_logs_route():
    return get_training_logs()

@prediction_bp.route('/dashboard/summary', methods=['GET'])
def dashboard_summary_route():
    return get_dashboard_summary(request)
