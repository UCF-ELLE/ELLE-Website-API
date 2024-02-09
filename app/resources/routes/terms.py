from flask import Blueprint, jsonify, make_response, request
from app.db import db
from app.resources.models.Image import Image
from app.resources.models.Audio import Audio
from app.resources.models.Question import Question
from app.resources.models.ModuleQuestion import ModuleQuestion
from app.resources.models.Tag import Tag
from app.resources.models.Answer import Answer
from app.resources.models.LoggedAnswer import LoggedAnswer
from app.resources.models.Term import Term
from utils import token_required, is_ta
from werkzeug.utils import secure_filename
from app.config import IMG_UPLOAD_FOLDER, AUD_UPLOAD_FOLDER
import os

terms_bp = Blueprint("terms", __name__)


@terms_bp.get("/term")
@token_required
def get_term(current_user):
    data = request.get_json()
    search_term = data["search_term"]
    language = data["language"]

    matching_terms = []
    language = language.lower()
    # if there is no search term provided, return all the terms
    if not search_term:
        results = (
            Term.query.join(Image.imageID == Term.imageID)
            .join(Audio.audioID == Term.audioID)
            .filter_by(language=language)
            .all()
        )
        if results:
            for term in results:
                matching_terms.append(term.to_json())
        return make_response(jsonify(matching_terms), 200)

    # search through different fields in term table that [partially] matches the given search term
    search_string = search_term.lower()
    results = (
        Term.query.join(Image.imageID == Term.imageID)
        .join(Audio.audioID == Term.audioID)
        .filter_by(language=language)
        .filter(
            Term.front.like(search_string + "%")
            | Term.back.like(search_string + "%")
            | Term.type.like(search_string)
        )
    )
    if results:
        for term in results:
            matching_terms.append(term.to_json())

    # searching through tags that [partially] matches the given search term
    results = (
        Term.query.join(Image.imageID == Term.imageID)
        .join(Audio.audioID == Term.audioID)
        .join(Tag.termID == Term.termID)
        .filter_by(language=language)
        .filter(Tag.tagName.like(search_string + "%"))
    )
    if results:
        for term in results:
            if term.to_json() not in matching_terms:
                matching_terms.append(term.to_json())
    return make_response(jsonify(matching_terms), 200)


@terms_bp.post("/term")
@token_required
def post_term(current_user):
    data = request.get_json()
    front = data["front"]
    back = data["back"]
    type = data["type"]
    gender = data["gender"]
    language = data["language"]
    termID = data["termID"]
    moduleID = data["moduleID"]
    groupID = data["groupID"]

    if current_user.permissionGroup == "st" and not is_ta(current_user, groupID):
        return make_response(
            jsonify({"message": "User not authorized to create terms"}), 400
        )

    imageID = None
    audioID = None
    if type:
        type = type[:2]
    if not termID:
        termID = None

    if not gender:
        gender = "N"

    if not language:
        language = None

    if not data["tag"]:
        data["tag"] = []

    try:
        # If an image was provided to upload
        if "image" in request.files:
            file = request.files["image"]
            if not file:
                make_response(
                    jsonify({"message": "Image file not recieved properly"}), 500
                )
            filename = secure_filename(file.filename)
            image = Image(imageLocation=filename)
            db.session.add(image)
            db.session.commit()
            imageID = image.imageID
            file.save(os.path.join(IMG_UPLOAD_FOLDER, filename))

        if "audio" in request.files:
            file = request.files["audio"]
            if not file:
                make_response(
                    jsonify({"message": "Audio file not recieved properly"}), 500
                )
            filename = secure_filename(file.filename)
            audio = Audio(audioLocation=filename)
            db.session.add(audio)
            db.session.commit()
            audioID = audio.audioID
            file.save(os.path.join(AUD_UPLOAD_FOLDER, filename))

        if termID:
            term = Term.query.filter_by(termID=termID).first()
            if not term:
                return make_response(
                    jsonify({"message": "Not an existing term to edit"}), 404
                )
            term.front = front
            term.back = back
            term.type = type
            term.gender = gender
            term.language = language
            db.session.commit()

            if imageID:
                if term.imageID:
                    image = Image.query.filter_by(imageID=term.imageID).first()
                    os.remove(os.path.join(IMG_UPLOAD_FOLDER, image.imageLocation))
                    db.session.delete(image)
                    db.session.commit()
                term.imageID = imageID

            if audioID:
                if term.audioID:
                    audio = Audio.query.filter_by(audioID=term.audioID).first()
                    os.remove(os.path.join(AUD_UPLOAD_FOLDER, audio.audioLocation))
                    db.session.delete(audio)
                    db.session.commit()
                term.audioID = audioID

            # add new tags or remove tags if they were removed
            attached_tags = Tag.query.filter_by(termID=termID).all()
            if not attached_tags and data["tag"]:
                for tag in data["tag"]:
                    tag = Tag(tagName=tag, termID=termID)
                    db.session.add(tag)
                    db.session.commit()
            elif not data["tag"] and attached_tags:
                for tag in attached_tags:
                    db.session.delete(tag)
                    db.session.commit()
            elif data["tag"] and attached_tags:
                existing_tags = []
                for tag in attached_tags:
                    existing_tags.append(tag.tagName)
                different_tags = [
                    i
                    for i in existing_tags + data["tag"]
                    if i not in existing_tags or i not in data["tag"]
                ]
                if different_tags:
                    for tag in different_tags:
                        if tag in existing_tags and tag not in data["tag"]:
                            tag = Tag.query.filter_by(
                                tagName=tag, termID=termID
                            ).first()
                            db.session.delete(tag)
                            db.session.commit()
                        elif tag in data["tag"] and tag not in existing_tags:
                            tag = Tag(tagName=tag, termID=termID)
                            db.session.add(tag)
                            db.session.commit()
            return make_response(jsonify({"message": "Term Modified: " + termID}), 201)
        else:
            term = Term(
                imageID=imageID,
                audioID=audioID,
                front=front,
                back=back,
                gender=gender,
                language=language,
                type=type,
            )
            db.session.add(term)
            db.session.commit()
            termID = term.termID

            if data["tag"]:
                for tag in data["tag"]:
                    tag = Tag(tagName=tag, termID=termID)
                    db.session.add(tag)
                    db.session.commit()

            typeQuestion = (
                "PHRASE" if type and (type == "PH" or type == "PHRASE") else "MATCH"
            )
            questionText = "Match: " + front + "?"
            question = Question(type=typeQuestion, questionText=questionText)
            db.session.add(question)
            db.session.commit()
            questionID = question.questionID

            moduleQuestion = ModuleQuestion(moduleID=moduleID, questionID=questionID)
            db.session.add(moduleQuestion)
            db.session.commit()

            answer = Answer(questionID=questionID, termID=termID)
            db.session.add(answer)
            db.session.commit()

            return make_response(
                jsonify({"message": "Successfully created a term", "termID": termID}),
                201,
            )
    except Exception as e:
        return make_response(jsonify({"message": str(e)}), 500)


