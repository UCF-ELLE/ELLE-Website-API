import json
import os
from pathlib import Path
import time
from flask import Blueprint, jsonify, make_response, request
from app.resources.models.Answer import Answer
from app.db import db
from app.resources.models.Image import Image
from app.resources.models.Audio import Audio
from app.resources.models.LoggedAnswer import LoggedAnswer
from app.resources.models.ModuleQuestion import ModuleQuestion
from app.resources.models.Question import DeletedQuestion, Question
from app.resources.models.Tag import Tag
from app.resources.models.Term import Term
from utils import token_required
from werkzeug.utils import secure_filename
from app.config import (
    IMAGE_EXTENSIONS,
    AUDIO_EXTENSIONS,
    TEMP_UPLOAD_FOLDER,
)

question_bp = Blueprint("question", __name__)


@question_bp.post("/addAnswer")
@token_required
def add_answer(current_user):
    data = request.get_json()
    question_id = data["questionID"]
    term_id = data["termID"]
    group_id = data["groupID"]

    if not current_user.is_ta(group_id):
        return make_response(jsonify({"error": "User not authorized to answers."}), 400)

    try:
        answer = Answer(questionID=question_id, termID=term_id)
        db.session.add(answer)
        db.session.commit()
        return make_response(jsonify({"message": "Successfully added answer!"}), 201)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@question_bp.delete("/deleteanswer")
@token_required
def delete_answer(current_user):
    data = request.get_json()
    question_id = data["questionID"]
    term_id = data["termID"]
    group_id = data["groupID"]

    if current_user.permissionGroup == "st" and not current_user.is_ta(group_id):
        return make_response(
            jsonify({"error": "User not authorized to delete answers."}), 400
        )

    try:
        Answer.query.filter_by(questionID=question_id, termID=term_id).delete()
        db.session.commit()
        return make_response(jsonify({"message": "Deleted Answer"}), 201)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@question_bp.post("/modifyquestion")
