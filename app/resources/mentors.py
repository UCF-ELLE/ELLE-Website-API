from flask import Blueprint, jsonify, make_response, request
from app.db import db
from app.resources.models.GroupUser import GroupUser
from app.resources.models.MentorPreferences import MentorPreferences
from app.resources.models.MentorQuestionFrequency import MentorQuestionFrequency
from app.resources.models.Question import Question, DeletedQuestion
from app.resources.models.MentorResponses import MentorResponses
from app.resources.models.MultipleChoiceAnswers import MultipleChoiceAnswers
from app.resources.models.ModuleQuestion import ModuleQuestion
from utils import token_required

MENTOR_QUESTION_TYPE_1 = "MENTOR_FR"
MENTOR_QUESTION_TYPE_2 = "MENTOR_MC"

mentors_bp = Blueprint("mentors", __name__)


@mentors_bp.post("/mentorpreference")
@token_required
def post_mentor_preference(current_user):
    data = request.form
    mentor_name = data["mentor_name"]
    try:

        if MentorPreferences.query.filter_by(userID=current_user.userID).first():
            mentor = MentorPreferences.query.filter_by(
                userID=current_user.userID
            ).first()
            mentor.mentorName = mentor_name
            db.session.commit()
            updated = True
        else:
            mentor = MentorPreferences(current_user.userID, mentor_name)
            db.session.add(mentor)
            db.session.commit()
            updated = False

        if updated:
            return make_response(
                jsonify({"message": "Mentor preference updated."}), 200
            )
        else:
            return make_response(
                jsonify({"message": "Mentor preference created."}), 201
            )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.get("/mentorpreference")
