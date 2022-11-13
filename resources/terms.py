# -*- encoding: utf-8 -*-

from flask import request
from config import (
    IMAGE_EXTENSIONS, AUDIO_EXTENSIONS, TEMP_DELETE_FOLDER,
    TEMP_UPLOAD_FOLDER, IMG_UPLOAD_FOLDER, AUD_UPLOAD_FOLDER,
    IMG_RETRIEVE_FOLDER, AUD_RETRIEVE_FOLDER
    )
from flask_restful import Resource, reqparse
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from flaskext.mysql import MySQL
from db import mysql
from db_utils import *
from utils import *
from datetime import date
from exceptions_util import *
import os
import time
import requests


class Term(Resource):
    """APIs that deal with adding, retrieving, and deleting a term"""

    @jwt_required
    def get(self):
        """
        Retrieve the list of terms that match the parameters.

        Searches through the term's front, back, type, and gender to get any elements that match the search_term, if provided.
        If search_term not provided, we retrieve all terms in that language.
        """

        data = {}
        data['search_term'] = getParameter("search_term", str, False, "Provided search keyword(s)")
        data['language'] = getParameter("language", str, True, "Specify the language")

        matching_terms = []
        language = data['language'].lower()
        #if there is no search term provided, return all the terms
        if 'search_term' not in data or not data['search_term']:
            query = """SELECT `term`.*, `image`.`imageLocation`, `audio`.`audioLocation` FROM `term` 
                    LEFT JOIN `image` ON `image`.`imageID` = `term`.`imageID` 
                    LEFT JOIN `audio` ON `audio`.`audioID` = `term`.`audioID` 
                    WHERE `language` = %s"""
            results = getFromDB(query, language)
            if results and results[0]:
                for term in results:
                    matching_terms.append(convertTermToJSON(term))
            return matching_terms

        #search through different fields in term table that [partially] matches the given search term
        search_string = str(data['search_term']).lower()
        query = """SELECT `term`.*, `image`.`imageLocation`, `audio`.`audioLocation` FROM `term` 
                LEFT JOIN `image` ON `image`.`imageID` = `term`.`imageID` 
                LEFT JOIN `audio` ON `audio`.`audioID` = `term`.`audioID` 
                WHERE `language` = %s and (`front` LIKE %s OR 
                `back` LIKE %s OR `type` LIKE %s OR `gender` LIKE %s)"""
        results = getFromDB(query, (language, search_string+"%", search_string+"%", search_string[:2], search_string[:1]))
        if results and results[0]:
            for term in results:
                matching_terms.append(convertTermToJSON(term))

        #searching through tags that [partially] matches the given search term
        query = """SELECT `term`.*, `image`.`imageLocation`, `audio`.`audioLocation` FROM `term` 
                LEFT JOIN `image` ON `image`.`imageID` = `term`.`imageID` 
                LEFT JOIN `audio` ON `audio`.`audioID` = `term`.`audioID` 
                INNER JOIN `tag` AS `ta` ON `term`.`termID` = `ta`.`termID` 
                WHERE `language` = %s and `ta`.`tagName` LIKE %s"""
        results = getFromDB(query, (language, search_string+"%"))
        if results and results[0]:
            for term in results:
                jsonObject = convertTermToJSON(term)
                if jsonObject not in matching_terms:
                    matching_terms.append(jsonObject)

        return matching_terms, 200


    @jwt_required
    def post(self):
        """
        Add a new term or update a new term.

        If termID is passed in, it is assumed that that term is being updated. 
        If termID is not passed in, it is assumed we are adding a new term.
        """

        parser = reqparse.RequestParser()
        parser.add_argument('tag',
                            required = False,
                            action = 'append',
                            help = "Unable to parse list of tags",
                            type = str)
        data = parser.parse_args()

        data['front'] = getParameter("front", str, True, "Front side of term required")
        data['back'] = getParameter("back", str, True, "Back side/Translation of term required")
        data['type'] = getParameter("type", str, False, "Error with type parameter")
        data['gender'] = getParameter("gender", str, False, "Error with gender parameter")
        data['language'] = getParameter("language", str, True, "Please pass in the language of the term")
        data['termID'] = getParameter("termID", int, False, "Pass in termID as an integer if updating a term")
        data['moduleID'] = getParameter("moduleID", int, False, "Pass the moduleID as integer to which this term should be added to")
        data['groupID'] = getParameter("groupID", int, False, "Pass the groupID as integer if the user is a TA")

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == 'st' and not is_ta(user_id, data['groupID']):
            return errorMessage("User not authorized to create terms"), 400

        # Create imageID and audioID fields to keep track of uploads
        data['imageID'] = None
        data['audioID'] = None
        if data['type']:
            data['type'] = data['type'][:2]

        if not data['termID']:
            data['termID'] = None

        if not data['gender']:
            data['gender'] = 'N'
        else:
            data['gender'] = data['gender'][:1]
 
        if not data['language']:
            data['language'] = None
        else:
            data['language'] = data['language'][:2].lower()
 
        if not data['tag']:
            data['tag'] = []

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            # If an image was provided to upload
            if 'image' in request.files:
                dateTime = time.strftime("%d%m%y%H%M%S")

                file = request.files['image']
                if not file:
                    raise CustomException("Image file not recieved properly", 500)

                filename, extension = os.path.splitext(file.filename)
                filename = secure_filename(filename) + str(dateTime)
                fullFileName = str(filename) + str(extension)

                #making sure the passed in image has an acceptable extension before moving forward
                if extension[1:] in IMAGE_EXTENSIONS:
                    #saving the image to a temporary folder
                    file.save(cross_plat_path(TEMP_UPLOAD_FOLDER + fullFileName))

                    query = """INSERT INTO `image` (`imageLocation`) VALUES (%s)"""
                    postToDB(query, fullFileName, conn, cursor)

                    #moving the image to the Images folder upon successfully creating a record
                    os.rename(cross_plat_path(TEMP_UPLOAD_FOLDER + fullFileName), cross_plat_path(IMG_UPLOAD_FOLDER + fullFileName))

                    #get the inserted image's imageID
                    query = """SELECT `imageID` FROM `image` WHERE `imageLocation` = %s"""
                    imageID = getFromDB(query, fullFileName, conn, cursor)
                    data['imageID'] = imageID[0][0]
                else:
                    raise CustomException("File format of " + filename + extension + " is not supported. \
                            Please upload an image format of jpeg, jpg, or png format.", 415)

            if 'audio' in request.files:
                dateTime = time.strftime("%d%m%y%H%M%S")

                file = request.files['audio']
                if not file:
                    raise CustomException("Audio file not recieved properly", 500)

                filename, extension = os.path.splitext(file.filename)
                filename = secure_filename(filename) + str(dateTime)
                fullFileName = str(filename) + str(extension)

                if extension[1:] in AUDIO_EXTENSIONS:
                    #saving the audio to a temporary folder
                    file.save(cross_plat_path(TEMP_UPLOAD_FOLDER + fullFileName))

                    query = """INSERT INTO `audio` (`audioLocation`) VALUES (%s)"""
                    postToDB(query, fullFileName, conn, cursor)

                    #moving the audio to the Audio folder upon successfully creating a record
                    os.rename(cross_plat_path(TEMP_UPLOAD_FOLDER + fullFileName), cross_plat_path(AUD_UPLOAD_FOLDER + fullFileName))

                    #get the inserted audio's audioID
                    query = """SELECT `audioID` FROM `audio` WHERE `audioLocation` = %s"""
                    audioID = getFromDB(query, fullFileName, conn, cursor)
                    data['audioID'] = audioID[0][0]
                else:
                    raise CustomException("File format of " + str(filename) + str(extension) + " is not supported. \
                            Please upload an audio of format of wav, ogg, or mp3", 415)

            # Updating an exsting term
            if data['termID']:
                query = """SELECT `front` FROM `term` WHERE `termID` = %s"""
                result = getFromDB(query, data['termID'], conn, cursor)
                if not result:
                    raise CustomException("Not an existing term to edit,\
                                        DEVELOPER: please don't pass in id if creating new term", 404)

                query = """UPDATE term SET front = %s, back = %s, type = %s, gender = %s, language = %s 
                        WHERE termID = %s"""
                postToDB(query, (data['front'], data['back'], data['type'], data['gender'], data['language'], str(data['termID'])), conn, cursor)

                #if they pass in an image or audio, we will replace the existing image or audio (if present) with the new ones
                query = "SELECT `imageID` FROM `term` WHERE `termID` = %s"
                result = getFromDB(query, data['termID'], conn, cursor)
                if data['imageID']:
                    if result and result[0][0]:
                        #If the term already has an image, delete the image and copy on server and replace it
                        query = "SELECT `imageLocation` FROM `image` WHERE `imageID` = %s"
                        imageLocation = getFromDB(query, result[0][0], conn, cursor)
                        if not imageLocation or not imageLocation[0][0]:
                            raise CustomException("something went wrong when trying to retrieve image location", 500)

                        imageFileName = imageLocation[0][0]
  
                        query = "DELETE FROM `image` WHERE `imageID` = %s"
                        deleteFromDB(query, result[0][0], conn, cursor)

                        #removing the existing image
                        os.remove(str(cross_plat_path(IMG_UPLOAD_FOLDER + str(imageFileName))))

                    query = """UPDATE `term` SET `imageID` = %s 
                            WHERE `termID` = %s"""
                    postToDB(query, (data['imageID'], data['termID']), conn, cursor)
                
                query = "SELECT `audioID` FROM `term` WHERE `termID` = %s"
                result = getFromDB(query, data['termID'], conn, cursor)
                if data['audioID']:
                    if result and result[0][0]:
                        #If the term already has an audio, delete the audio and copy on server and replace it
                        query = "SELECT `audioLocation` FROM `audio` WHERE `audioID` = %s"
                        audioLocation = getFromDB(query, result[0][0], conn, cursor)
                        if not audioLocation or not audioLocation[0][0]:
                            raise CustomException("something went wrong when trying to retrieve audio location", 500)
                        audioFileName = audioLocation[0][0]

                        query = "DELETE FROM `audio` WHERE `audioID` = %s"
                        deleteFromDB(query, result[0][0], conn, cursor)

                        #removing existing audio
                        os.remove(cross_plat_path(AUD_UPLOAD_FOLDER + str(audioFileName)))

                    query = "UPDATE `term` SET `audioID` = %s WHERE `termID` = %s"
                    postToDB(query, (data['audioID'], data['termID']), conn, cursor)

                #add new tags or remove tags if they were removed
                query = "SELECT `tagName` FROM `tag` WHERE `termID` = %s"
                attached_tags = getFromDB(query, data['termID'], conn, cursor)

                #There are no tags already attached with the term, so we add all the given ones
                if not attached_tags and data['tag'] and data['tag']:  #'is not None' redundant?
                    addNewTags(data['tag'], str(data['termID']), conn, cursor)

                #The user has removed existing tags without any replacements, so we delete them all
                elif not data['tag'] and attached_tags and attached_tags:
                    query = "DELETE FROM `tag` WHERE `termID` = %s"
                    deleteFromDB(query, data['termID'], conn, cursor)

                #The user is updating the existing tags, so we delete what was removed and add new tags
                elif data['tag'] and attached_tags:
                    existing_tags = []
                    for indiv_tag in attached_tags:
                        existing_tags.append(str(indiv_tag[0]))
                    different_tags = [i for i in existing_tags + data['tag'] if i not in existing_tags or i not in data['tag']]
                    if different_tags:
                        for indiv_tag in different_tags:
                            if indiv_tag in existing_tags and indiv_tag not in data['tag']:
                                #if the tag is not in the given list of tags, the user removed it so delete it
                                query = """DELETE FROM `tag` WHERE `termID` = %s 
                                        AND `tagName` = %s"""
                                deleteFromDB(query, (data['termID'], indiv_tag), conn, cursor)
                            elif indiv_tag in data['tag'] and indiv_tag not in existing_tags:
                                #if the tag is only in the given list, then the user added it, so we add it
                                addNewTags([indiv_tag], str(data['termID']), conn, cursor)
                raise ReturnSuccess("Term Modified: " + str(data['termID']), 201)
            else:
                query = "SELECT MAX(`termID`) FROM `term`"
                result = getFromDB(query, None, conn, cursor)

                query = """INSERT INTO `term` (`imageID`, `audioID`, `front`, `back`, `type`, `gender`, `language`)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)"""
                postToDB(query, (data['imageID'], data['audioID'], data['front'], data['back'], data['type'], data['gender'], data['language']), conn, cursor)
                
                maxID = cursor.lastrowid
                
                #Add the given list of tags
                if 'tag' in data and data['tag']:
                    addNewTags(data['tag'], maxID, conn, cursor)

                #create a default question
                typeQuestion = 'PHRASE' if data['type'] and (data['type'] == 'PH' or data['type'] == 'PHRASE') else 'MATCH'
                questionText = "Match: " + data['front'] + "?"
                questionQuery = """INSERT INTO `question` (`type`, `questionText`) 
                                VALUES (%s, %s)"""
                postToDB(questionQuery, (typeQuestion, questionText), conn, cursor)

                #get the added question's ID
                maxQuestionQuery = "SELECT MAX(`questionID`) FROM `question`"
                result = getFromDB(maxQuestionQuery, None, conn, cursor)
                questionMaxID = result[0][0] if result and result[0] else 1

                #link the term to the default question
                insertAnswerQuery = """INSERT INTO `answer` (`questionID`, `termID`) 
                                    VALUES (%s, %s)"""
                postToDB(insertAnswerQuery, (questionMaxID, maxID), conn, cursor)

                #link the question to the module
                insertModuleQuery = """INSERT INTO `module_question` (`moduleID`, `questionID`) 
                                    VALUES (%s, %s)"""
                postToDB(insertModuleQuery, (data['moduleID'], questionMaxID), conn, cursor)

                raise ReturnSuccess({"Message" : "Successfully created a term", "termID" : int(maxID)}, 201)
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
        Delete a term.

        Delete the term associated with the given termID.
        Note: Deleting a term will add it to the deleted table for record keeping purposes.
        """

        data = {}
        data['termID'] = getParameter("termID", str, True, "Term ID in integet is required for deletion")
        data['groupID'] = getParameter("groupID", str, False, "groupID (int) is required if student is TA")

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        if permission == 'st' and not is_ta(user_id, data['groupID']):
            return errorMessage("User not authorized to delete terms"), 400

        if not data['termID'] or data['termID'] == '':
            return errorMessage("Please pass in a valid term id"), 400

        try:
            conn = mysql.connect()
            cursor = conn.cursor()
            exists = check_if_term_exists(data['termID'])

            if not exists:
                raise CustomException("cannot delete non-existing term", 403)

            #get the imageID and audioID, if they exist, in order to delete them as well
            query = "SELECT `imageID`, `audioID` FROM `term` WHERE `termID` = %s"
            results = getFromDB(query, data['termID'], conn, cursor)
            imageLocation = [[]]
            audioLocation = [[]]
            if results and results[0]:
                imageID = results[0][0]
                audioID = results[0][1]
                if imageID:
                    query = "SELECT `imageLocation` FROM `image` WHERE `imageID` = %s"
                    imageLocation = getFromDB(query, imageID, conn, cursor)
                    os.rename(cross_plat_path(IMG_UPLOAD_FOLDER + str(imageLocation[0][0])), cross_plat_path(TEMP_DELETE_FOLDER + str(imageLocation[0][0])))
                    query = "DELETE FROM `image` WHERE `imageID` = %s"
                    deleteFromDB(query, imageID, conn, cursor)
                if audioID:
                    query = "SELECT `audioLocation` FROM `audio` WHERE `audioID` = %s"
                    audioLocation = getFromDB(query, audioID, conn, cursor)
                    os.rename(cross_plat_path(AUD_UPLOAD_FOLDER + str(audioLocation[0][0])), cross_plat_path(TEMP_DELETE_FOLDER + str(audioLocation[0][0])))
                    query = "DELETE FROM `audio` WHERE `audioID` = %s"
                    deleteFromDB(query, audioID, conn, cursor)

            deleteAnswersSuccess = Delete_Term_Associations(term_id=data['termID'], given_conn=conn, given_cursor=cursor)
            if deleteAnswersSuccess == 0:
                raise CustomException("Error when trying to delete associated answers", 500)

            # Get term's data
            term_query = "SELECT * FROM `term` WHERE `termID` = %s"
            term_data = getFromDB(term_query, data['termID'], conn, cursor)

            # Move to the deleted_term table
            delete_query = """INSERT INTO `deleted_term` (`termID`, `imageID`, `audioID`, `front`, `back`, `type`, `gender`, `LANGUAGE`) 
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
            postToDB(delete_query, (term_data[0][0], term_data[0][1], term_data[0][2], term_data[0][3], term_data[0][4], term_data[0][5], term_data[0][6], term_data[0][7]), conn, cursor)

            # Get all logged answers that were associated to the term
            la_query = "SELECT `logID` FROM `logged_answer` WHERE `termID` = %s"
            la_results = getFromDB(la_query, term_data[0][0], conn, cursor)

            # Update logged answers
            for log in la_results:
                log_query = """UPDATE `logged_answer` SET `termID` = %s, 
                            `deleted_termID` = %s WHERE `logID` = %s"""
                postToDB(log_query, (None, term_data[0][0], log[0]), conn, cursor)

            query = "DELETE FROM `term` WHERE `termID` = %s"
            deleteFromDB(query, data['termID'], conn, cursor)

            raise ReturnSuccess("Term " + str(data['termID']) + " successfully deleted", 202)
        except ReturnSuccess as success:
            #If database changes are successfully, permanently delete the media files
            if imageLocation and imageLocation[0]:
                os.remove(str(cross_plat_path(TEMP_DELETE_FOLDER + str(imageLocation[0][0]))))
            if audioLocation and audioLocation[0]:
                os.remove(str(cross_plat_path(TEMP_DELETE_FOLDER + str(audioLocation[0][0]))))
            conn.commit()
            return success.msg, success.returnCode
        except CustomException as error:
            conn.rollback()
            return error.msg, error.returnCode
        except Exception as error:
            #If an error occured while delete database records, move the media back to original location
            if imageLocation and imageLocation[0]:
                os.rename(cross_plat_path(TEMP_DELETE_FOLDER + str(imageLocation[0][0])), cross_plat_path(IMG_UPLOAD_FOLDER + str(imageLocation[0][0])))
            if audioLocation and audioLocation[0]:
                os.rename(cross_plat_path(TEMP_DELETE_FOLDER + str(audioLocation[0][0])), cross_plat_path(AUD_UPLOAD_FOLDER + str(audioLocation[0][0])))
            conn.rollback()
            return errorMessage(str(error)), 500
        finally:
            if(conn.open):
                cursor.close()
                conn.close()


