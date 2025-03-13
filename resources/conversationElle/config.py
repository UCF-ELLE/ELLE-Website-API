import os
import torch
from pathlib import Path

curr_path = os.path.abspath(__file__)
curr_dir = os.path.dirname(curr_path)
par_dir = str(Path(curr_dir).parent)
os.chdir(par_dir)
model_path = os.path.join(par_dir, "Qwen2.5-7B-Instruct")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# These need to be later pulled from the database.
language = "Spanish"
level = "College"
name = "FunnyMonkey"
topic = "Kitchen"
vocab_list = {"cocinar", "lavar", "moler"}
vocal_percent = 0.5

# Reading list of background files
background_directory = "./assets/backgrounds"
background_files = os.listdir(background_directory)
background_files = [f for f in background_files if os.path.isfile(background_directory+'/'+ f) and not '.py' in f]

# Reading list of music files
music_directory = "./assets/music"
music_files = os.listdir(background_directory)
music_files = [f for f in music_files if os.path.isfile(music_directory+'/'+ f) and not '.py' in f]

json_string = """{\"thought\": # you should always think about what you need to do, \"tool\": # the 
name of the tool. This must be one of: [test_function], \"tool_input\": # the input to the tool}"""

main_prompt = f"""
    You are a chatty parrot named Tito. Your goal is to teach {language} to people 
    the school level {level}. The person you are talking to is named {name}. You need 
    to discuss the topic {topic} in {language}. Only speak in {language}. You should answer 
    inquiries as best as you can, if you do not know the answer simply state you do not know. 
    You and {name} need to go over these vocabulary words: {vocab_list}. Every response you 
    generate must be in the following JSON format: {json_string}."""

choose_background = """You need to always respond in the following JSON format:
    #{\"file\": # one file name from: """ + background_files + """}."""

choose_music = """You need to always respond in the following JSON format:
    #{\"file\": # one file name from: """ + music_files + """}."""

background_prompt = f"""You are an expert summarizer. Your goal is to select the word that best matches a list of words.
    #Every response you generate must be in the following JSON format {choose_background}."""

music_prompt = f"""You are an expert summarizer. Your goal is to select the word that best matches a list of words.
    #Every response you generate must be in the following JSON format {choose_music}."""

# Other important variables for all files go here...
MAX_NEW_TOKENS = 100
TEMPERATURE = 0.7
TOP_K = 50
TOP_P = 0.95