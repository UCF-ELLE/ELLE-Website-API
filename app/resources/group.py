import random
import string
from flask import Blueprint, jsonify, make_response, request
from app.resources.models.Group import Group
from app.db import db
from app.resources.models.GroupUser import GroupUser
from app.resources.models.User import User
from utils import token_required

group_bp = Blueprint("group", __name__)


@group_bp.post("/group")
@token_required
def post_group(current_user):
    data = request.form
    groupName = data["groupName"]
    try:
        group_exists = Group.query.filter_by(groupName=groupName).first()
        if group_exists:
            return make_response(jsonify({"message": "Group already exists"}), 400)
        group_code = "".join(
            random.choice(string.ascii_uppercase + string.digits) for _ in range(5)
        )
        groupCode_exists = Group.query.filter_by(groupCode=group_code).first()
        if groupCode_exists:
            return make_response(jsonify({"message": "Group code already exists"}), 400)

        group = Group(groupName, group_code)
        db.session.add(group)
        db.session.commit()

        group_user = GroupUser(current_user.userID, group.groupID, "pf")
        db.session.add(group_user)
        db.session.commit()

        return make_response(
            jsonify({"message": "Successfully created the class."}), 201
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@group_bp.put("/group")
@token_required
def put_group(current_user):
    data = request.form
    groupID = data["groupID"]
    groupName = data["groupName"]
    groupCode = data["groupCode"]

    if not groupID and not groupName and not groupCode:
        return make_response(
            jsonify({"message": "No values passed in, nothing changed."}), 200
        )

    try:
        if current_user.permissionGroup not in ("su", "pf"):
            return make_response(jsonify({"message": "Unauthorized"}), 403)

        group = Group.query.filter_by(groupID=groupID).first()
        if not group:
            return make_response(jsonify({"message": "Group does not exist"}), 404)
        if groupName:
            group.groupName = groupName
        if groupCode:
            group.groupCode = groupCode
        db.session.commit()
        return make_response(jsonify({"message": "Successfully updated group."}), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@group_bp.delete("/group")
@token_required
def delete_group(current_user):
    data = request.form
    groupID = data["groupID"]
    try:
        if current_user.permissionGroup not in ("su", "pf"):
            return make_response(jsonify({"message": "Unauthorized"}), 403)

        if current_user.permissionGroup == "pf":
            group_user = GroupUser.query.filter_by(
                userID=current_user.userID, groupID=groupID
            ).first()
            if not group_user:
                return make_response(jsonify({"message": "Unauthorized"}), 403)

        group = Group.query.filter_by(groupID=groupID).first()
        if not group:
            return make_response(jsonify({"message": "Group does not exist"}), 404)
        db.session.delete(group)
        db.session.commit()
        return make_response(jsonify({"message": "Successfully deleted group."}), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@group_bp.post("/groupregister")
@token_required
def post_group_register(current_user):
    data = request.form
    groupCode = data["groupCode"]

    if current_user.permissionGroup == "su":
        return make_response(
            jsonify({"message": "Superadmins cannot register for classes."}), 400
        )

    try:
        group = Group.query.filter_by(groupCode=groupCode).first()
        if not group:
            return make_response(jsonify({"message": "Invalid class code."}), 400)

        group_user = GroupUser.query.filter_by(
            userID=current_user.userID, groupID=group.groupID
        ).first()
        if group_user:
            return make_response(
                jsonify({"message": "User has already registered for the class."}), 400
            )

        group_user = GroupUser(
            current_user.userID, group.groupID, current_user.permissionGroup
        )
        db.session.add(group_user)
        db.session.commit()
        return make_response(
            jsonify({"message": "Successfully registered for group"}), 201
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@group_bp.get("/searchusergroups")
@token_required
def get_search_user_groups(current_user):
    try:
        groups = (
            Group.query.join(GroupUser, Group.groupID == GroupUser.groupID)
            .filter(GroupUser.userID == current_user.userID)
            .all()
        )
        groups = [group.serialize() for group in groups]

        for group in groups:
            group_users = GroupUser.query.filter_by(groupID=group["groupID"]).all()
            group_users = [group_user.serialize() for group_user in group_users]
            group["group_users"] = group_users

        return make_response(jsonify(groups), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@group_bp.get("/usersingroup")
@token_required
def get_users_in_group(current_user):
    data = request.form
    groupID = data["groupID"]
    try:
        if current_user.permissionGroup == "st":
            return make_response(
                jsonify({"message": "User cannot search for users in a group."}), 403
            )

        group_users = (
            GroupUser.join(User, GroupUser.userID == User.userID)
            .filter(GroupUser.groupID == groupID)
            .all()
        )
        group_users = [group_user.serialize() for group_user in group_users]
        return make_response(jsonify(group_users), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@group_bp.get("/generategroupcode")
@token_required
def get_generate_group_code(current_user):
    data = request.form
    groupID = data["groupID"]
    try:
        if current_user.permissionGroup == "st":
            return make_response(
                jsonify({"message": "User cannot generate new group codes."}), 403
            )

        group = Group.query.filter_by(groupID=groupID).first()
        if not group:
            return make_response(jsonify({"message": "Group does not exist"}), 404)

        group_code = "".join(
            random.choice(string.ascii_uppercase + string.digits) for _ in range(5)
        )

        while True:
            group_code_exists = Group.query.filter_by(groupCode=group_code).first()
            if group_code_exists:
                group_code = "".join(
                    random.choice(string.ascii_uppercase + string.digits)
                    for _ in range(5)
                )
            else:
                break

        group.groupCode = group_code
        db.session.commit()
        return make_response(jsonify({"groupCode": group_code}), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)
