# -*- encoding: utf-8 -*-

from flask import request, json
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import mysql
from db_utils import *
from utils import *
from datetime import datetime, timedelta
from config import REDIS_CHARSET, REDIS_HOST, REDIS_PORT
from config import GAME_PLATFORMS
import os.path
import datetime
import time
import redis


class ModuleReport(Resource):
    """Returns a list of sessions associated with the given module"""

    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        module_id = getParameter("moduleID", int, True, "Please pass in the moduleID")
        include_su_stats = getParameter(
            "includeSuStats",
            bool,
            False,
            "Include any value with this key to include SU stats",
        )
        include_pf_stats = getParameter(
            "includePfStats",
            bool,
            False,
            "Include any value with this key to include PF stats",
        )

        permission_options = "`user`.`permissionGroup` = 'st'"
        if permission == "su" or permission == "pf":
            if include_su_stats:
                permission_options = (
                    permission_options + " OR `user`.`permissionGroup` = 'su'"
                )
            if include_pf_stats:
                permission_options = (
                    permission_options + " OR `user`.`permissionGroup` = 'pf'"
                )

        # Getting all sessions associated with a module
        query = f"""SELECT * FROM `session`
                INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                WHERE `moduleID` = '{module_id}'
                AND {permission_options}
                """
        sessions = querySessionsToJSON(query)
        # Getting all logged_answers associated with each session
        for session in sessions:
            session_id = session["sessionID"]
            query = f"SELECT * FROM `logged_answer` WHERE `sessionID` = '{session_id}'"
            result = getFromDB(query)
            session["logged_answers"] = []
            for row in result:
                logged_answer = {}
                logged_answer["logID"] = row[0]
                logged_answer["questionID"] = row[1]
                logged_answer["termID"] = row[2]
                logged_answer["sessionID"] = row[3]
                logged_answer["correct"] = row[4]
                session["logged_answers"].append(logged_answer)

        return json.loads(json.dumps(sessions, default=ObjectToJSONString))


class PlatformNames(Resource):
    """Provides a list of all platform names currently used by sessions in the database"""

    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        return {"platforms": GAME_PLATFORMS}


class ModuleStats(Resource):
    """Provides the average score and session duration for the given module in every platform. Only includes student data by default"""

    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        module_id = getParameter("moduleID", int, True, "Please pass in the moduleID")
        include_su_stats = getParameter(
            "includeSuStats",
            bool,
            False,
            "Include any value with this key to include SU stats",
        )
        include_pf_stats = getParameter(
            "includePfStats",
            bool,
            False,
            "Include any value with this key to include PF stats",
        )

        permission_options = "`user`.`permissionGroup` = 'st'"
        if permission == "su" or permission == "pf":
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
            if permission != "su" and permission != "pf":
                query = f"""SELECT `session`.* FROM `session` 
                        INNER JOIN `user` ON `session`.`userID` = `user`.`userID` 
                        WHERE `session`.`moduleID` = {module_id} 
                        AND `session`.`platform` = '{platform}' 
                        AND `userID` = {user_id}
                        AND ({permission_options})"""
            else:
                query = f"""SELECT `session`.* FROM `session` 
                        INNER JOIN `user` ON `session`.`userID` = `user`.`userID` 
                        WHERE `session`.`moduleID` = {module_id} 
                        AND `session`.`platform` = '{platform}' 
                        AND ({permission_options})"""

            sessions = querySessionsToJSON(query)
            stat = getAverages(sessions)
            if not stat:
                continue
            stat["platform"] = platform
            stats.append(stat)

        stats.sort(reverse=True, key=lambda s: s["averageScore"])
        return json.loads(json.dumps(stats, default=ObjectToJSONString))


