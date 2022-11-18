import os
from dotenv import load_dotenv

load_dotenv()

# API endpoint prefixes
#API_ENDPOINT_PREFIX = '/api/'
API_ENDPOINT_PREFIX = '/elleapi/'

# Database configurations
MYSQL_DATABASE_USER = os.getenv('MYSQL_DATABASE_USER')
MYSQL_DATABASE_PASSWORD = os.getenv('MYSQL_DATABASE_PASSWORD')
MYSQL_DATABASE_DB = os.getenv('MYSQL_DATABASE_DB')
MYSQL_DATABASE_HOST = os.getenv('MYSQL_DATABASE_HOST')
SECRET_KEY = os.getenv('SECRET_KEY')

# Allowed image and audio extensions
IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'PNG', 'JPEG', 'JPG']
AUDIO_EXTENSIONS = ['ogg', 'wav', 'mp3']

# Path to folders - change accordingly
TEMP_UPLOAD_FOLDER = 'uploads/'
TEMP_DELETE_FOLDER = 'deletes/'
IMG_UPLOAD_FOLDER = '/var/www/html/Images/'
AUD_UPLOAD_FOLDER = '/var/www/html/Audios/'

# That path to append to the URL so the media
# is accessible publicly (https://endlesslearner.com/Images/...)
IMG_RETRIEVE_FOLDER = '/Images/'
AUD_RETRIEVE_FOLDER = '/Audios/'

# List of user permission types
# Changing these values is not recommended
PERMISSION_GROUPS = ['su', 'pf', 'st'] #Permission groups of individual users
ACCESS_LEVELS = ['pf', 'st', 'ta'] #Permission groups of users in a group context
PERMISSION_LEVELS = list(set(ACCESS_LEVELS+PERMISSION_GROUPS)) #All available permission levels

# List of game platforms
GAME_PLATFORMS = ['vr', 'mb', 'cp']

# Enum values listed on database
HAND_PREFERENCES = ['R', 'L', 'A']
TERM_GENDERS = ['M', 'F', 'N']

# Redis Configuration
#REDIS_HOST = "localhost"
#REDIS_PORT = 6379
#REDIS_CHARSET = "utf-8"

# SMTP server configuration
SMTP_SERVER = os.getenv('SMTP_SERVER') if os.getenv('SMTP_SERVER') else "localhost"
SMTP_USERNAME = os.getenv('SMTP_USERNAME')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
SMTP_PORT = os.getenv('SMTP_PORT') if os.getenv('SMTP_PORT') else "25"
