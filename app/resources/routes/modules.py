from flask import Blueprint, jsonify, make_response, request
from app.resources.models.Group import Group
from app.db import db
from app.resources.models.GroupUser import GroupUser
from app.resources.models.Session import Session
from app.resources.models.User import User
from app.resources.models.Module import DeletedModule, Module
from app.resources.models.Module import GroupModule
from app.resources.models.Question import Question
from app.resources.models.ModuleQuestion import ModuleQuestion
from app.resources.models.Term import Term
from app.resources.models.Answer import Answer
from app.resources.models.Tag import Tag
from utils import is_ta, token_required

modules_bp = Blueprint("modules", __name__)


@modules_bp.get("/modules")
@token_required
def get_modules(current_user):
    try:
        if current_user.permission == "su":
            modules = (
                Module.join(GroupModule, Module.moduleID == GroupModule.moduleID)
                .join(Group, GroupModule.groupID == Group.groupID)
                .all()
            )
        else:
            modules = (
                Module.join(GroupModule, Module.moduleID == GroupModule.moduleID)
                .join(GroupUser, GroupModule.groupID == GroupUser.groupID)
                .filter(GroupUser.userID == current_user.userID)
                .all()
            )

        return make_response(jsonify([module.serialize() for module in modules]), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.get("/retrievegroupmodules")
@token_required
def getModule(current_user):
    data = request.form
    group_id = data["groupID"]
    try:
        modules = (
            Module.join(GroupModule, Module.moduleID == GroupModule.moduleID)
            .filter(GroupModule.groupID == group_id)
            .all()
        )
        return make_response(jsonify([module.serialize() for module in modules]), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.get("/searchmodules")
@token_required
def get_module_by_language(current_user):
    data = request.form
    language = data["language"]
    if not language:
        return make_response(jsonify({"message": "Please provide a language"}), 400)
    try:
        modules = (
            Module.join(GroupModule, Module.moduleID == GroupModule.moduleID)
            .filter(Module.language == language)
            .all()
        )
        return make_response(jsonify([module.serialize() for module in modules]), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.get("/retrieveusermodules")
@token_required
def retrieve_user_modules(current_user):
    data = request.form
    group_id = data["groupID"]
    try:
        if current_user.permission == "su":
            modules = (
                Module.join(GroupModule, Module.moduleID == GroupModule.moduleID)
                .join(Group, GroupModule.groupID == Group.groupID)
                .group_by(Module.moduleID)
                .all()
            )
        else:
            modules = (
                Module.join(GroupModule, Module.moduleID == GroupModule.moduleID)
                .join(GroupUser, GroupModule.groupID == GroupUser.groupID)
                .filter(GroupUser.userID == current_user.userID)
                .group_by(Module.moduleID)
                .all()
            )

        if current_user.permission == "st" and not is_ta(current_user.userID, group_id):
            return make_response(
                jsonify([module.serialize() for module in modules]), 200
            )

        TA_list = []
        if current_user.permission == "pf":
            TA_list = (
                User.join(GroupUser, User.userID == GroupUser.userID)
                .filter(GroupUser.groupID == group_id, GroupUser.accessLevel == "ta")
                .all()
            )

        if is_ta(current_user.userID, group_id):
            for module in modules:
                module.owned = True if module.userID == current_user.userID else False
        else:
            for module in modules:
                module.owned = (
                    True
                    if module.userID == current_user.userID
                    or module.userID in TA_list
                    or current_user.permission == "su"
                    else False
                )

        return make_response(jsonify([module.serialize() for module in modules]), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.get("/retrievemodules")
@token_required
def retrieve_all_modules(current_user):
    data = request.form
    group_id = data["groupID"]

    if not group_id:
        return make_response(jsonify({"message": "Please provide a groupID"}), 400)

    try:
        if current_user.permission == "st" and not is_ta(current_user.userID, group_id):
            return make_response(
                jsonify({"message": "User not authorized to do this"}), 401
            )

        modules = Module.join(User, Module.userID == User.userID).all()

        return make_response(jsonify([module.serialize() for module in modules]), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.post("/modulequestions")
@token_required
def module_questions(current_user):
    data = request.form
    module_id = data["moduleID"]
    if not module_id:
        return make_response(jsonify({"message": "Please provide a moduleID"}), 400)
    try:
        questions = (
            Question.join(
                ModuleQuestion, Question.questionID == ModuleQuestion.questionID
            )
            .filter(
                ModuleQuestion.moduleID == module_id,
                ModuleQuestion.questionID == Question.questionID,
            )
            .all()
        )

        for question in questions:
            question.answers = (
                Term.join(Answer, Term.termID == Answer.termID)
                .filter(Answer.questionID == question.questionID)
                .all()
            )

            tags = Tag.query.filter(Tag.termID == question.answers[0].termID).all()

            for answer in question.answers:
                answer.tags = tags

        return make_response(
            jsonify([question.serialize() for question in questions]), 200
        )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.get("/module")
@token_required
def get_module(current_user):
    data = request.form
    module_id = data["moduleID"]
    if not module_id:
        return make_response(jsonify({"message": "Please provide a moduleID"}), 400)
    try:
        module = (
            Module.join(GroupModule, Module.moduleID == GroupModule.moduleID)
            .join(GroupUser, GroupModule.groupID == GroupUser.groupID)
            .filter(
                GroupUser.userID == current_user.userID, Module.moduleID == module_id
            )
            .first()
        )
        return make_response(jsonify(module.serialize()), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.post("/module")
@token_required
def create_module(current_user):
    data = request.form
    group_id = data["groupID"]
    if not group_id and current_user.permission != "su":
        return make_response(jsonify({"message": "Please provide a groupID"}), 400)

    if current_user.permission == "st" and not is_ta(current_user.userID, group_id):
        return make_response(
            jsonify({"message": "User not authorized to do this"}), 401
        )

    try:
        module = Module(
            name=data["name"],
            language=data["language"] or "",
            complexity=data["complexity"] or 2,
            userID=current_user.userID,
        )
        db.session.add(module)
        db.session.commit()

        group_module = GroupModule(moduleID=module.moduleID, groupID=group_id)
        db.session.add(group_module)
        db.session.commit()

        return make_response(jsonify({"moduleID": module.moduleID}), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.put("/module")
@token_required
def update_module(current_user):
    data = request.form
    group_id = data["groupID"]
    if not group_id:
        return make_response(jsonify({"message": "Please provide a groupID"}), 400)

    if current_user.permission == "st" and not is_ta(current_user.userID, group_id):
        return make_response(
            jsonify({"message": "User not authorized to do this"}), 401
        )

    try:
        module = Module.query.filter_by(moduleID=data["moduleID"]).first()
        module.name = data["name"] or module.name
        module.language = data["language"] or module.language
        module.complexity = data["complexity"] or module.complexity
        db.session.commit()

        return make_response(jsonify(module.serialize()), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.delete("/module")
@token_required
def delete_module(current_user):
    data = request.form
    group_id = data["groupID"]
    module_id = data["moduleID"]
    if not group_id:
        return make_response(jsonify({"message": "Please provide a groupID"}), 400)

    if not module_id:
        return make_response(jsonify({"message": "Please provide a moduleID"}), 400)

    if current_user.permission == "st" and not is_ta(current_user.userID, group_id):
        return make_response(
            jsonify({"message": "User not authorized to do this"}), 401
        )

    if current_user.permission == "pf":
        TA_list = (
            User.join(GroupUser, User.userID == GroupUser.userID)
            .filter(GroupUser.groupID == group_id, GroupUser.accessLevel == "ta")
            .all()
        )

    try:
        module = Module.query.filter_by(moduleID=module_id).first()

        if (
            current_user.permission == "pf"
            and module.userID not in TA_list
            and module.userID != current_user.userID
        ) or (current_user.permission == "ta" and module.userID != current_user.userID):
            return make_response(
                jsonify({"message": "User not authorized to do this"}), 401
            )

        deletedModule = DeletedModule(
            moduleID=module.moduleID,
            name=module.name,
            language=module.language,
            complexity=module.complexity,
            userID=module.userID,
        )
        db.session.add(deletedModule)

        sessions = Session.query.filter_by(moduleID=module.moduleID).all()

        for session in sessions:
            session.moduleID = None
            session.deletedModuleID = module.moduleID

        db.session.delete(module)
        db.session.commit()

        return make_response(jsonify({"message": "Successfully deleted module!"}), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.post("/attachquestion")
@token_required
def attach_question(current_user):
    data = request.form
    group_id = data["groupID"]
    module_id = data["moduleID"]
    question_id = data["questionID"]

    if not group_id:
        return make_response(jsonify({"message": "Please provide a groupID"}), 400)

    if not module_id:
        return make_response(jsonify({"message": "Please provide a moduleID"}), 400)

    if current_user.permission == "st" and not is_ta(current_user.userID, group_id):
        return make_response(
            jsonify({"message": "User not authorized to do this"}), 401
        )

    try:
        module_question_list = ModuleQuestion.query.filter_by(
            moduleID=module_id, questionID=question_id
        ).all()
        if not len(module_question_list) > 0:
            module_question = ModuleQuestion(moduleID=module_id, questionID=question_id)
            db.session.add(module_question)
            db.session.commit()
            attached = True
        else:
            module_question = ModuleQuestion.query.filter_by(
                moduleID=module_id, questionID=question_id
            ).first()
            db.session.delete(module_question)
            db.session.commit()
            attached = False

        if attached:
            return make_response(
                jsonify({"message": "Question has been linked to module."}), 201
            )
        else:
            return make_response(
                jsonify({"message": "Question has been unlinked from module."}), 200
            )

    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.post("/attachterm")
@token_required
def attach_term(current_user):
    data = request.form
    group_id = data["groupID"]
    module_id = data["moduleID"]
    term_id = data["termID"]

    if not group_id:
        return make_response(jsonify({"message": "Please provide a groupID"}), 400)

    if not module_id:
        return make_response(jsonify({"message": "Please provide a moduleID"}), 400)

    if current_user.permission == "st" and not is_ta(current_user.userID, group_id):
        return make_response(
            jsonify({"message": "User not authorized to do this"}), 401
        )

    try:
        question = (
            Question.join(Answer, Question.questionID == Answer.questionID)
            .filter(Answer.termID == term_id, Question.type == "MATCH")
            .all()
        )
        question_id = -1

        if not len(question) > 0:
            term = Term.query.filter_by(termID=term_id).first()
            question = Question(
                type="MATCH", questionText=f"What is the translation of {term.front}?"
            )
            db.session.add(question)
            db.session.commit()
            question_id = question.questionID

            answer = Answer(questionID=question.questionID, termID=term_id)
            db.session.add(answer)
            db.session.commit()

        if question_id == -1:
            question_id = question[0].questionID

        module_question_list = ModuleQuestion.query.filter_by(
            moduleID=module_id, questionID=question_id
        ).all()
        if not len(module_question_list) > 0:
            module_question = ModuleQuestion(moduleID=module_id, questionID=question_id)
            db.session.add(module_question)
            db.session.commit()
            attached = True
        else:
            module_question = ModuleQuestion.query.filter_by(
                moduleID=module_id, questionID=question_id
            ).first()
            db.session.delete(module_question)
            db.session.commit()
            attached = False

        if attached:
            return make_response(
                jsonify({"message": "Term has been linked to module."}), 201
            )
        else:
            return make_response(
                jsonify({"message": "Term has been unlinked from module."}), 200
            )

    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@modules_bp.post("/addmoduletogroup")
@token_required
def add_module_group(current_user):
    data = request.form
    module_id = data["moduleID"]
    group_id = data["groupID"]

    if not module_id:
        return make_response(jsonify({"message": "Please provide a moduleID"}), 400)

    if not group_id:
        return make_response(jsonify({"message": "Please provide a groupID"}), 400)

    if current_user.permission == "st" and not is_ta(current_user.userID, group_id):
        return make_response(
            jsonify({"message": "User not authorized to do this"}), 401
        )

    try:
        group_module = GroupModule.query.filter_by(
            moduleID=module_id, groupID=group_id
        ).all()
        if not len(group_module) > 0:
            group_module = GroupModule(moduleID=module_id, groupID=group_id)
            db.session.add(group_module)
            db.session.commit()
            return make_response(
                jsonify({"message": "Successfully added module to group"}), 200
            )
        else:
            db.session.delete(group_module[0])
            db.session.commit()
            return make_response(
                jsonify({"message": "Successfully unlinked them"}), 200
            )
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)
