from flask import send_file
from flask_restful import Resource
from utils import *
from exceptions_util import *
import io
import os
from pathlib import Path
from pydub import AudioSegment

# Audio Folder
AUDIO_FOLDER = "audios/"

MAX_AUDIO_BYTES = 10_000_000

class AudioFormat:
    MP3 = ".mp3"
    OGG = ".ogg"
    WAV = ".wav"
    ERR = "ERR"

    def type(file):
        array = file.lower().split(".")
        length = len(array)
        if (length < 2):
            return AudioFormat.ERR
        
        format_name = array[length - 1]

        match format_name:
            case "mp3":
                return AudioFormat.MP3
            case "ogg":
                return AudioFormat.OGG
            case "wav":
                return AudioFormat.WAV
        return AudioFormat.ERR

# Audio Conversion Endpoint - the WebGL AudibELLE depends on this Endpoint
class WAVAudioConversion(Resource):
    def get(self, path):
        '''
        Obtains an Audio File from "/audios/"
        Then converts to the ".wav" format 
        and returns the converted audio file
        '''

        # Finds the Format Type
        file_type = AudioFormat.type(path)
        if (file_type == AudioFormat.ERR):
            return errorMessage("Not an expected audio format"), 400
        
        # Ensures that the filepath is within '/audios/' Directory
        base_dir = Path(AUDIO_FOLDER).resolve()
        filepath = Path(base_dir / path).resolve()

        if base_dir not in filepath.parents:
            return errorMessage("Invalid Path"), 400

        # File not in the '/audios/' Directory
        if not os.path.isfile(filepath):
            return errorMessage("File Not Found"), 404
        
        # Limits Audio Size such that there are not too Large
        if os.path.getsize(filepath) > MAX_AUDIO_BYTES:
            return errorMessage("File too Large"), 413

        try:
            # Load Audio
            audio = AudioSegment.from_file(filepath)
            
            # Convert to WAV
            wav_io = io.BytesIO()
            audio.export(wav_io, format="wav")

            # Start Audio at Beginning
            wav_io.seek(0)

            # Returns the Converted Audio File
            return send_file(
                wav_io,
                mimetype ="audio/wav",
                as_attachment = False,
                attachment_filename = path.replace(file_type, ".wav")
            )
        
        except Exception as e:
            # print(e)
            return errorMessage("Failed to Convert"), 500