class AllModuleStats(Resource):
    """Provide the average score and session duration for the given module in every platform. Only includes student data by default"""

    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        include_su_stats = getParameter(
            "includeSuStats",
            bool,
            False,
            "Include any value with this key to include SU stats",
        )
        include_pf_stats = getParameter(
            "includePfStats",
            bool,
            False,
            "Include any value with this key to include PF stats",
        )

        if permission == "su":
            query = "SELECT DISTINCT `moduleID` FROM `module`"
        else:
            # PF and ST can only access modules related to their classes
            query = f"""
                    SELECT DISTINCT `group_module`.`moduleID` FROM `group_module`
                    INNER JOIN `group_user` ON `group_user`.`groupID` = group_module.groupID 
                    WHERE group_user.userID = {user_id}
                    """

        permission_options = "`user`.`permissionGroup` = 'st'"
        if permission == "su" or permission == "pf":
            if include_su_stats:
                permission_options = (
                    permission_options + " OR `user`.`permissionGroup` = 'su'"
                )
            if include_pf_stats:
                permission_options = (
                    permission_options + " OR `user`.`permissionGroup` = 'pf'"
                )

        moduleIDs = getFromDB(query)
        if permission != "su" and permission != "pf":
            query = """SELECT `session`.* FROM `session` 
                    INNER JOIN `user` ON `user`.`userID` = `session`.`userID` 
                    WHERE `moduleID` = %s 
                    AND `session`.`userID` = %s
                    AND `user`.`permissionGroup` = 'st'"""
        else:
            query = (
                """SELECT `session`.* FROM `session` 
                    INNER JOIN `user` ON `user`.`userID` = `session`.`userID` 
                    WHERE `moduleID` = %s 
                    AND ("""
                + permission_options
                + ")"
            )

        stats = []
        for moduleID in moduleIDs:
            if permission != "su" and permission != "pf":
                sessions = querySessionsToJSON(query, (moduleID, user_id))
            else:
                sessions = querySessionsToJSON(query, moduleID)
            stat = getAverages(sessions)
            if not stat:
                continue
            mn_query = f"SELECT `name` FROM `module` WHERE `moduleID` = {moduleID[0]}"
            module_name = getFromDB(mn_query)
            stat["moduleID"] = moduleID[0]
            stat["name"] = module_name[0][0]
            stats.append(stat)

        stats.sort(reverse=True, key=lambda s: s["averageScore"])
        return json.loads(json.dumps(stats, default=ObjectToJSONString))


