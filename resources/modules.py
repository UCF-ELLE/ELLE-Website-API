# -*- encoding: utf-8 -*-

from flask import request, json
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required
from config import IMG_RETRIEVE_FOLDER, AUD_RETRIEVE_FOLDER
from exceptions_util import *
from db import mysql
from db_utils import *
from utils import *
import os.path


class Modules(Resource):
    """For acquiring all modules available for the current user based on the user's registered groups"""

    @jwt_required
    def get(self):
        """
        Return the list of modules that are available to the current student.

        This API should mainly be used by games to retrieve modules to play games with,
        Super-admins aren't associated with any modules, so they get back all the modules.
        """

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        if permission == 'su':
            query = """
                SELECT DISTINCT `module`.* FROM `module` 
                LEFT JOIN `group_module` ON `module`.`moduleID` = `group_module`.`moduleID` 
                LEFT JOIN `group_user` ON `group_module`.`groupID` = `group_user`.`groupID` 
                """
            result = getFromDB(query)
        else:
            query = """
                    SELECT DISTINCT `module`.* FROM `module` 
                    INNER JOIN `group_module` ON `module`.`moduleID` = `group_module`.`moduleID` 
                    INNER JOIN `group_user` ON `group_module`.`groupID` = `group_user`.`groupID` 
                    WHERE `group_user`.`userID`=%s
                    """
            result = getFromDB(query, user_id)

        modules = []
        for row in result:
            modules.append(convertModuleToJSON(row))

        # Return module information
        return modules


class RetrieveGroupModules(Resource):
    """Get all modules associated with the given groupID"""
    
    @jwt_required
    def get(self):
        """Get all modules associated with the given groupID"""
        
        # Get the user's ID and check permissions
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        group_id = getParameter('groupID', int, True, "Please pass in the groupID")
        if not group_id:
            return errorMessage("Please pass in a groupID"), 400

        query = """
                SELECT `module`.* FROM `module` INNER JOIN `group_module` 
                ON `group_module`.`moduleID` = `module`.`moduleID` 
                WHERE `group_module`.`groupID`=%s
                """
        records = getFromDB(query, group_id)
        modules = []
        for row in records:
            modules.append(convertModuleToJSON(row)) 
        
        # Return module information
        return modules


class SearchModules(Resource):
    """Retrieve modules that matches the given language parameter"""

    @jwt_required
    def get(self):
        """Retrieve modules that matches the given language parameter"""

        # Get the user's ID and check permissions
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        data = {}
        data['language'] = getParameter("language", str, True, "please provide two letter languge code")

        query = """
                SELECT `module`.*, `group_module`.`groupID` FROM `module` 
                INNER JOIN `group_module` ON `group_module`.`moduleID` = `module`.`moduleID` 
                WHERE `module`.`language`=%s
                """
        records = getFromDB(query, data['language'])
        modules = []
        for row in records:
            modules.append(convertModuleToJSON(row, 'groupID')) 
        
        # Return module information
        return modules, 200
        