class Tags(Resource):
    """API for dealing with tags"""

    @jwt_required
    def get(self):
        """
        Get all the tags in the database.
        """

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            query = "SELECT `tagName` FROM `tag`"
            tags_from_db = getFromDB(query, None, conn, cursor)
            tags = {"tags" : []}
            if tags_from_db and tags_from_db[0]:
                for tag in tags_from_db:
                    if tag[0].lower() not in tags['tags']:
                        tags['tags'].append(tag[0].lower())

            raise ReturnSuccess(tags, 200)
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


class Tag_Term(Resource):
    """API used to get terms associated with a tag"""

    @jwt_required
    def get(self):
        """Get terms associated with a specific tag"""

        tag_name = getParameter("tag_name", str, True, "Name of tag required to retrieve associated terms")
        
        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if not tag_name or tag_name == '':
                raise CustomException("Please provide a tag name", 406)

            query = """SELECT `term`.*, `image`.`imageLocation`, `audio`.`audioLocation` FROM `term` 
                    LEFT JOIN `image` ON `image`.`imageID` = `term`.`imageID` 
                    LEFT JOIN `audio` ON `audio`.`audioID` = `term`.`audioID` 
                    INNER JOIN `tag` ON `tag`.`termID` = `term`.`termID` 
                    WHERE `tag`.`tagName`=%s"""
            terms_from_db = getFromDB(query, tag_name.lower(), conn, cursor)
            matching_terms = []
            for term in terms_from_db:
                jsonObject = convertTermToJSON(term)
                if jsonObject not in matching_terms:
                    matching_terms.append(jsonObject)
            
            raise ReturnSuccess(matching_terms, 200)
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


