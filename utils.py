from functools import wraps
import time
from flask import request, jsonify, current_app
import redis
from app import db
from app.resources.models.GroupUser import GroupUser
from app.resources.models.LoggedAnswer import LoggedAnswer
from app.resources.models.User import User
from sqlalchemy.inspection import inspect
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


def is_ta(user_id, group_id):
    groupAccessLevel = (
        GroupUser.query.filter_by(userID=user_id, group_id=group_id)
        .first()
        .access_level
    )
    if groupAccessLevel == "ta":
        return True
    else:
        return False


def completeSessions(sessions):
    completeSessions = []
    for session in sessions:
        if (
            session.startTime != None
            and session.endTime != None
            and session.playerScore != None
        ):
            completeSessions.append(session)
        else:
            log_time = (
                LoggedAnswer.query.filter_by(sessionID=session.sessionID)
                .order_by(LoggedAnswer.logID.desc())
                .first()
            )
            if log_time is not None:
                log_time = log_time.log_time
                if session.sessionDate != time.strftime("%Y-%m-%d"):
                    session.endTime = log_time
                    completeSessions.append(session)
                    try:
                        redis_conn = redis.StrictRedis(
                            host=current_app.config["REDIS_HOST"],
                            port=current_app.config["REDIS_PORT"],
                            charset=current_app.config["REDIS_CHARSET"],
                            decode_responses=True,
                        )
                        redis_conn.delete("sessions_csv")
                    except redis.exceptions.ConnectionError:
                        pass
    return completeSessions