@terms_bp.delete("/term")
@token_required
def delete_term(current_user):
    data = request.get_json()
    termID = data["termID"]
    groupID = data["groupID"]

    if current_user.permissionGroup == "st" and not is_ta(current_user, groupID):
        return make_response(
            jsonify({"message": "User not authorized to delete terms"}), 400
        )

    if not termID:
        return make_response(
            jsonify({"message": "Please pass in a valid term id"}), 400
        )

    try:
        term = Term.query.filter_by(termID=termID).first()
        if not term:
            return make_response(
                jsonify({"message": "cannot delete non-existing term"}), 403
            )

        if term.imageID:
            image = Image.query.filter_by(imageID=term.imageID).first()
            os.remove(os.path.join(IMG_UPLOAD_FOLDER, image.imageLocation))
            db.session.delete(image)
            db.session.commit()
        if term.audioID:
            audio = Audio.query.filter_by(audioID=term.audioID).first()
            os.remove(os.path.join(AUD_UPLOAD_FOLDER, audio.audioLocation))
            db.session.delete(audio)
            db.session.commit()

        answerRecords = Answer.query.filter_by(termID=termID).all()
        for answer in answerRecords:
            questionInAnswers = Answer.query.filter_by(
                questionID=answer.questionID
            ).all()
            if len(questionInAnswers) <= 1:
                question = Question.query.filter_by(
                    questionID=answer.questionID
                ).first()
                db.session.delete(question)
                db.session.commit()
            db.session.delete(answer)
            db.session.commit()

        loggedAnswers = LoggedAnswer.query.filter_by(termID=termID).all()
        for log in loggedAnswers:
            log.termID = None
            log.deleted_termID = termID
            db.session.commit()

        db.session.delete(term)
        db.session.commit()
        return make_response(
            jsonify({"message": "Term " + termID + " successfully deleted"}), 202
        )
    except Exception as e:
        return make_response(jsonify({"message": str(e)}), 500)


@terms_bp.get("/tags")
@token_required
def get_tags(current_user):
    tags = Tag.query.all()
    tag_list = []
    for tag in tags:
        tag_list.append(tag.tagName)
    return make_response(jsonify({"tags": tag_list}), 200)


@terms_bp.get("/tag_term")
@token_required
def get_tag_term(current_user):
    tag_name = request.get_json()["tag_name"]
    terms = Term.query.join(Tag.termID == Term.termID).filter_by(tagName=tag_name).all()
    term_list = []
    for term in terms:
        term_list.append(term.to_json())
    return make_response(jsonify(term_list), 200)


@terms_bp.get("/specificterm")
@token_required
def get_specific_term(current_user):
    termID = request.get_json()["termID"]
    term = Term.query.filter_by(termID=termID).first()
    if not term:
        return make_response(jsonify({"message": "Term not found"}), 404)
    return make_response(jsonify(term.to_json()), 200)


@terms_bp.get("/tags_in_term")
@token_required
def get_tags_in_term(current_user):
    termID = request.get_json()["termID"]
    tags = Tag.query.filter_by(termID=termID).all()
    tag_list = []
    for tag in tags:
        tag_list.append(tag.tagName)
    return make_response(jsonify(tag_list), 200)


@terms_bp.get("/tagcount")
@token_required
def get_tag_count(current_user):
    tags = Tag.query.all()
    tag_count = {}
    for tag in tags:
        tag_name = tag.tagName
        if tag_name not in tag_count:
            tag_count[tag_name] = 1
        else:
            tag_count[tag_name] = tag_count[tag_name] + 1
    return make_response(jsonify(tag_count), 200)