class Specific_Term(Resource):
    """API to get a specific term given an ID"""

    @jwt_required
    def get(self):
        """Get a specific term given it's termID."""

        termID = getParameter("termID", int, True, "ID of the term whose tags need to be retrieved is required")

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401

        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if not termID or termID == '':
                raise CustomException("Please provide a termID", 406)

            query = """SELECT `term`.*, `image`.`imageLocation`, `audio`.`audioLocation` FROM `term` 
                    LEFT JOIN `image` ON `image`.`imageID` = `term`.`imageID` 
                    LEFT JOIN `audio` ON `audio`.`audioID` = `term`.`audioID` 
                    WHERE `term`.`termID` = %s"""
            term_from_db = getFromDB(query, termID, conn, cursor)

            term = []
            if term_from_db and term_from_db[0]:        
                raise ReturnSuccess(convertTermToJSON(term_from_db[0]), 200)
            else:
                raise CustomException("Term not found", 404)

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


class Tags_In_Term(Resource):
    """API to get all terms associated with a tag"""

    @jwt_required
    def get(self):
        """Get terms associated with a specific tag."""

        termID = getParameter("termID", int, True, "ID of the term whose tags need to be retrieved is required")

        # Validate the user
        permission, user_id = validate_permissions()
        if not permission or not user_id:
            return errorMessage("Invalid user"), 401
        
        try:
            conn = mysql.connect()
            cursor = conn.cursor()

            if not termID or termID == '':
                raise CustomException("Please provide a termID", 406)

            query = "SELECT `tagName` FROM `tag` WHERE `termID` = %s"
            tags_from_db = getFromDB(query, termID, conn, cursor)
            tags_list = []
            for tag in tags_from_db:
                if tag not in tags_list and tag[0]:
                    tags_list.append(tag[0])
            
            raise ReturnSuccess(tags_list, 200)
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