class RetrieveUserModules(Resource):
    """Get all modules associated with the user"""

    @jwt_required
    def get(self):
        """
        Get all the modules associated with the user's groups, the modules they created,
        and whether they have permission to delete that module or not
        
        Design choice: TAs can only delete modules they created, Professors can delete modules
        they created or their TAs created, and superadmins can delete any module
        """

        # Get the user's ID and check permissions
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        group_id = getParameter('groupID', int, False, "Please pass in the groupID")

        #if a regular student user, return modules associated with their groups (similar to /modules)
        if permission == 'st' and not is_ta(user_id, group_id):
            query = """
                    SELECT `module`.*, GROUP_CONCAT(DISTINCT `group_module`.`groupID`) FROM `module` 
                    INNER JOIN `group_module` ON `module`.`moduleID` = `group_module`.`moduleID` 
                    INNER JOIN `group_user` ON `group_module`.`groupID` = `group_user`.`groupID` 
                    WHERE `group_user`.`userID`=%s
                    GROUP BY `module`.`moduleID`
                    """
            result = getFromDB(query, user_id)

            modules = []
            for row in result:
                modules.append(convertModuleToJSON(row, 'groupID'))

            # Return module information
            return modules

        if permission == 'su':
            query = """
                    SELECT DISTINCT `module`.*, GROUP_CONCAT(DISTINCT `group_module`.`groupID`) FROM `module` 
                    LEFT JOIN `group_module` ON `module`.`moduleID` = `group_module`.`moduleID` 
                    LEFT JOIN `group_user` ON `group_module`.`groupID` = `group_user`.`groupID`
                    GROUP BY `module`.`moduleID`
                    """
            result = getFromDB(query)
        else:
            query = """
                    SELECT DISTINCT `module`.*, GROUP_CONCAT(DISTINCT `group_module`.`groupID`) FROM `module` 
                    LEFT JOIN `group_module` ON `module`.`moduleID` = `group_module`.`moduleID` 
                    LEFT JOIN `group_user` ON `group_module`.`groupID` = `group_user`.`groupID` 
                    WHERE `group_user`.`userID`=%s OR `module`.`userID`=%s
                    GROUP BY `module`.`moduleID`
                    """
            result = getFromDB(query, (user_id, user_id))

        modules = []
        for row in result:
            json_module_obj = convertModuleToJSON(row, 'groupID')
            if json_module_obj and json_module_obj['groupID']:
                id_string = json_module_obj['groupID']
                groupID_list = []
                numbers = id_string.split(',')
                try:
                    for ID in numbers:
                        groupID_list.append(int(ID))
                except:
                    pass
                json_module_obj['groupID'] = groupID_list
            modules.append(json_module_obj)

        TA_list = []
        if permission == 'pf':
            TA_list = GetTAList(user_id)

        if is_ta(user_id, group_id):
            for module in modules:
                module['owned'] = True if module['userID'] == user_id else False
        else:
            for module in modules:
                module['owned'] = True if module['userID'] == user_id or module['userID'] in TA_list or permission == 'su' else False

        return modules, 200


class RetrieveAllModules(Resource):
    """Get all modules in the database"""

    @jwt_required
    def get(self):
        """
        Get all modules in the database
        
        Only SU, PF, and TAs can use this API.
        """

        # Get the user's ID and check permissions
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        group_id = getParameter('groupID', int, False, "Please pass in the groupID")

        if permission == 'st' and not is_ta(user_id, group_id):
            return errorMessage("Invalid permission level"), 401

        # Query to retrieve all modules
        query = f"SELECT `module`.*, `user`.`userName` FROM `module` INNER JOIN `user` ON `user`.`userID` = `module`.`userID`"
        result = getFromDB(query)
        
        # Attaching variable names to rows
        modules = []
        for row in result:
            modules.append(convertModuleToJSON(row, 'username')) 
        # Return module information
        return modules
        

class ModuleQuestions(Resource):
    """For acquiring the associated questions and answers with a module"""
    
    @jwt_required
    def post(self):
        """
        Get a list of question objects, which each contain a list of terms functioning as their answers
        """

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        module_id = getParameter('moduleID', int, True, "Please pass in the moduleID")
        # Error response if module id is not provided
        if not module_id:
            return {'message' : 'Please provide the id of a module.'}
        # Acquiring list of module questions
        query = '''
                SELECT `question`.* FROM `question`, `module_question`
                WHERE `module_question`.`moduleID` = %s
                AND `module_question`.`questionID` = `question`.`questionID`;
                '''
        result = getFromDB(query, module_id)
        # Attaching variable names to rows
        questions = []
        for row in result:
            question = {}
            question['questionID'] = row[0]
            question['audioLocation'] = getAudioLocation(row[1])
            question['imageLocation'] = getImageLocation(row[2])
            question['type'] = row[3]
            question['questionText'] = row[4]
            questions.append(question) 
        # Acquiring properties associated with each question
        for question in questions:
            question_id = question['questionID']
            # Acquiring answers
            query = '''
                    SELECT `term`.* FROM `term`, `answer`
                    WHERE `answer`.`questionID` = %s
                    AND `answer`.`termID` = `term`.`termID`;
                    '''
            result = getFromDB(query, question_id)
            question['answers'] = []
            get_tags = """SELECT `tag`.`tagName` FROM `tag` WHERE `tag`.`termID`= %s"""

            # Attaching variable names to terms
            for row in result:
                associated_tags = getFromDB(get_tags, row[0])
                term = {}
                term['termID'] = row[0]
                term['imageLocation'] = getImageLocation(row[1])
                term['audioLocation'] = getAudioLocation(row[2])
                term['front'] = row[3]
                term['back'] = row[4]
                term['type'] = row[5]
                term['gender'] = row[6]
                term['language'] = row[7]
                if associated_tags and associated_tags[0]:
                    term['tags'] = associated_tags[0]
                else:
                    term['tags'] = []
                question['answers'].append(term)
        return questions


