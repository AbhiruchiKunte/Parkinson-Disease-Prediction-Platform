from flask import jsonify
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase Admin Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables")

supabase_admin: Client = create_client(url, key)

def verify_email(data):
    """
    Check if a user exists with the given email.
    Note: Supabase Admin API 'list_users' allows filtering/searching.
    """
    email = data.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400

    try:
        page = 1
        per_page = 1000 # Fetch valid chunk
        users = supabase_admin.auth.admin.list_users(page=page, per_page=per_page)
        
        user_exists = False
        user_id = None
        
        for user in users:
            if user.email == email:
                user_exists = True
                user_id = user.id
                break
                
        if user_exists:
            return jsonify({
                "exists": True, 
                "message": "User found",
                "user_id": user_id # return ID so we can use it for password reset
            }), 200
        else:
            return jsonify({"exists": False, "message": "Mail not found please register yourself"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def reset_password(data):
    """
    Update password for a user using Admin API.
    """
    user_id = data.get('user_id')
    new_password = data.get('new_password')
    
    if not user_id or not new_password:
        return jsonify({"error": "User ID and new password are required"}), 400

    try:
        attributes = {"password": new_password}
        user = supabase_admin.auth.admin.update_user_by_id(user_id, attributes)
        
        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