class TagCount(Resource):
    """API to get a count of how many terms are associated with a tag."""

    @jwt_required
    def get(self):
        """Get a list of all tags in the database and how many terms are associated with it"""

        get_all_tags_query = "SELECT * FROM `tag`"
        tags_list = getFromDB(get_all_tags_query)
        tag_count = {}

        for tag_record in tags_list:
            tag_name = tag_record[1].lower()
            if tag_name not in tag_count:
                tag_count[tag_name] = 1
            else:
                tag_count[tag_name] = tag_count[tag_name] + 1
            
        return tag_count


def Delete_Term_Associations(term_id, questionID=None, given_conn=None, given_cursor=None):
    """
    Checks how many Answer records are associated with this term and deletes those answer records

    Note: This function is called from delete method of Term.
    And before deleting, it checks if the answer record's questionID is associated with only the term being deleted
    If so, deletes the question as well
    """

    try:
        conn = mysql.connect() if given_conn == None else given_conn
        cursor = conn.cursor() if given_cursor == None else given_cursor

        deleteAnswerQuery = "DELETE FROM `answer` WHERE `questionID` = %s AND `termID` = %s"
        deleteQuestionQuery = "DELETE FROM `question` WHERE `questionID` = %s"
        getAssociatedQuestions = "SELECT * FROM `answer` WHERE `questionID` = %s"
        query = "SELECT * FROM `answer` WHERE `termID` = %s"
        answerRecords = getFromDB(query, term_id, conn, cursor)

        for answer in answerRecords:
            if answer:
                questionInAnswers = getFromDB(getAssociatedQuestions, str(answer[0]), conn, cursor)
                if questionInAnswers and questionInAnswers[0] and len(questionInAnswers) <= 1:
                    if questionInAnswers[0][1] != answer[1]:
                        raise CustomException("Something went wrong in the logic of deleting a term", 500)
                    deleteFromDB(deleteQuestionQuery, str(answer[0]))
                deleteFromDB(deleteAnswerQuery, (str(answer[0]), str(answer[1])), conn, cursor)
        
        raise ReturnSuccess("Successfully deleted associated answer records", 200)
    except CustomException as error:
        if given_conn == None:
            conn.rollback()
        return 0
    except ReturnSuccess as success:
        if given_conn == None:
            conn.commit()
        return 1
    except Exception as error:
        if given_conn == None:
            conn.rollback()
        return 0
    finally:
        if(given_conn == None and conn.open):
            cursor.close()
            conn.close()