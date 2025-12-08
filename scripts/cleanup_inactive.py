import os
import sys
import shutil

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, parent_dir)

import config

# FIX THIS
USER_VOICE_FOLDER = "/home/elle/ELLE-2024-Website-API/user_audio_files/"
import mysql.connector

def get_mysql_connection():
    return mysql.connector.connect(
        host=config.MYSQL_DATABASE_HOST,
        user=config.MYSQL_DATABASE_USER,
        password=config.MYSQL_DATABASE_PASSWORD,
        database=config.MYSQL_DATABASE_DB
    )

class DBHelperStandalone:
    def __init__(self):
        self.conn = get_mysql_connection()
        
    def get(self, query, vals=None):
        cursor = self.conn.cursor()
        cursor.execute(query, vals or ())
        result = cursor.fetchall()
        cursor.close()
        return result
    
    def post(self, query, vals=None):
        cursor = self.conn.cursor()
        cursor.execute(query, vals or ())
        self.conn.commit()
        cursor.close()

db = DBHelperStandalone()

'''
    PURGE EXPIRED TITO_GROUP MODULES AND USER VOICE MESSAGES
'''

def delete_expired_voice_messages():
    # Step 1: Find expired voice messages
    query = '''
        SELECT tvm.userID, tvm.messageID, tvm.filename, m.classID, m.moduleID
        FROM tito_voice_message tvm
        JOIN messages m ON tvm.messageID = m.messageID
        WHERE tvm.audioExpireDate <= CURDATE() AND m.isVoiceMessage = 1;
    '''
    
    expired_messages = db.get(query)

    # Step 2: Iterate over each expired message
    for userID, messageID, filename, classID, moduleID in expired_messages:
        # Construct file path
        file_path = os.path.join(USER_VOICE_FOLDER, str(classID), str(moduleID), str(userID), str(filename))
        
        # Delete file if it exists
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"Deleted file: {file_path}")
                # Step 3: Update 'isVoiceMessage' to 0 for corresponding message in 'messages' table
                update_query = '''
                    UPDATE messages
                    SET isVoiceMessage = 0
                    WHERE messageID = %s;
                '''
                db.post(update_query, (messageID,))
                print(f"Updated messageID {messageID} to set isVoiceMessage = 0")
            except Exception as e:
                print(f"Error deleting file {file_path}: {e}")
        
if __name__ == "__main__":
    delete_expired_voice_messages()
