from flask import Blueprint, request
from controllers.user_controller import verify_email, reset_password

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/verify-email', methods=['POST'])
def verify_email_route():
    return verify_email(request.get_json())

@user_bp.route('/reset-password', methods=['POST'])
def reset_password_route():
    return reset_password(request.get_json())