@token_required
def modify_question(current_user):
    data = request.get_json()
    question_id = data["questionID"]
    question_text = data["questionText"]
    question_type = data["type"]
    remove_audio = data["removeAudio"]
    remove_image = data["removeImage"]
    group_id = data["groupID"]
    image_id = None
    audio_id = None

    if current_user.permissionGroup == "st" and not current_user.is_ta(group_id):
        return make_response(
            jsonify({"error": "User not authorized to modify questions."}), 400
        )

    try:
        if "image" in request.files:
            dateTime = time.strftime("%d%m%y%H%M%S")
            file = request.files["image"]
            filename, extension = os.path.splitext(file.filename)
            filename = secure_filename(filename) + str(dateTime)
            full_file_name = str(filename) + str(extension)

            if extension[1:] in IMAGE_EXTENSIONS:
                file.save(str(Path(TEMP_UPLOAD_FOLDER + full_file_name).absolute()))

                image = Image(imageLocation=full_file_name)
                db.session.add(image)

                os.rename(str(Path(TEMP_UPLOAD_FOLDER + full_file_name).absolute()))

                image = Image.query.filter_by(imageLocation=full_file_name).first()
                data["imageID"] = image.imageID
            else:
                return make_response(
                    jsonify(
                        {
                            "error": "File format of "
                            + filename
                            + extension
                            + " is not supported. \
                        Please upload an image format of jpeg, jpg, or png format."
                        }
                    ),
                    415,
                )

        if "audio" in request.files:
            dateTime = time.strftime("%d%m%y%H%M%S")
            file = request.files["audio"]
            filename, extension = os.path.splitext(file.filename)
            filename = secure_filename(filename) + str(dateTime)
            full_file_name = str(filename) + str(extension)

            if extension[1:] in AUDIO_EXTENSIONS:
                file.save(str(Path(TEMP_UPLOAD_FOLDER + full_file_name).absolute()))

                audio = Audio(audioLocation=full_file_name)
                db.session.add(audio)

                os.rename(str(Path(TEMP_UPLOAD_FOLDER + full_file_name).absolute()))

                audio = Audio.query.filter_by(audioLocation=full_file_name).first()
                data["audioID"] = audio.audioID
            else:
                return make_response(
                    jsonify(
                        {
                            "error": "File format of "
                            + filename
                            + extension
                            + " is not supported. \
                        Please upload an audio of format of wav, ogg, or mp3"
                        }
                    ),
                    415,
                )

        question = Question.query.filter_by(questionID=question_id).first()
        question.audioID = data["audioID"] or question.audioID
        question.imageID = data["imageID"] or question.imageID

        if remove_audio:
            question.audioID = None

        if remove_image:
            question.imageID = None

        question.questionText = question_text
        question.type = question_type

        new_ans_list = data.getlist("new_answers")
        answers = Answer.query.filter_by(questionID=question_id).all()
        old_ans_list = [ans.termID for ans in answers]
        dif_list = list(set(old_ans_list) ^ set(new_ans_list))

        for ans in dif_list:
            if ans in old_ans_list:
                Answer.query.filter_by(questionID=question_id, termID=ans).delete()
            else:
                answer = Answer(questionID=question_id, termID=ans)
                db.session.add(answer)

        term_obj_list = data.getlist("arr_of_terms")

        for term_obj in term_obj_list:
            term_obj = json.loads(term_obj)
            for term in term_obj:
                term = Term(
                    front=term["front"], back=term["back"], language=term["language"]
                )
                db.session.add(term)
                db.session.commit()
                termID = term.termID
                answer = Answer(questionID=question_id, termID=termID)
                db.session.add(answer)
                db.session.commit()

                for t in term["tags"]:
                    tag_exists = Tag.query.filter_by(
                        termID=termID, tagName=str(t).lower()
                    ).first()
                    if not tag_exists:
                        tag = Tag(termID=termID, tagName=str(t).lower())
                        db.session.add(tag)
                        db.session.commit()

        db.session.commit()

        return make_response(
            jsonify(
                {
                    "message": "Successfully modified the question",
                    "questionID": question_id,
                }
            ),
            201,
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@question_bp.get("/searchbytype")
@token_required
def search_type(current_user):
    data = request.get_json()
    question_type = data["type"]
    language = data["language"]

    try:
        if question_type:
            questions = (
                Question.query.join(Answer, Answer.questionID == Question.questionID)
                .join(Term, Term.termID == Answer.termID)
                .filter(Question.type == question_type, Term.language == language)
                .all()
            )
        else:
            questions = (
                Question.query.join(Answer, Answer.questionID == Question.questionID)
                .join(Term, Term.termID == Answer.termID)
                .filter(Term.language == language)
                .all()
            )

        final_question_object = []
        for question in questions:
            new_question_object = {}
            new_question_object["questionID"] = question.questionID
            new_question_object["audioID"] = question.audioID
            new_question_object["imageID"] = question.imageID
            new_question_object["type"] = question.type
            new_question_object["questionText"] = question.questionText

            if new_question_object["imageID"]:
                image = Image.query.filter_by(
                    imageID=new_question_object["imageID"]
                ).first()
                new_question_object["imageLocation"] = image.imageLocation

            if new_question_object["audioID"]:
                audio = Audio.query.filter_by(
                    audioID=new_question_object["audioID"]
                ).first()
                new_question_object["audioLocation"] = audio.audioLocation

            answers = Answer.query.filter_by(questionID=question.questionID).all()
            new_question_object["answers"] = [ans.termID for ans in answers]
            final_question_object.append(new_question_object)

        return make_response(jsonify(final_question_object), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@question_bp.get("/searchbytext")
@token_required
def search_text(current_user):
    data = request.get_json()
    question_text = data["questionText"]
    language = data["language"]

    try:
        questions = (
            Question.query.join(Answer, Answer.questionID == Question.questionID)
            .join(Term, Term.termID == Answer.termID)
            .filter(Question.questionText == question_text, Term.language == language)
            .all()
        )
        final_question_object = []

        for question in questions:
            new_question_object = {}
            new_question_object["questionID"] = question.questionID
            new_question_object["audioID"] = question.audioID
            new_question_object["imageID"] = question.imageID
            new_question_object["type"] = question.type
            new_question_object["questionText"] = question.questionText

            if new_question_object["imageID"]:
                image = Image.query.filter_by(
                    imageID=new_question_object["imageID"]
                ).first()
                new_question_object["imageLocation"] = image.imageLocation

            if new_question_object["audioID"]:
                audio = Audio.query.filter_by(
                    audioID=new_question_object["audioID"]
                ).first()
                new_question_object["audioLocation"] = audio.audioLocation

            answers = Answer.query.filter_by(questionID=question.questionID).all()
            new_question_object["answers"] = [ans.termID for ans in answers]
            final_question_object.append(new_question_object)

        return make_response(jsonify(final_question_object), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@question_bp.delete("/deletequestion")
@token_required
def delete_question(current_user):
    data = request.get_json()
    question_id = data["questionID"]
    group_id = data["groupID"]

    if current_user.permissionGroup == "st" and not current_user.is_ta(group_id):
        return make_response(
            jsonify({"error": "User not authorized to delete questions."}), 400
        )

    try:
        question = Question.query.filter_by(questionID=question_id).first()
        deleted_question = DeletedQuestion(
            questionID=question.questionID,
            audioID=question.audioID,
            imageID=question.imageID,
            type=question.type,
            questionText=question.questionText,
        )
        db.session.add(deleted_question)

        la = LoggedAnswer.query.filter_by(questionID=question.questionID).all()

        for log in la:
            log.questionID = None
            log.deleted_questionID = question.questionID

        question.delete()
        db.session.commit()
        return make_response(
            jsonify({"message": "Successfully deleted question and answer set!"}), 201
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@question_bp.post("/question")
@token_required
def add_question(current_user):
    data = request.get_json()
    question_text = data["questionText"]
    question_type = data["type"]
    module_id = data["moduleID"]
    group_id = data["groupID"]
    image_id = None
    audio_id = None

    if current_user.permissionGroup == "st" and not current_user.is_ta(group_id):
        return make_response(
            jsonify({"error": "User not authorized to add questions."}), 400
        )

    try:
        if "image" in request.files:
            dateTime = time.strftime("%d%m%y%H%M%S")
            file = request.files["image"]
            filename, extension = os.path.splitext(file.filename)
            filename = secure_filename(filename) + str(dateTime)
            full_file_name = str(filename) + str(extension)

            if extension[1:] in IMAGE_EXTENSIONS:
                file.save(str(Path(TEMP_UPLOAD_FOLDER + full_file_name).absolute()))

                image = Image(imageLocation=full_file_name)
                db.session.add(image)

                os.rename(str(Path(TEMP_UPLOAD_FOLDER + full_file_name).absolute()))

                image = Image.query.filter_by(imageLocation=full_file_name).first()
                data["imageID"] = image.imageID
            else:
                return make_response(
                    jsonify(
                        {
                            "error": "File format of "
                            + filename
                            + extension
                            + " is not supported. \
                        Please upload an image format of jpeg, jpg, or png format."
                        }
                    ),
                    415,
                )

        if "audio" in request.files:
            dateTime = time.strftime("%d%m%y%H%M%S")
            file = request.files["audio"]
            filename, extension = os.path.splitext(file.filename)
            filename = secure_filename(filename) + str(dateTime)
            full_file_name = str(filename) + str(extension)

            if extension[1:] in AUDIO_EXTENSIONS:
                file.save(str(Path(TEMP_UPLOAD_FOLDER + full_file_name).absolute()))

                audio = Audio(audioLocation=full_file_name)
                db.session.add(audio)

                os.rename(str(Path(TEMP_UPLOAD_FOLDER + full_file_name).absolute()))

                audio = Audio.query.filter_by(audioLocation=full_file_name).first()
                data["audioID"] = audio.audioID
            else:
                return make_response(
                    jsonify(
                        {
                            "error": "File format of "
                            + filename
                            + extension
                            + " is not supported. \
                        Please upload an audio of format of wav, ogg, or mp3"
                        }
                    ),
                    415,
                )

        question = Question(
            audioID=data["audioID"],
            imageID=data["imageID"],
            type=question_type,
            questionText=question_text,
        )
        db.session.add(question)
        db.session.commit()
        question_id = question.questionID

        if module_id:
            module_question = ModuleQuestion(moduleID=module_id, questionID=question_id)
            db.session.add(module_question)
            db.session.commit()

        ans_list = data["answers"]
        for ans in ans_list:
            answer = Answer(questionID=question_id, termID=ans)
            db.session.add(answer)
            db.session.commit()

        term_obj_list = data["arr_of_terms"]
        for term_obj in term_obj_list:
            term = Term(
                front=term_obj["front"],
                back=term_obj["back"],
                language=term_obj["language"],
            )
            db.session.add(term)
            db.session.commit()
            termID = term.termID
            answer = Answer(questionID=question_id, termID=termID)
            db.session.add(answer)
            db.session.commit()

            for t in term_obj["tags"]:
                tag = Tag(termID=termID, tagName=str(t).lower())
                db.session.add(tag)
                db.session.commit()

        return make_response(
            jsonify(
                {
                    "message": "Successfully created a question",
                    "questionID": question_id,
                }
            ),
            201,
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@question_bp.get("/question")
@token_required
def get_question(current_user):
    data = request.get_json()
    question_id = data["questionID"]

    try:
        question = Question.query.filter_by(questionID=question_id).first()
        new_question_object = {}
        new_question_object["questionID"] = question.questionID
        new_question_object["audioID"] = question.audioID
        new_question_object["imageID"] = question.imageID
        new_question_object["type"] = question.type
        new_question_object["questionText"] = question.questionText

        if new_question_object["imageID"]:
            image = Image.query.filter_by(
                imageID=new_question_object["imageID"]
            ).first()
            new_question_object["imageLocation"] = image.imageLocation

        if new_question_object["audioID"]:
            audio = Audio.query.filter_by(
                audioID=new_question_object["audioID"]
            ).first()
            new_question_object["audioLocation"] = audio.audioLocation

        answers = Answer.query.filter_by(questionID=question_id).all()
        new_question_object["answers"] = [ans.termID for ans in answers]

        return make_response(jsonify(new_question_object), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)
