from flask import Blueprint, jsonify, make_response, request
from app.resources.models.AnimelleSaveData import AnimelleSaveData
from app.db import db
from utils import token_required

animelle_bp = Blueprint("animelle", __name__)


@animelle_bp.get("/animellesavedata")
@token_required
def get_animelle_save_data(current_user):
    try:
        animelleSaveData = AnimelleSaveData.query.filter_by(
            userID=current_user.userID
        ).first()
        if not animelleSaveData:
            return make_response(
                jsonify({"message": "User does not have AnimELLE save data"}), 404
            )
        return make_response(jsonify(animelleSaveData.serialize()), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@animelle_bp.post("/animellesavedata")
@token_required
def post_animelle_save_data(current_user):
    data = request.form
    saveData = data["saveData"]

    try:
        animelleSaveData = AnimelleSaveData.query.filter_by(
            userID=current_user.userID
        ).first()
        if not animelleSaveData:
            animelleSaveData = AnimelleSaveData(current_user.userID, saveData)
            db.session.add(animelleSaveData)
        else:
            animelleSaveData.saveData = saveData
        db.session.commit()
        return make_response(jsonify({"message": "Post was successful"}), 201)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@animelle_bp.put("/animellesavedata")
@token_required
def put_animelle_save_data(current_user):
    data = request.form
    saveData = data["saveData"]

    try:
        animelleSaveData = AnimelleSaveData.query.filter_by(
            userID=current_user.userID
        ).first()
        if not animelleSaveData:
            return make_response(
                jsonify({"message": "User does not have AnimELLE save data"}), 404
            )
        animelleSaveData.saveData = saveData
        db.session.commit()
        return make_response(jsonify({"message": "Put was successful"}), 204)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)
