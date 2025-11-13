import os
import sys
import shutil

parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, parent_dir)

import config

USER_VOICE_FOLDER = "/home/ebi/ELLE-Website-API/user_audio_files/"
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

def cleanup_expired_groups():
    print("[START] APScheduler started for monthly cleanup", flush=True)
    # get newly expired groups
    expired_groups = db.get("SELECT classID, professorID FROM `tito_class_status` WHERE titoStatus='active' AND titoExpirationDate <= CURDATE();")
    
    # Update groups' status and delete 'old' audio files
    # TODO: THIS IS A SLOW APPROACH, CAN BATCH UPDATE IN MYSQL
    #       Will have to split 
    for (class_id, professor_id) in expired_groups:
        print(f"[INFO] Archiving group {class_id} led by prof {professor_id}")
        
        # archive group passed expiration date
        db.post("UPDATE `tito_class_status` SET titoStatus='inactive' WHERE groupID = %s AND professorID = %s;", (class_id, professor_id))
        
        # associated tito_modules marked as inactive by triggers
        
        # get moduleIDs for folder cleanup (see: conversation.py on how audio files are stored)
        module_ids = db.get("SELECT moduleID FROM `tito_module` WHERE classID=%s AND status='inactive';", (class_id,))
        # Delete each tito_module folder as its expected for ALL contents within to be expired
        for (module_id,) in module_ids:
            module_path = os.path.join(USER_VOICE_FOLDER, str(class_id), str(module_id))
            
            if os.path.exists(module_path):
                print(f"[INFO] Deleting ALL contents from module folder: {module_path}")
                shutil.rmtree(module_path)
        
        # If class_id folder is empty, delete it too
        class_path = os.path.join(USER_VOICE_FOLDER, str(class_id))
        if os.path.exists(class_path) and not os.listdir(class_path):
            print(f"[INFO] Deleting empty class folder: {class_path}")
            os.rmdir(class_path)
    return

if __name__ == "__main__":
    cleanup_expired_groups()
