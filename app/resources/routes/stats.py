from datetime import datetime, timedelta, date
import time
from flask import Blueprint, jsonify, make_response, request
import redis
from sqlalchemy import text
from sqlalchemy.sql import functions
from app.resources.models.Group import Group
from app.db import db
from app.resources.models.GroupUser import GroupUser
from app.resources.models.User import User
from app.resources.models.Module import Module
from app.resources.models.Module import GroupModule
from app.resources.models.Term import Term
from app.resources.models.LoggedAnswer import LoggedAnswer
from app.resources.models.Session import Session
from utils import completeSessions, token_required
from app.config import GAME_PLATFORMS, REDIS_CHARSET, REDIS_HOST, REDIS_PORT


def get_averages(sessions):
    if len(sessions) == 0:
        return None

    score_total = 0
    time_total = 0
    logged_answer_count = 0
    for session in sessions:
        module = Module.query.get(session["moduleID"]).serialize()
        if not session["startTime"]:
            continue
        if not session["endTime"]:
            # Get logged answers where sessionID = session["sessionID"], order by logID, limit 1
            last_log_time = (
                LoggedAnswer.query.filter_by(sessionID=session["sessionID"])
                .order_by(LoggedAnswer.logID.desc())
                .first()
            )
            if last_log_time and last_log_time.log_time:
                if session["sessionDate"] != time.strftime("%Y-%m-%d"):
                    session["endTime"] = last_log_time.log_time
                    db.session.commit()
                    try:
                        redis_conn = redis.StrictRedis(
                            host=REDIS_HOST,
                            port=REDIS_PORT,
                            charset=REDIS_CHARSET,
                            decode_responses=True,
                        )
                        redis_conn.delete("sessions_csv")
                    except redis.exceptions.ConnectionError:
                        pass
            else:
                continue

        if not session["playerScore"]:
            correct_answers = sum(
                [
                    logged_answer.correct
                    for logged_answer in LoggedAnswer.query.filter_by(
                        sessionID=session["sessionID"]
                    ).all()
                ]
            )
            if session["sessionDate"] != time.strftime("%Y-%m-%d"):
                session["playerScore"] = correct_answers
                db.session.commit()
                try:
                    redis_conn = redis.StrictRedis(
                        host=REDIS_HOST,
                        port=REDIS_PORT,
                        charset=REDIS_CHARSET,
                        decode_responses=True,
                    )
                    redis_conn.delete("sessions_csv")
                except redis.exceptions.ConnectionError:
                    pass
                if correct_answers:
                    session["playerScore"] = correct_answers
        score_total += session["playerScore"] or 0
        logged_answer_count += len(
            LoggedAnswer.query.filter_by(sessionID=session["sessionID"]).all()
        )
        # time delta startTime
        start_delta = timedelta(
            hours=session["startTime"].hour,
            minutes=session["startTime"].minute,
            seconds=session["startTime"].second,
        )
        # time delta endTime
        end_delta = timedelta(
            hours=session["endTime"].hour,
            minutes=session["endTime"].minute,
            seconds=session["endTime"].second,
        )
        time_total += (end_delta - start_delta).seconds
    stat = {}
    stat["averageScore"] = (
        (score_total / logged_answer_count)
        if (score_total and logged_answer_count != 0.0)
        else 0.0
    )
    stat["averageSessionLength"] = str(timedelta(seconds=(time_total)))
    return stat


stats_bp = Blueprint("stats", __name__)


@stats_bp.get("/modulereport")
@token_required
def get_module_report(current_user):
    data = request.form
    module_id = data["moduleID"]
    include_su_stats = data["includeSuStats"]
    include_pf_stats = data["includePfStats"]

    permission_options = "`user`.`permissionGroup` = 'st'"
    if current_user.permissionGroup in ("su", "pf"):
        if include_su_stats:
            permission_options = (
                permission_options + " OR `user`.`permissionGroup` = 'su'"
            )
        if include_pf_stats:
            permission_options = (
                permission_options + " OR `user`.`permissionGroup` = 'pf'"
            )

    try:
        sessions = (
            Session.query.join(User.userID == Session.userID)
            .filter(Session.moduleID == module_id, permission_options)
            .all()
        )
        sessions = completeSessions(sessions)
        sessions = [session.serialize() for session in sessions]

        for session in sessions:
            logged_answers = LoggedAnswer.query.filter_by(
                sessionID=session["sessionID"]
            ).all()
            session["logged_answers"] = [
                logged_answer.serialize for logged_answer in logged_answers
            ]

        return make_response(jsonify(sessions), 200)
    except Exception as e:
        print(e)
        return make_response(jsonify({"message": "Server error"}), 500)


