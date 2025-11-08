import os
from dotenv import load_dotenv

# Load environment variables from the .env file present
load_dotenv()

# API endpoint prefixes
API_ENDPOINT_PREFIX = "/elleapi/"

# Enable or disable TWT, DISABLE IF NOT USING IT. otherwise causes errors due to missing requirements
TWT_ENABLED = True

# Database configurations
MYSQL_DATABASE_USER = os.getenv("MYSQL_DATABASE_USER")
MYSQL_DATABASE_PASSWORD = os.getenv("MYSQL_DATABASE_PASSWORD")
MYSQL_DATABASE_DB = os.getenv("MYSQL_DATABASE_DB")
MYSQL_DATABASE_HOST = os.getenv("MYSQL_DATABASE_HOST")
SECRET_KEY = os.getenv("SECRET_KEY")

# Allowed image and audio extensions
IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "PNG", "JPEG", "JPG"]
AUDIO_EXTENSIONS = ["ogg", "wav", "mp3"]

# Path to folders - change accordingly
TEMP_UPLOAD_FOLDER = "temp_uploads/"
TEMP_DELETE_FOLDER = "deletes/"
IMG_UPLOAD_FOLDER = "images/"
AUD_UPLOAD_FOLDER = "audios/"
USER_VOICE_FOLDER = "user_audio_files/" # THIS IS FOR TWT ONLY
# That path to append to the URL so that the media is accessible publicly
# e.g. https://chdr.cs.ucf.edu/images/[FILE_NAME]
IMG_RETRIEVE_FOLDER = "/images/"
AUD_RETRIEVE_FOLDER = "/audios/"


# START: ConversAItionELLE-specific magic nums 
MAX_AUDIO_SIZE_BYTES = 3 * 1024 * 1024 # 3MB user voice files
MAX_AUDIO_LENGTH_SEC = 90
FREE_CHAT_MODULE = int(-1) # Magic `module` for Tito free-chat
REAL_FREE_CHAT_MODULE = int(228)
TWT_GLOBAL_CLASS_ID = 74 # the class that contains ALL modules
LANGUAGETOOL_API_URL = "http://127.0.0.1:8082/v2/check"
# END:

# List of user permission types
# Changing these values is not recommended
PERMISSION_GROUPS = ["su", "pf", "st"]  # Permission groups of individual users
ACCESS_LEVELS = ["pf", "st", "ta"]  # Permission groups of users in a group context
PERMISSION_LEVELS = list(
    set(ACCESS_LEVELS + PERMISSION_GROUPS)
)  # All available permission levels

# List of game platforms
GAME_PLATFORMS = ["vr", "mb", "cp"]

# Enum values listed on database
HAND_PREFERENCES = ["R", "L", "A"]
TERM_GENDERS = ["M", "F", "N"]

# Redis Configuration
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_CHARSET = "utf-8"

# SMTP server configuration
SMTP_SERVER = os.getenv("SMTP_SERVER") if os.getenv("SMTP_SERVER") else "localhost"
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_PORT = os.getenv("SMTP_PORT") if os.getenv("SMTP_PORT") else "25"
