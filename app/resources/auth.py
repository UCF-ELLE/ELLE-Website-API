import datetime
import os
import random
import string
from flask import Blueprint, request, jsonify, make_response, current_app
import jwt
from werkzeug.security import check_password_hash, generate_password_hash
from app.resources.models.User import User
from app.resources.models.GroupUser import GroupUser
from app.resources.models.UserPreferences import UserPreferences
from app.resources.models.Group import Group
from app.resources.models.Token import Token
from app.db import db, mail
from flask_mail import Message

from utils import token_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
def login():
    data = request.form
    username = data["username"].lower()
    password = data["password"]

    try:
        user = User.query.filter_by(username=username).first()
        if user:
            if check_password_hash(user.password, password):
                print("checked")
                expires = datetime.timedelta(hours=18)
                user_obj = {
                    "user_id": user.userID,
                    "permissionGroup": user.permissionGroup,
                }
                access_token = jwt.encode(
                    {"user": user_obj, "exp": datetime.datetime.utcnow() + expires},
                    current_app.config["SECRET_KEY"],
                )
                return make_response(
                    jsonify({"token": access_token, "id": user.userID}), 200
                )
            else:
                return make_response(jsonify({"message": "Invalid password"}), 403)
        else:
            return make_response(jsonify({"message": "User not found"}), 404)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@auth_bp.post("/register")
def register():
    data = request.form
    username = data["username"].lower()
    password = data["password"]
    password_confirm = data["password_confirm"]
    email = data["email"]
    groupCode = data["groupCode"]

    try:
        user = User.query.filter_by(username=username).first()
        if user:
            return make_response(jsonify({"message": "Username already exists"}), 409)
        if password != password_confirm:
            return make_response(jsonify({"message": "Passwords do not match"}), 400)

        if len(username) > 20:
            return make_response(
                jsonify({"message": "Username should be less than 20 characters"}), 400
            )
        if not any(char.isDigit() for char in username):
            return make_response(
                jsonify({"message": "Username should contain at least one number"}), 400
            )

        # check if email exists already in the database
        if email and User.query.filter_by(email=email).first():
            return make_response(jsonify({"message": "Email already exists"}), 409)

        salted_password = generate_password_hash(password)

        user = User(username, salted_password, "st", email)
        db.session.add(user)

        userPreferences = UserPreferences(user.userID)
        db.session.add(userPreferences)

        if groupCode:
            group = Group.query.filter_by(groupCode=groupCode).first()
            if group:
                groupUser = GroupUser(user.userID, group.groupID, "st")
                db.session.add(groupUser)

        return make_response(jsonify({"message": "Successfully registered!"}), 201)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@auth_bp.post("/resetpassword")