# For getting individual modules		
class Module(Resource):
    """Dealing with creating, editing, deleting, and searching a module"""

    @jwt_required
    def get(self):
        """Getting an existing module"""

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        module_id = getParameter('moduleID', int, True, "Please pass in the moduleID")
        if not module_id:
            return {'message':'Please provide the id of a module'}, 400
        
        # Get all decks associated with the group
        query = '''
                SELECT `module`.*, `group_module`.`groupID` FROM `module` 
                INNER JOIN `group_module` ON `group_module`.`moduleID` = `module`.`moduleID` 
                INNER JOIN `group_user` ON `group_module`.`groupID` = `group_user`.`groupID` 
                WHERE `group_user`.`userID` = %s AND `module`.`moduleID`= %s
                '''
        result = getFromDB(query, (user_id, module_id))

        module = None

        if result and result[0]:
            # Attaching variable names to rows\
            module = convertModuleToJSON(result[0], 'groupID')
        
        # Return module information
        return module

    @jwt_required
    def post(self):
        """
        Creating a new module
        
        groupID doesn't need to be passed is superadmin is creating a new module
        and doesn't want to attach it to any groups
        """

        group_id = getParameter('groupID', int, False, "Please pass in the groupID")
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if not group_id and permission != 'su':
            return errorMessage('Please provide the id of a group'), 400

        if permission == 'st' and not is_ta(user_id, group_id):
            return errorMessage("User not authorized to do this"), 401
        
        # Parsing JSON
        parser = reqparse.RequestParser()
        parser.add_argument('name', type=str, required=True)
        parser.add_argument('language', type=str, required=True)
        parser.add_argument('complexity', type=int, required=False)
        data = parser.parse_args()
        name = data['name']
        if (data['language']):
            language = data['language']
        else:
            language = ''
        if (data['complexity']):
            complexity = data['complexity']
        else:
            complexity = 2

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            # Posting to database
            query = """
                    INSERT INTO module (name, language, complexity, userID)
                    VALUES (%s, %s, %s, %s);
                    """
            postToDB(query, (name, language, complexity, user_id))

            query = "SELECT MAX(moduleID) from module"
            moduleID = getFromDB(query) #ADD A CHECK TO SEE IF IT RETURNED SUCCESSFULLY

            if not moduleID or not moduleID[0]:
                raise CustomException("Error in creating a module", 500)

            if group_id:
                # Linking the newly created module to the group associated with the groupID            
                query = """INSERT INTO `group_module` (`moduleID`, `groupID`) 
                        VALUES (%s, %s)"""
                postToDB(query, (moduleID[0][0], group_id))

            raise ReturnSuccess({"moduleID" : moduleID[0][0]}, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()

    @jwt_required
    def put(self):
        """
        Editing a module

        All information needs to be passed in, no matter if they are new information or not
        groupID doesn't need to be passed if professor or superadmin is updating a module
        """

        parser = reqparse.RequestParser()
        parser.add_argument('moduleID', type=int, required=True)
        parser.add_argument('name', type=str, required=True)
        parser.add_argument('language', type=str, required=True)
        parser.add_argument('complexity', type=int, required=True)
        parser.add_argument('groupID', type=int, required=False)
        data = parser.parse_args()

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            permission, user_id = validate_permissions()
            if not permission or not user_id:
                return errorMessage("Invalid user"), 401
            
            if permission == 'st' and not is_ta(user_id, group_id):
                return errorMessage("User not authorized to do this"), 401

            module_id = data['moduleID']
            name = data['name']
            language = data['language']
            complexity = data['complexity']
            
            # Updating table
            query = """
                    UPDATE `module`
                    SET `name` = %s, `language` = %s, `complexity` = %s
                    WHERE `moduleID` = %s;
                    """
            postToDB(query, (name, language, complexity, module_id))

            query = "SELECT * FROM `module` WHERE `moduleID` = %s"
            results = getFromDB(query, data['moduleID'])
            if not results or not results[0]:
                raise CustomException("Non existant module", 400)

            moduleObj = convertModuleToJSON(results[0])

            raise ReturnSuccess(moduleObj, 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


    @jwt_required
    def delete(self):
        """
        Deleting an existing module, requires moduleID
        
        Only authorized users can do this: professors can delete their own modules or modules of their TAs' while superadmins can delete anything
        groupID only needs to be passed if the user is a TA for the group
        """

        group_id = getParameter('groupID', int, False, "Please pass in the groupID")
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        TA_list = []
        if permission == 'pf':
            TA_list = GetTAList(user_id)

        if permission == 'st' and not is_ta(user_id, group_id):
            return errorMessage('User not authorized to do this'), 401
        
        module_id = getParameter('moduleID', int, True, "Please pass in the moduleID")
        if not module_id:
            return errorMessage('Please provide the id of a module.'), 400
        
        query = "SELECT `module`.`userID` FROM `module` WHERE `module`.`moduleID` = %s"
        module_user_id = getFromDB(query, module_id)
        if not module_user_id or not module_user_id[0]:
            return errorMessage('Invalid module ID'), 400
        
        module_user_id = module_user_id[0][0]

        if (permission == 'pf' and module_user_id not in TA_list and module_user_id != user_id) or \
           (permission == 'ta' and module_user_id != user_id):
           return errorMessage('User not authorized to do this'), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # Get module's data
            module_query = "SELECT * FROM `module` WHERE `moduleID` = %s"
            module_data = getFromDB(module_query, module_id, conn, cursor)

            # Move to the deleted_module table
            delete_query = """INSERT INTO `deleted_module` (`moduleID`, `name`, `language`, `complexity`, `userID`) 
                           VALUES (%s, %s, %s, %s, %s)"""
            postToDB(delete_query, (module_data[0][0], module_data[0][1], module_data[0][2], module_data[0][3], module_data[0][4]), conn, cursor)

            # Get all sessions that were associated to the question
            s_query = "SELECT `sessionID` FROM `session` WHERE `moduleID` = %s"
            s_results = getFromDB(s_query, module_data[0][0], conn, cursor)

            # Update sessions
            for session in s_results:
                session_query = 'UPDATE `session` SET `moduleID` = NULL, `deleted_moduleID` = %s WHERE `sessionID` = %s'
                postToDB(session_query, (module_data[0][0], session[0]), conn, cursor)

            # Deleting module
            query = f"DELETE FROM `module` WHERE `moduleID` = {module_id}"
            postToDB(query, None, conn, cursor)

            raise ReturnSuccess('Successfully deleted module!', 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


class AttachQuestion(Resource):
    """For attaching and detaching questions from modules"""

    @jwt_required
    def post(self):
        # groupID only needs to be passed if the user is a TA for the group
        group_id = getParameter('groupID', int, False, "Please pass in the groupID")
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == 'st' and not is_ta(user_id, group_id):
            return errorMessage("User not authorized to do this"), 401
        
        # Parsing JSON
        module_id = getParameter("moduleID", int, True, "moduleID in integer format is required")
        question_id = getParameter("questionID", int, True)

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            # Attaching or detaching if already attached
            attached = attachQuestion(module_id, question_id, conn, cursor)
            # Response
            if attached:
                raise ReturnSuccess('Question has been linked to module.', 201)
            else:
                raise ReturnSuccess('Question has been unlinked from module.', 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


class AttachTerm(Resource):
    """For attaching and detaching terms from modules"""
    
    @jwt_required
    def post(self):
        """
        For attaching and detaching terms from modules.

        The term is converted into a MATCH type question, and that question is added to the module
        """
        # groupID only needs to be passed if the user is a TA for the group
        group_id = getParameter('groupID', int, False, "Please pass in the groupID")
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == 'st' and not is_ta(user_id, group_id):
            return errorMessage("User not authorized to do this"), 401

        data = {}
        module_id = getParameter("moduleID", int, True)
        term_id = getParameter("termID", int, True)

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            # Finding associated MATCH question with term
            query = '''
                    SELECT `question`.* FROM `question`, `answer`
                    WHERE `question`.`questionID` = `answer`.`questionID`
                    AND `answer`.`termID` = %s
                    AND `question`.`type` = "MATCH"
                    '''
            result = getFromDB(query, term_id)
            # If term or match question does not exist
            question_id = -1
            if not result or not result[0]:
                # Determining if term exists
                result = getFromDB("SELECT front FROM term WHERE termID = %s", term_id)
                if result and result[0]:
                    front = result[0]
                    # Creating a new MATCH question if missing (Only occurs for terms manually created through SQL)
                    postToDB(''' INSERT INTO question (`type`, `questionText`) VALUES ("MATCH", "What is the translation of %s?")''', front)
                    query = "SELECT MAX(questionID) FROM question"
                    id_result = getFromDB(query)
                    question_id = check_max_id(id_result) - 1
                    postToDB("INSERT INTO answer (`questionID`, `termID`) VALUES (%s, %s)", (question_id, term_id))
                else:
                    raise CustomException('Term does not exist or MATCH question has been deleted internally.', 400)
            # Getting question id if question already existed
            if question_id == -1:
                question_id = result[0][0]

            # Attaching or detaching if already attached
            attached = attachQuestion(module_id, question_id, conn, cursor)
            # Response
            if attached:
                 raise ReturnSuccess('Term has been linked to module.', 201)
            else:
                raise ReturnSuccess('Term has been unlinked from module.', 200)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


class AddModuleGroup(Resource):
    """For attaching and detaching modules from group(s)"""

    @jwt_required
    def post(self):
        data = {}
        data['moduleID'] = getParameter("moduleID", int, True)
        data['groupID'] = getParameter("groupID", int, True)

        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        group_id = data['groupID']
        if permission == 'st' and not is_ta(user_id, group_id):
            return errorMessage("User not authorized to do this"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = """
                    SELECT 1 FROM `group_module` WHERE moduleID = %s
                    AND groupID = %s
                    """
            exisistingRecord = getFromDB(query, (data['moduleID'], data['groupID']), conn, cursor)

            # They module is already in the group, so unlink them
            if exisistingRecord and exisistingRecord[0]:
                deleteQuery = """
                              DELETE from `group_module` WHERE moduleID = %s
                              AND groupID = %s
                              """
                postToDB(deleteQuery, (data['moduleID'], data['groupID']), conn, cursor)
                raise ReturnSuccess("Successfully unlinked them", 200)
            
            # They aren't already linked so link them
            else:
                insertQuery = """
                              INSERT INTO `group_module` (`moduleID`, `groupID`)
                              VALUES (%s, %s)	
                              """
                postToDB(insertQuery, (data['moduleID'], data['groupID']), conn, cursor)
                raise ReturnSuccess("Successfully added module to group", 200)
            
            raise CustomException("Something went wrong when trying to un/link the module to the group", 500)
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except ReturnSuccess as success:
            conn.commit()
            return success.msg, success.returnCode
        except Exception as error:
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()