@stats_bp.get("/platformnames")
@token_required
def get_platform_names(current_user):
    return {"platforms": GAME_PLATFORMS}


@stats_bp.get("/modulestats")
@token_required
def get_module_stats(current_user):
    module_id = request.args.get("moduleID")
    include_su_stats = request.args.get("includeSuStats")
    include_pf_stats = request.args.get("includePfStats")

    permission_options = "`user`.`permissionGroup` = 'st'"
    if current_user.permissionGroup in ("su", "pf"):
        if include_su_stats:
            permission_options = (
                permission_options + " OR `user`.`permissionGroup` = 'su'"
            )
        if include_pf_stats:
            permission_options = (
                permission_options + " OR `user`.`permissionGroup` = 'pf'"
            )

    stats = []
    for platform in GAME_PLATFORMS:
        if current_user.permissionGroup not in ("su", "pf"):
            sessions = (
                Session.query.join(User.userID == Session.userID)
                .filter(
                    Session.moduleID == module_id,
                    Session.platform == platform,
                    User.userID == current_user.userID,
                    permission_options,
                )
                .all()
            )
        else:
            sessions = (
                Session.query.join(User.userID == Session.userID)
                .filter(
                    Session.moduleID == module_id,
                    Session.platform == platform,
                    permission_options,
                )
                .all()
            )
        sessions = completeSessions(sessions)
        sessions = [session.serialize for session in sessions]

        if not sessions:
            continue

        stat = get_averages(sessions)
        stat["platform"] = platform
        stats.append(stat)

    stats.sort(reverse=True, key=lambda s: s["averageScore"])
    return make_response(jsonify(stats), 200)


@stats_bp.get("/allmodulestats")
@token_required
def get_all_module_stats(current_user):
    include_su_stats = request.args.get("includeSuStats")
    include_pf_stats = request.args.get("includePfStats")

    if current_user.permissionGroup == "su":
        module_ids = [module.moduleID for module in Module.query.all()]
    else:
        module_ids = [
            group_module.serialize["moduleID"]
            for group_module in GroupModule.query.filter_by(
                groupID=current_user.groupID
            ).all()
        ]

    permission_options = text("`user`.`permissionGroup` = 'st'")
    if current_user.permissionGroup in ("su", "pf"):
        if include_su_stats:
            permission_options = permission_options + text(
                " OR `user`.`permissionGroup` = 'su'"
            )
        if include_pf_stats:
            permission_options = permission_options + text(
                " OR `user`.`permissionGroup` = 'pf'"
            )

    permission_options = text(f"({permission_options})")
    stats = []
    for module_id in module_ids:
        if current_user.permissionGroup not in ("su", "pf"):
            sessions = Session.query.join(User.userID == Session.userID).filter(
                Session.moduleID == module_id,
                User.userID == current_user.userID,
                permission_options,
            )
        else:
            sessions = (
                Session.query.filter(Session.moduleID == module_id)
                .join(User, User.userID == Session.userID)
                .filter(permission_options)
                .all()
            )
        sessions = completeSessions(sessions)
        db.session.commit()
        sessions = [session.serialize() for session in sessions]
        stat = get_averages(sessions)
        if not stat:
            continue
        stat["moduleID"] = module_id
        stat["name"] = Module.query.get(module_id).name
        stats.append(stat)

    stats.sort(reverse=True, key=lambda s: s["averageScore"])
    return make_response(jsonify(stats), 200)