def reset_password():
    data = request.form
    email = data["email"]
    reset_token = data["resetToken"]
    password = data["password"]
    password_confirm = data["password_confirm"]

    if password != password_confirm:
        return make_response(jsonify({"message": "Passwords do not match"}), 400)

    try:
        user = User.query.filter_by(email=email).first()
        if (
            not user
            or not user.pwdResetToken
            or not check_password_hash(user.pwdResetToken, reset_token)
        ):
            return make_response(
                jsonify({"message": "No records match what was provided"}), 404
            )

        user.password = generate_password_hash(password)
        user.pwdResetToken = None
        db.session.commit()

        return make_response(jsonify({"message": "Successfully reset password"}), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@auth_bp.post("/forgotpassword")
def forgot_password():
    data = request.form
    email = data["email"]
    returnMessage = {"message": "Processed"}

    user = User.query.filter_by(email=email).first()
    if not user:
        return make_response(returnMessage, 202)

    resetToken = "".join(random.choice(string.hexdigits + "!#_@") for _ in range(6))
    if_exist = User.query.filter_by(pwdResetToken=resetToken).first().userID
    while if_exist:
        resetToken = "".join(random.choice(string.hexdigits + "!#_@") for _ in range(6))
        if_exist = User.query.filter_by(pwdResetToken=resetToken).first().userID

    user.pwdResetToken = generate_password_hash(resetToken)
    db.session.commit()

    msg = Message(
        "Forgot Password - EndLess Learner",
        sender="ellegamesucf@gmail.com",
        recipients=[data["email"]],
    )
    msg.html = f"""You are receiving this email because you requested to reset your ELLE account password.<br><br>Please visit <a href="https://chdr.cs.ucf.edu/elle/resetpassword">https://chdr.cs.ucf.edu/elle/resetpassword</a> and use the following token to reset your password:<br><br><b>{resetToken}</b><br><br>If you did not request to reset your password, you can ignore this email."""
    mail.send(msg)

    return make_response(returnMessage, 202)


@auth_bp.post("/changepassword")
@token_required
def change_password(current_user):
    data = request.form
    user_id = data["userID"]
    password = data["password"]

    try:
        if current_user.permissionGroup == "pf" and user_id:
            user_status = User.query.filter_by(userID=user_id).first().permissionGroup
            if not user_status:
                return make_response(
                    jsonify({"message": "Referred user not found"}), 400
                )
            if user_status != "st":
                return make_response(
                    jsonify(
                        {
                            "message": "A professor cannot reset non-student users' password"
                        }
                    ),
                    400,
                )

        if (
            current_user.permissionGroup != "su"
            and current_user.permissionGroup != "pf"
            and current_user.userID != user_id
        ):
            return make_response(
                jsonify({"message": "Cannot reset another user's password"}), 400
            )
        elif (
            (
                current_user.permissionGroup == "su"
                or current_user.permissionGroup == "pf"
            )
            and (not user_id or user_id == "")
            or current_user.permissionGroup == "st"
        ):
            user_id = current_user.userID

        user = User.query.filter_by(userID=user_id).first()
        user.password = generate_password_hash(password)
        db.session.commit()

        return make_response(jsonify({"message": "Successfully reset password"}), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@auth_bp.post("/forgotusername")
def forgot_username():
    data = request.form
    email = data["email"]
    returnMessage = {"message": "Processed"}

    user = User.query.filter_by(email=email).first()
    if not user:
        return make_response(returnMessage, 202)

    msg = Message(
        "Forgot Username - EndLess Learner",
        sender="ellegamesucf@gmail.com",
        recipients=[data["email"]],
    )
    msg.html = f"""You are receiving this email because you requested to receive your ELLE account username.<br><br>The username associated with this email is <b>{username[0][0]}</b>.<br><br>Please visit <a href="https://chdr.cs.ucf.edu/elle/login">https://chdr.cs.ucf.edu/elle/login</a> to login with that username."""
    mail.send(msg)

    return make_response(returnMessage, 202)


@auth_bp.post("/checkifactive")
@token_required
def check_if_active(current_user):
    data = request.form
    token = data["token"]

    try:
        if Token.query.filter_by(expired=token).first() == None:
            return make_response(jsonify({"userID": current_user.userID}), 200)
        return make_response(jsonify({"message": "Token is invalid"}), 401)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@auth_bp.get("/generateusername")
def get(self):

    def generateusername(num_results=1):
        directory_path = os.path.dirname(__file__)
        adjectives, nouns = [], []
        with open(
            os.path.join(directory_path, "data", "adjectives.txt"), "r"
        ) as file_adjective:
            with open(
                os.path.join(directory_path, "data", "nouns.txt"), "r"
            ) as file_noun:
                for line in file_adjective:
                    adjectives.append(line.strip())
                for line in file_noun:
                    nouns.append(line.strip())

        usernames = []
        for _ in range(num_results):
            adjective = random.choice(adjectives)
            noun = random.choice(nouns).capitalize()
            num = str(random.randrange(10))
            usernames.append(adjective + noun + num)
        return usernames

    return make_response(jsonify(generateusername()), 200)


@auth_bp.get("/getusernames")
def get_usernames():
    try:
        usernames = User.query.with_entities(User.username).all()
        return make_response(jsonify(usernames), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@auth_bp.get("/generatetotc")
@token_required
def generate_otc(current_user):
    try:
        otc = "".join(random.choice(string.digits) for _ in range(6))
        user = User.query.filter_by(userID=current_user.userID).first()
        user.otc = otc
        db.session.commit()
        return make_response(jsonify({"otc": otc}), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@auth_bp.get("/otclogin")
def otc_login():
    data = request.form
    otc = data["otc"]

    try:
        user = User.query.filter_by(otc=otc).first()
        if user:
            user.otc = None
            db.session.commit()
            expires = datetime.timedelta(hours=18)
            user_obj = {
                "user_id": user.userID,
                "permissionGroup": user.permissionGroup,
            }
            access_token = jwt.encode(
                {"user": user_obj, "exp": datetime.datetime.utcnow() + expires},
                current_app.config["SECRET_KEY"],
            )
            return make_response(
                jsonify({"token": access_token, "id": user.userID}), 200
            )
        else:
            return make_response(jsonify({"message": "Invalid otc"}), 400)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)
