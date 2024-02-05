from functools import wraps
from flask import request, jsonify, current_app
from app.resources.models.User import User
import jwt


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers["authorization"]

        if "Bearer " in token:
            token = token.split("Bearer ")[1]

        if not token:
            return jsonify({"message": "Token is missing!"}), 401

        try:
            data = jwt.decode(token, current_app.config["SECRET_KEY"])
            current_user = User.query.filter_by(userID=data["user"]["user_id"]).first()
        except:
            return jsonify({"message": "Token is invalid!"}), 403

        return f(current_user, *args, **kwargs)

    return decorated