@stats_bp.get("/platformstats")
@token_required
def get_platform_stats(current_user):
    include_su_stats = request.args.get("includeSuStats")
    include_pf_stats = request.args.get("includePfStats")

    permission_options = text("`user`.`permissionGroup` = 'st'")
    if current_user.permissionGroup in ("su", "pf"):
        if include_su_stats:
            permission_options = permission_options + text(
                " OR `user`.`permissionGroup` = 'su'"
            )
        if include_pf_stats:
            permission_options = permission_options + text(
                " OR `user`.`permissionGroup` = 'pf'"
            )

    permission_options = text(f"({permission_options})")

    if current_user.permissionGroup != "su" and current_user.permissionGroup != "pf":
        sessions = Session.filter(Session.userID == current_user.userID).all()
    else:
        sessions = (
            Session.query.join(User, User.userID == Session.userID)
            .filter(permission_options)
            .all()
        )

    frequency_objs = 0
    stats = {}
    for platform in GAME_PLATFORMS:
        time_spent = 0
        total_score = 0
        performance_objs = 0
        total_platform_objs = 0

        platform_sessions = [
            session for session in sessions if session.platform == platform
        ]
        if not platform_sessions:
            continue
        for session in platform_sessions:
            if not session.endTime:
                last_log_time = (
                    LoggedAnswer.query.filter_by(sessionID=session.sessionID)
                    .order_by(LoggedAnswer.logID.desc())
                    .first()
                )
                if last_log_time and last_log_time.log_time:
                    if session.sessionDate != datetime.datetime.now().strftime(
                        "%Y-%m-%d"
                    ):
                        session.endTime = last_log_time.log_time
                        db.session.commit()
                        try:
                            redis_conn = redis.StrictRedis(
                                host=REDIS_HOST,
                                port=REDIS_PORT,
                                charset=REDIS_CHARSET,
                                decode_responses=True,
                            )
                            redis_conn.delete("sessions_csv")
                        except redis.exceptions.ConnectionError:
                            pass
                else:
                    continue
            start_delta = timedelta(
                hours=session.startTime.hour,
                minutes=session.startTime.minute,
                seconds=session.startTime.second,
            )
            # time delta endTime
            end_delta = timedelta(
                hours=session.endTime.hour,
                minutes=session.endTime.minute,
                seconds=session.endTime.second,
            )
            time_spent += (end_delta - start_delta).seconds

            if not session.playerScore:
                correct_answers = (
                    db.session.query(functions.sum(LoggedAnswer.correct))
                    .filter(LoggedAnswer.sessionID == session.sessionID)
                    .scalar()
                )
                if correct_answers != None:
                    session.playerScore = correct_answers
                    db.session.commit()
                    try:
                        redis_conn = redis.StrictRedis(
                            host=REDIS_HOST,
                            port=REDIS_PORT,
                            charset=REDIS_CHARSET,
                            decode_responses=True,
                        )
                        redis_conn.delete("sessions_csv")
                    except redis.exceptions.ConnectionError:
                        pass
                else:
                    continue
            total_score = total_score + session.playerScore

            total_platform_objs = total_platform_objs + 1
            frequency_objs = frequency_objs + 1

        stats[platform] = {
            "frequency": total_platform_objs,
            "total_score": total_score,
            "time_spent": str(timedelta(seconds=time_spent)),
            "avg_score": (
                total_score / total_platform_objs if total_platform_objs != 0 else 0
            ),
            "avg_time_spent": str(
                timedelta(seconds=(time_spent / total_platform_objs))
                if total_platform_objs != 0
                else 0
            ),
            "total_records_avail": total_platform_objs,
        }

    for platform in GAME_PLATFORMS:
        if platform in stats:
            stats[platform]["frequency"] = (
                stats[platform]["frequency"] / frequency_objs
                if frequency_objs != 0
                else 0
            )
        else:
            stats[platform] = {
                "frequency": 0.0,
                "total_score": 0,
                "time_spent": "0:00:00",
                "avg_score": 0.00,
                "avg_time_spent": "0:00:00",
                "total_records_avail": 0,
            }
    return make_response(jsonify(stats), 200)