@token_required
def get_mentor_preference(current_user):
    try:
        mentor = MentorPreferences.query.filter_by(userID=current_user.userID).first()
        if not mentor:
            return make_response(
                jsonify({"message": "User does not have a mentor preference"}), 404
            )
        return make_response(jsonify(mentor.serialize()), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.post("/studentresponses")
@token_required
def post_student_responses(current_user):
    data = request.form
    response = data["response"]
    question_id = data["question_id"]
    session_id = data["session_id"]
    try:
        student_response = MentorResponses(question_id, session_id, response)
        db.session.add(student_response)
        db.session.commit()
        return make_response(
            jsonify(
                {"message": "Student response created for question %s." % question_id}
            ),
            201,
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.get("/studentresponses")
@token_required
def get_student_responses(current_user):
    data = request.form
    session_id = data["session_id"]
    try:
        student_responses = MentorResponses.query.filter_by(sessionID=session_id).all()
        if not student_responses:
            return make_response(
                jsonify(
                    {
                        "message": "No associated logged mentor responses found for that module and/or user"
                    }
                ),
                200,
            )
        return make_response(
            jsonify(
                [student_response.serialize() for student_response in student_responses]
            ),
            200,
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.post("/creatementorquestions")
@token_required
def post_create_mentor_questions(current_user):
    data = request.form
    type = data["type"]
    question_text = data["question_text"]
    moduleID = data["moduleID"]
    mc_options = data["mc_options"]
    try:

        if type == MENTOR_QUESTION_TYPE_1:
            mentor_question = Question(MENTOR_QUESTION_TYPE_1, question_text)
            db.session.add(mentor_question)
            frQuestionCreated = True
        else:
            mentor_question = Question(MENTOR_QUESTION_TYPE_2, question_text)
            db.session.add(mentor_question)
            for option in mc_options:
                mc_option = MultipleChoiceAnswers(mentor_question.questionID, option)
                db.session.add(mc_option)
            frQuestionCreated = False

        maxQuestionID = db.session.query(db.func.max(Question.questionID)).scalar()
        questionID = maxQuestionID - 1 or 1

        if moduleID:
            module_question = ModuleQuestion(moduleID, questionID)
            db.session.add(module_question)

        db.session.commit()

        if frQuestionCreated:
            return make_response(
                jsonify({"message": "Mentor Free Response Question Stored."}), 201
            )
        else:
            return make_response(
                jsonify({"message": "Mentor Multiple Choice Question Stored."}), 201
            )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.post("/getmentorquestions")
@token_required
def post_get_mentor_questions(current_user):
    data = request.form
    moduleID = data["moduleID"]
    try:
        if not moduleID or moduleID == "":
            module_exp = "REGEXP '.*'"
        else:
            moduleID = moduleID.split("'")
            moduleID = moduleID[0]
            module_exp = " = " + str(moduleID)

        # query = "SELECT * FROM `question` WHERE `questionID` IN (SELECT `questionID` FROM `module_question` WHERE `moduleID` " + module_exp + ")"
        # result = db.engine.execute(query)
        questions = (
            Question.query.join(
                ModuleQuestion, Question.questionID == ModuleQuestion.questionID
            )
            .filter(ModuleQuestion.moduleID == moduleID)
            .all()
        )
        mentorQuestions = []
        for question in questions:
            mentorQuestions.append(question.serialize())
        return make_response(jsonify(mentorQuestions), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.post("/modifymentorquestions")
@token_required
def post_modify_mentor_questions(current_user):
    data = request.form
    question_text = data["question_text"]
    question_id = data["question_id"]
    try:
        question = Question.query.filter_by(questionID=question_id).first()
        question.questionText = question_text
        db.session.commit()
        return make_response(jsonify({"message": "Question Updated."}), 201)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.delete("/deletementorquestion")
@token_required
def delete_mentor_question(current_user):
    data = request.form
    questionID = data["questionID"]
    try:

        groupAccessLevel = (
            GroupUser.query.filter_by(userID=current_user.userID).first().access_level
        )

        if current_user.permissionGroup == "st" and groupAccessLevel != "ta":
            return make_response(
                jsonify({"message": "User not authorized to delete questions."}), 400
            )

        question = Question.query.filter_by(questionID=questionID).first()

        if question:
            deleteQuestion = DeletedQuestion(
                question.audioID, question.imageID, question.type, question.questionText
            )
            db.session.add(deleteQuestion)

            responses = MentorResponses.query.filter_by(questionID=questionID).all()
            for response in responses:
                response.questionID = None
                response.deleted_questionID = questionID

            mc_choices = MultipleChoiceAnswers.query.filter_by(
                questionID=questionID
            ).all()
            for mc_choice in mc_choices:
                db.session.delete(mc_choice)

            db.session.delete(question)
            db.session.commit()
            return make_response(
                jsonify({"message": "Successfully deleted question and answer set!"}),
                201,
            )

        return make_response(
            jsonify({"message": "No question with that ID exists!"}), 404
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.post("/getmultiplechoiceoptions")
@token_required
def post_get_multiple_choice_options(current_user):
    data = request.form
    question_id = data["question_id"]
    try:
        mc_options = MultipleChoiceAnswers.query.filter_by(questionID=question_id).all()
        mc_options = [mc_option.serialize() for mc_option in mc_options]
        return make_response(jsonify(mc_options), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.post("/modifymultiplechoiceoption")
@token_required
def post_modify_multiple_choice_option(current_user):
    data = request.form
    updated_option = data["updated_option"]
    mc_id = data["mc_id"]
    try:
        mc_option = MultipleChoiceAnswers.query.filter_by(
            multipleChoiceID=mc_id
        ).first()
        mc_option.answerChoice = updated_option
        db.session.commit()
        return make_response(
            jsonify({"message": "Successfully updated multiple choice option"}), 201
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.post("/createmultiplechoiceoption")
@token_required
def post_create_multiple_choice_option(current_user):
    data = request.form
    option = data["option"]
    question_id = data["question_id"]
    try:
        mc_option = MultipleChoiceAnswers(question_id, option)
        db.session.add(mc_option)
        db.session.commit()
        return make_response(
            jsonify({"message": "Successfully created multiple choice option"}), 201
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.delete("/deletemultiplechoiceoption")
@token_required
def delete_multiple_choice_option(current_user):
    data = request.form
    multipleChoiceID = data["multipleChoiceID"]
    try:
        mc_option = MultipleChoiceAnswers.query.filter_by(
            multipleChoiceID=multipleChoiceID
        ).first()
        db.session.delete(mc_option)
        db.session.commit()
        return make_response(
            jsonify({"message": "Successfully deleted multiple choice option"}), 201
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.post("/creatementorquestionfrequency")
@token_required
def post_create_mentor_question_frequency(current_user):
    data = request.form
    numIncorrectCards = data["numIncorrectCards"]
    numCorrectCards = data["numCorrectCards"]
    time = data["time"]
    moduleID = data["module_id"]
    try:
        if MentorQuestionFrequency.query.filter_by(moduleID=moduleID).first():
            mentor = MentorQuestionFrequency.query.filter_by(moduleID=moduleID).first()
            mentor.numIncorrectCards = numIncorrectCards
            mentor.numCorrectCards = numCorrectCards
            mentor.time = time
            db.session.commit()
            updated = True
        else:
            mentor = MentorQuestionFrequency(
                numIncorrectCards, numCorrectCards, time, moduleID
            )
            db.session.add(mentor)
            db.session.commit()
            updated = False

        if updated:
            return make_response(
                jsonify({"message": "Frequency updated for the module"}), 201
            )
        else:
            return make_response(
                jsonify({"message": "Successfully created mentor question frequency"}),
                201,
            )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@mentors_bp.post("/getmentorquestionfrequency")
@token_required
def post_get_mentor_question_frequency(current_user):
    data = request.form
    moduleID = data["module_id"]
    try:
        mentors = MentorQuestionFrequency.query.filter_by(moduleID=moduleID).all()
        if not mentors:
            return make_response(
                jsonify(
                    {"message": "No mentor question frequency found for the module"}
                ),
                404,
            )

        mentors = [mentor.serialize() for mentor in mentors]
        return make_response(jsonify(mentors), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)