class PlatformStats(Resource):
    """
    Returns some stats about each platform. Only includes student data by default

    Return Value:
    frequency - How often the platform is utilized compared to others (* 100 to get percentage) |
    total_score - Total score achieved in that platform |
    time_spent - Total time spent in that platform |
    avg_score - Average score in that platform (total_score / total_records_avail) |
    avg_time_spent - Average time spent in that platform |
    total_records_avail - Total number of valid records that were used to retrieve above stats
    """

    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        include_su_stats = getParameter(
            "includeSuStats",
            bool,
            False,
            "Include any value with this key to include SU stats",
        )
        include_pf_stats = getParameter(
            "includePfStats",
            bool,
            False,
            "Include any value with this key to include PF stats",
        )

        permission_options = "`user`.`permissionGroup` = 'st'"
        if permission == "su" or permission == "pf":
            if include_su_stats:
                permission_options = (
                    permission_options + " OR `user`.`permissionGroup` = 'su'"
                )
            if include_pf_stats:
                permission_options = (
                    permission_options + " OR `user`.`permissionGroup` = 'pf'"
                )

        if permission != "su" and permission != "pf":
            # if student, they can only retrieve platform stats for their own data
            retrieve_stats_query = """SELECT `session`.* FROM session WHERE `session`.`platform` = %s
                                   AND `session`.`userID` = """ + str(
                user_id
            )
        else:
            retrieve_stats_query = (
                """SELECT `session`.* FROM session 
                                      INNER JOIN `user` ON `user`.`userID` = `session`.`userID`
                                      WHERE `session`.`platform` = %s
                                      AND ("""
                + permission_options
                + """)
                                   """
            )
        frequency_objs = 0
        stats = {}
        for platform in GAME_PLATFORMS:
            time_spent = 0
            total_score = 0
            performance_objs = 0
            total_platform_objs = 0

            db_records = getFromDB(retrieve_stats_query, platform)
            if not db_records or not db_records:
                continue
            for record in db_records:
                if not record[6]:
                    log_time_query = f"SELECT `logged_answer`.`log_time` FROM `logged_answer` WHERE `sessionID`={record[0]} ORDER BY `logID` DESC LIMIT 1"
                    last_log_time = getFromDB(log_time_query)
                    if (
                        last_log_time
                        and last_log_time[0]
                        and last_log_time[0][0] != None
                    ):
                        record[6] = last_log_time[0][0]
                        if record[3] != time.strftime("%Y-%m-%d"):
                            query_update_time = f"UPDATE `session` SET `session`.`endTime` = '{last_log_time[0][0]}' WHERE `session`.`sessionID` = {record[0]}"
                            postToDB(query_update_time)

                            try:
                                # Since we changed the sessions data on db, invalidate Redis cache
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
                time_spent = time_spent + (record[6] - record[5]).seconds

                if not record[4]:
                    get_logged_answer_score = f"""
                                              SELECT SUM(`logged_answer`.`correct`) 
                                              FROM `logged_answer` 
                                              WHERE `logged_answer`.`sessionID` = {record[0]}
                                              """
                    answer_data = getFromDB(get_logged_answer_score)
                    if answer_data and answer_data[0] and answer_data[0][0] != None:
                        correct_answers = int(answer_data[0][0])
                        if record[3] != time.strftime("%Y-%m-%d"):
                            update_score_query = f"""
                                                UPDATE `session` SET `session`.`playerScore` = {correct_answers}
                                                WHERE `session`.`sessionID` = {record[0]}
                                                """
                            postToDB(update_score_query)
                            try:
                                # Since we changed the sessions data on db, invalidate Redis cache
                                redis_conn = redis.StrictRedis(
                                    host=REDIS_HOST,
                                    port=REDIS_PORT,
                                    charset=REDIS_CHARSET,
                                    decode_responses=True,
                                )
                                redis_conn.delete("sessions_csv")
                            except redis.exceptions.ConnectionError:
                                pass
                        record[4] = correct_answers
                    else:
                        continue
                total_score = total_score + record[4]

                total_platform_objs = total_platform_objs + 1
                frequency_objs = frequency_objs + 1

            stats[platform] = {
                "frequency": total_platform_objs,
                "total_score": total_score,
                "time_spent": str(datetime.timedelta(seconds=time_spent)),
                "avg_score": (
                    total_score / total_platform_objs if total_platform_objs != 0 else 0
                ),
                "avg_time_spent": str(
                    datetime.timedelta(
                        seconds=(
                            (time_spent / total_platform_objs)
                            if total_platform_objs != 0
                            else 0
                        )
                    )
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
        return stats


class TermsPerformance(Resource):
    """
    API to get stats regarding terms. By default only uses student stats

    If a super admin hits this endpoint, they can get any set of terms performance.
    If a professor makes a call to this endpoint, it returns stats for the modules linked to their classes. And for TAs and students, returns their own stats.
    Returns a JSON object who key is the termID and value is a JSON object containing information about that term, including what percentage of correctness.
    Also includes a list of related modules that the term was present in when calculating the stat.
    """

    @jwt_required
    def get(self):
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        data = {}
        data["moduleID"] = getParameter("moduleID", int, False, "Pass in the moduleID")
        data["groupID"] = getParameter("groupID", int, False, "Pass in the groupID")
        data["includeOwnStats"] = getParameter(
            "includeOwnStats",
            bool,
            False,
            "Pass in any value with this parameter to include user's own stats (for superadmins and professors)",
        )
        data["userID"] = getParameter("userID", int, False, "Pass in the userID")

        include_su_stats = getParameter(
            "includeSuStats",
            bool,
            False,
            "Include any value with this key to include SU stats",
        )
        include_pf_stats = getParameter(
            "includePfStats",
            bool,
            False,
            "Include any value with this key to include PF stats",
        )

        permission_options = "`user`.`permissionGroup` = 'st'"
        if permission == "su" or permission == "pf":
            if include_su_stats:
                permission_options = (
                    permission_options + " OR `user`.`permissionGroup` = 'su'"
                )
            if include_pf_stats:
                permission_options = (
                    permission_options + " OR `user`.`permissionGroup` = 'pf'"
                )

        if permission != "su":
            get_associated_groups = f"""
                                    SELECT DISTINCT `group_user`.`groupID` FROM `group_user` WHERE `userID` = {user_id}
                                    """
        else:
            get_associated_groups = f"""
                                     SELECT DISTINCT `group_user`.`groupID` FROM `group_user`
                                     """
        if not data["groupID"]:
            groupID_list = []
            groupID_from_db = getFromDB(get_associated_groups)
            for groupID in groupID_from_db:
                groupID_list.append(groupID[0])
            groupID_list = convertListToSQL(groupID_list)
        else:
            if permission != "su":
                # If PF or ST accessing this API, then they can only retrieve stats for groups they are associated with
                check_if_in_group = f"SELECT 1 FROM `group_user` WHERE `userID` = {user_id} AND `groupID` = {data['groupID']}"
                is_in_group = getFromDB(check_if_in_group)
                if not is_in_group or not is_in_group[0]:
                    return returnMessage("Not associated with that group"), 400
            groupID_list = "= " + str(data["groupID"])

        get_associated_group_users = f"""
                                    SELECT `group_user`.`userID` FROM `group_user` 
                                    INNER JOIN `user` ON `user`.`userID` = `group_user`.`userID` 
                                    WHERE `group_user`.`groupID` {groupID_list} 
                                    AND ({permission_options})
                                    """

        # If student user, they can only retrieve their own records
        if permission != "su" and permission != "pf":
            group_userID_list = "= " + str(user_id)

        # If professor or superadmin
        else:
            if data["userID"]:
                # PF and SU can access other students' records
                if permission != "su":
                    check_user_id_level = f"""SELECT 1 FROM `user` WHERE `userID` = {data['userID']} AND `permissionGroup` = 'su'"""
                    is_getting_su_stats = getFromDB(check_user_id_level)
                    if is_getting_su_stats and is_getting_su_stats[0]:
                        return returnMessage("No records found"), 200
                    else:
                        group_userID_list = "= " + str(data["userID"])
                else:
                    group_userID_list = "= " + str(data["userID"])
            else:
                group_userID_from_db = getFromDB(get_associated_group_users)
                group_userID_list = []
                for userID in group_userID_from_db:
                    # Since the current user is the professor/SU, ignore any of his/her/their data
                    if data["includeOwnStats"]:
                        group_userID_list.append(userID[0])
                    else:
                        if userID[0] != user_id:
                            group_userID_list.append(userID[0])
                group_userID_list = convertListToSQL(group_userID_list)

        get_associated_modules = f"""
                                  SELECT DISTINCT `group_module`.`moduleID` FROM `group_module`
                                  WHERE `group_module`.`groupID` {groupID_list}
                                  """

        if data["moduleID"]:
            moduleID_list = "= " + str(data["moduleID"])
        else:
            moduleID_list = []
            moduleID_from_db = getFromDB(get_associated_modules)
            for moduleID in moduleID_from_db:
                moduleID_list.append(moduleID[0])
            moduleID_list = convertListToSQL(moduleID_list)

        # # If want to include stats for deleted information
        # query = f"""
        #          SELECT logged_answer.*, module.moduleID, module.name, deleted_module.moduleID, deleted_module.name from logged_answer
        # 		 INNER JOIN session ON session.sessionID = logged_answer.sessionID
        #          LEFT JOIN module ON session.moduleID = module.moduleID
        #          LEFT JOIN deleted_module on session.moduleID = deleted_module.moduleID
        #          WHERE logged_answer.sessionID IN
        #          (SELECT sessionID from `session` WHERE moduleID {moduleID_list} AND userID {group_userID_list})
        #          """

        query = f"""
                 SELECT `logged_answer`.*, `module`.`moduleID`, `module`.`name` from `logged_answer`
				 INNER JOIN `session` ON `session`.`sessionID` = `logged_answer`.`sessionID`
                 INNER JOIN `module` ON `session`.`moduleID` = `module`.`moduleID`
                 WHERE `logged_answer`.`sessionID` IN 
                 (SELECT `sessionID` from `session` WHERE `moduleID` {moduleID_list} AND `userID` {group_userID_list})
                 """
        loggedAnswers = getFromDB(query)

        termCorrectness = {}
        for loggedAns in loggedAnswers:
            if loggedAns[0]:
                if loggedAns[2] in termCorrectness:
                    termCorrectness[loggedAns[2]]["count"] = (
                        termCorrectness[loggedAns[2]]["count"] + 1
                    )
                    termCorrectness[loggedAns[2]]["correctness"] = (
                        termCorrectness[loggedAns[2]]["correctness"] + loggedAns[4]
                    )
                    if loggedAns[9] not in termCorrectness[loggedAns[2]]["modules"]:
                        termCorrectness[loggedAns[2]]["modules"][loggedAns[9]] = (
                            loggedAns[10]
                        )
                else:
                    termCorrectness[loggedAns[2]] = {
                        "correctness": loggedAns[4],
                        "count": 1,
                        "modules": {loggedAns[9]: loggedAns[10]},
                    }

        for termID in termCorrectness:
            if not termID:
                continue
            termCorrectness[termID]["correctness"] = (
                termCorrectness[termID]["correctness"]
                / termCorrectness[termID]["count"]
            )
            get_term = f"""SELECT `term`.`termID`, `term`.`front`, `term`.`back`, `term`.`type`, `term`.`gender`, `term`.`language` 
                        FROM `term` WHERE `termID` = {termID}"""
            term_info = getFromDB(get_term)
            if not term_info and not term_info[0]:
                # # If want to include deleted terms information
                # get_term = f"SELECT * from deleted_term WHERE termID = {termID}"
                # term_info = getFromDB(get_term)
                # if not term_info and not term_info[0]:
                #     continue
                continue

            termCorrectness[termID]["front"] = term_info[0][1]
            termCorrectness[termID]["back"] = term_info[0][2]
            termCorrectness[termID]["type"] = term_info[0][3]
            termCorrectness[termID]["gender"] = term_info[0][4]
            termCorrectness[termID]["language"] = term_info[0][5]

        if termCorrectness:
            terms_stats = {
                k: v
                for k, v in sorted(
                    termCorrectness.items(), key=lambda item: item[1]["correctness"]
                )
            }
            return terms_stats, 200
        else:
            return returnMessage("No records found"), 200


# Provides a percentage of how many modules belong to a specific language (e.g. 0.6 modules are Spanish, 0.2 are English, and 0.2 are French)
class LanguageStats(Resource):
    """
    Get a percentage of how many modules belong to a specific language (e.g. 0.6 modules are Spanish, 0.2 are English, and 0.2 are French)

    The key is the language code while the value is percentage of how many modules belong to that language in decimal form
    """

    @jwt_required
    def get(self):
        get_module_lang_query = (
            "SELECT `module`.`moduleID`, `module`.`language` from `module`"
        )
        all_modules = getFromDB(get_module_lang_query)
        # A dictionary to hold language codes and how many times it has occured
        lang_count = {}
        total_counter = 0
        for module in all_modules:
            lang_code = module[1].lower()
            if lang_code not in lang_count:
                lang_count[lang_code] = 1
            else:
                lang_count[lang_code] = lang_count[lang_code] + 1
            total_counter = total_counter + 1

        for lang_code in lang_count:
            lang_count[lang_code] = lang_count[lang_code] / total_counter

        lang_count = {
            key: val
            for key, val in sorted(
                lang_count.items(), key=lambda item: item[1], reverse=True
            )
        }

        return lang_count, 200
