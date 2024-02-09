import os
from dotenv import load_dotenv

# Load environment variables from the .env file present
load_dotenv()

# API endpoint prefixes
API_ENDPOINT_PREFIX = "/elleapi/"

# Database configurations
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB")
MYSQL_HOST = os.getenv("MYSQL_HOST")
SQLALCHEMY_DATABASE_URI = (
    f"mysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"
)
SECRET_KEY = os.getenv("SECRET_KEY")

# Allowed image and audio extensions
IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "PNG", "JPEG", "JPG"]
AUDIO_EXTENSIONS = ["ogg", "wav", "mp3"]

# Path to folders - change accordingly
TEMP_UPLOAD_FOLDER = "temp_uploads/"
TEMP_DELETE_FOLDER = "deletes/"
IMG_UPLOAD_FOLDER = "images/"
AUD_UPLOAD_FOLDER = "audios/"

# That path to append to the URL so that the media is accessible publicly
# e.g. https://chdr.cs.ucf.edu/images/[FILE_NAME]
IMG_RETRIEVE_FOLDER = "/images/"
AUD_RETRIEVE_FOLDER = "/audios/"

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
MAIL_SERVER = os.getenv("SMTP_SERVER") if os.getenv("SMTP_SERVER") else "localhost"
MAIL_USERNAME = os.getenv("SMTP_USERNAME")
MAIL_PASSWORD = os.getenv("SMTP_PASSWORD")
MAIL_PORT = os.getenv("SMTP_PORT") if os.getenv("SMTP_PORT") else "25"
MAIL_USE_TLS = True
MAIL_USE_SSL = False

# Other
JWT_BLACKLIST_ENABLED = True
JWT_BLACKLIST_TOKEN_CHECKS = ["access", "refresh"]
PROPOGATE_EXCEPTIONS = True
