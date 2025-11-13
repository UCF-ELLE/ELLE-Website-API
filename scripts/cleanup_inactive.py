from db_utils import DBHelper
from db import mysql

import os
import shutil

USER_VOICE_FOLDER = "../user_audio_files/"

db = DBHelper(mysql)

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

