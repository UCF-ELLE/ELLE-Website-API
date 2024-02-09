from app.db import db
from app.resources.models.GroupUser import GroupUser
from app.resources.models.User import User
from utils import token_required
from flask import Blueprint, request, jsonify, make_response

access_bp = Blueprint("access", __name__)


@access_bp.post("/elevateaccess")
@token_required
def change_access(current_user):
    try:
        data = request.form
        user_id = data["userID"]
        access_level = data["accessLevel"]
        group_id = data["groupID"]

        if current_user.permissionGroup not in ("su", "pf"):
            return make_response(jsonify({"message": "Unauthorized"}), 403)

        if access_level not in ("su", "pf", "st"):
            return make_response(jsonify({"message": "Invalid access level"}), 400)

        if group_id and access_level not in ("ta", "st"):
            return make_response(
                jsonify({"message": "Invalid access level for group"}), 400
            )

        user = User.query.filter_by(userID=user_id).first()
        if not user:
            return make_response(jsonify({"message": "User not found"}), 400)

        if access_level in ("pf", "su") and current_user.permissionGroup != "su":
            return make_response(
                jsonify({"message": "Unauthorized to grant the requested level"}), 401
            )

        if group_id:
            group_user = GroupUser.query.filter_by(
                userID=user_id, groupID=group_id
            ).first()
            if not group_user:
                return make_response(jsonify({"message": "User not in group"}), 400)
            group_user.accessLevel = access_level
            db.session.commit()
        else:
            user.permissionGroup = access_level
            db.session.commit()

        return make_response(
            jsonify({"message": "Successfully changed permission"}), 200
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)