@stats_bp.get("/termsperformance")
@token_required
def get_terms_performance(current_user):
    data = request.form
    module_id = data["moduleID"]
    group_id = data["groupID"]
    include_own_stats = data["includeOwnStats"]
    user_id = data["userID"]
    include_su_stats = data["includeSuStats"]
    include_pf_stats = data["includePfStats"]

    permission_options = "`user`.`permissionGroup` = 'st'"
    if current_user.permissionGroup in ("su", "pf"):
        if include_su_stats:
            permission_options = (
                permission_options + " OR `user`.`permissionGroup` = 'su'"
            )
        if include_pf_stats:
            permission_options = (
                permission_options + " OR `user`.`permissionGroup` = 'pf'"
            )

    if current_user.permissionGroup != "su":
        associated_groups = GroupUser.query.filter_by(userID=current_user.userID).all()
        group_ids = [group_user.groupID for group_user in associated_groups]
    else:
        group_ids = Group.query.all()

    if not group_id:
        group_id_list = group_ids
    else:
        if current_user.permissionGroup != "su":
            is_in_group = GroupUser.query.filter_by(
                userID=current_user.userID, groupID=group_id
            ).first()
            if not is_in_group:
                return make_response(
                    jsonify({"message": "Not associated with that group"}), 400
                )
        group_id_list = [group_id]

    if not user_id:
        if current_user.permissionGroup == "su":
            group_user_ids = GroupUser.query.filter(
                GroupUser.groupID.in_(group_id_list)
            ).all()
        else:
            group_user_ids = GroupUser.query.filter(
                GroupUser.groupID.in_(group_id_list), User.userID != current_user.userID
            ).all()
        group_user_id_list = [group_user.userID for group_user in group_user_ids]
    else:
        if current_user.permissionGroup != "su":
            is_getting_su_stats = User.query.filter_by(
                userID=user_id, permissionGroup="su"
            ).first()
            if is_getting_su_stats:
                return make_response(jsonify({"message": "No records found"}), 200)
            else:
                group_user_id_list = [user_id]
        else:
            group_user_id_list = [user_id]

    if not module_id:
        if current_user.permissionGroup == "su":
            module_ids = [module.moduleID for module in Module.query.all()]
        else:
            module_ids = [
                group_module.moduleID
                for group_module in GroupModule.query.filter(
                    GroupModule.groupID.in_(group_id_list)
                ).all()
            ]
    else:
        module_ids = [module_id]

    loggedAnswers = (
        LoggedAnswer.query.join(Session.sessionID == LoggedAnswer.sessionID)
        .join(Module.moduleID == Session.moduleID)
        .filter(
            Session.moduleID.in_(module_ids), Session.userID.in_(group_user_id_list)
        )
        .all()
    )
    loggedAnswers = [loggedAnswer.serialize for loggedAnswer in loggedAnswers]

    termCorrectness = {}
    for loggedAnswer in loggedAnswers:
        term_id = loggedAnswer["termID"]
        if term_id in termCorrectness:
            termCorrectness[term_id]["count"] = termCorrectness[term_id]["count"] + 1
            termCorrectness[term_id]["correctness"] = (
                termCorrectness[term_id]["correctness"] + loggedAnswer["correct"]
            )
            if loggedAnswer["moduleID"] not in termCorrectness[term_id]["modules"]:
                termCorrectness[term_id]["modules"][loggedAnswer["moduleID"]] = (
                    loggedAnswer["name"]
                )
        else:
            termCorrectness[term_id] = {
                "correctness": loggedAnswer["correct"],
                "count": 1,
                "modules": {loggedAnswer["moduleID"]: loggedAnswer["name"]},
            }

    for term_id in termCorrectness:
        termCorrectness[term_id]["correctness"] = (
            termCorrectness[term_id]["correctness"] / termCorrectness[term_id]["count"]
        )
        term_info = Term.query.get(term_id)
        if not term_info:
            continue
        termCorrectness[term_id]["front"] = term_info.front
        termCorrectness[term_id]["back"] = term_info.back
        termCorrectness[term_id]["type"] = term_info.type
        termCorrectness[term_id]["gender"] = term_info.gender
        termCorrectness["language"] = term_info.language

    if termCorrectness:
        terms_stats = {
            k: v
            for k, v in sorted(
                termCorrectness.items(), key=lambda item: item[1]["correctness"]
            )
        }
        return make_response(jsonify(terms_stats), 200)
    else:
        return make_response(jsonify({"message": "No records found"}), 200)


@stats_bp.get("/languagestats")
@token_required
def get_language_stats(current_user):
    module_langs = Module.query.all()
    lang_count = {}
    total_counter = 0
    for module_lang in module_langs:
        lang_code = module_lang.language.lower()
        if lang_code not in lang_count:
            lang_count[lang_code] = 1
        else:
            lang_count[lang_code] = lang_count[lang_code] + 1
        total_counter = total_counter + 1

    lang_count = {
        key: val
        for key, val in sorted(
            lang_count.items(), key=lambda item: item[1], reverse=True
        )
    }
    return make_response(jsonify(lang_count), 200)
