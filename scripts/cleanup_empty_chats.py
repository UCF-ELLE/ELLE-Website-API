import os
import sys

# Add parent directory to path so we can import config
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, parent_dir)

import config
import mysql.connector

def get_mysql_connection():
    return mysql.connector.connect(
        host=config.MYSQL_DATABASE_HOST,
        user=config.MYSQL_DATABASE_USER,
        password=config.MYSQL_DATABASE_PASSWORD,
        database=config.MYSQL_DATABASE_DB
    )

def cleanup_empty_chats():
    print("Connecting to database...")
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor()
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return

    # Count empty inactive sessions first
    count_query = '''
        SELECT COUNT(*)
        FROM `chatbot_sessions` cs
        WHERE cs.isActiveSession = 0
          AND NOT EXISTS (
              SELECT 1 
              FROM `messages` m 
              WHERE m.chatbotSID = cs.chatbotSID AND m.source = 'user'
          );
    '''
    
    # Delete query
    delete_query = '''
        DELETE FROM `chatbot_sessions`
        WHERE `isActiveSession` = 0
          AND NOT EXISTS (
              SELECT 1 
              FROM `messages` 
              WHERE `messages`.`chatbotSID` = `chatbot_sessions`.`chatbotSID` 
                AND `messages`.`source` = 'user'
          );
    '''

    try:
        # Run count
        cursor.execute(count_query)
        empty_count = cursor.fetchone()[0]
        print(f"Found {empty_count} inactive chatbot sessions with 0 user messages.")

        if empty_count > 0:
            print("Purging empty inactive chat sessions...")
            cursor.execute(delete_query)
            conn.commit()
            rows_deleted = cursor.rowcount
            print(f"Successfully deleted {rows_deleted} empty inactive sessions.")
        else:
            print("No empty inactive chatbot sessions to clean up.")

    except Exception as e:
        print(f"An error occurred during database cleanup: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()
        print("Database connection closed.")

if __name__ == "__main__":
    cleanup_empty_chats()
