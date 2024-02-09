from flask import Blueprint, jsonify, make_response, request
from app.config import HAND_PREFERENCES
from app.resources.models.GroupUser import GroupUser
from app.resources.models.User import User
from app.resources.models.Group import Group
from app.resources.models.Session import Session
from app.resources.models.UserPreferences import UserPreferences
from app.db import db

from utils import token_required


user_bp = Blueprint("user", __name__)


@user_bp.get("/users")
@token_required
def get_users(current_user):
    if current_user.permissionGroup != "su":
        return make_response(jsonify({"message": "Unauthorized"}), 403)

    try:
        # Get all users except for the current user
        users = User.query.filter(User.userID != current_user.userID).all()
        users = [user.serialize() for user in users]

        # Get all groups associated with each user
        for user in users:
            groups = (
                Group.query.join(GroupUser, Group.groupID == GroupUser.groupID)
                .filter(GroupUser.userID == user["userID"])
                .all()
            )
            user["groups"] = [group.serialize() for group in groups]

        print(users)

        return make_response(jsonify(users), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@user_bp.get("/user")
@token_required
def get_user(current_user):
    try:
        user = User.query.filter_by(userID=current_user.userID).first()
        return make_response(jsonify(user.serialize()), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@user_bp.put("/user")
@token_required
def update_user_email(current_user):
    try:
        data = request.form
        email = data["newEmail"]
        user = User.query.filter_by(userID=current_user.userID).first()
        user.email = email
        db.session.commit()

        print(user.serialize())
        return make_response(
            jsonify(
                {"user": user.serialize(), "message": "Successfully changed email"}
            ),
            200,
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@user_bp.get("/highscores")
@token_required
def get_highscores(current_user):
    data = request.form
    moduleID = data["moduleID"]
    platform = data["platform"]

    try:
        sessions = (
            Session.query.filter(
                Session.moduleID == moduleID, Session.platform == platform
            )
            .order_by(Session.playerScore)
            .all()
        )
        user = []

        for session in sessions:
            userscores = {}
            userscores["score"] = session.playerScore
            username = User.query.filter(User.userID == session.userID).first().username
            userscores["username"] = username
            user.append(userscores)

        return make_response(jsonify(user), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@user_bp.get("/userlevels")
@token_required
def get_user_levels(current_user):
    try:
        groups = (
            Group.query.join(GroupUser, Group.groupID == GroupUser.groupID)
            .filter(GroupUser.userID == current_user.userID)
            .all()
        )
        group_user = GroupUser.query.filter_by(userID=current_user.userID).all()
        print([group.serialize() for group in groups])
        print([group.serialize() for group in group_user])

        userLevels = []
        for userLevel in groups:
            userLevels.append(
                {
                    "groupID": userLevel.groupID,
                    "groupName": userLevel.groupName,
                    "accessLevel": userLevel.accessLevel,
                }
            )

        return make_response(jsonify(userLevels), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@user_bp.get("/userpreferences")
@token_required
def get_user_preferences(current_user):
    try:
        user_preferences = (
            UserPreferences.query.filter_by(userID=current_user.userID)
            .first()
            .preferences
        )
        return make_response(jsonify(user_preferences.serialize()), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@user_bp.put("/userpreferences")
@token_required
def update_user_preferences(current_user):
    data = request.form
    preferredHand = data["preferredHand"]
    vrGloveColor = data["vrGloveColor"]

    if preferredHand not in HAND_PREFERENCES:
        return make_response(
            jsonify(
                {"message": "Please pass in either R, L, or A for hand preferences"}
            ),
            400,
        )

    try:
        user_preferences = UserPreferences.query.filter_by(
            userID=current_user.userID
        ).first()
        user_preferences.preferredHand = preferredHand
        user_preferences.vrGloveColor = vrGloveColor
        user_preferences.userID = current_user.userID
        db.session.commit()
        return make_response(
            jsonify(user_preferences.serialize()),
            "Successfully updated preferences",
            200,
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)
