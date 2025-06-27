import os
import torch
from pathlib import Path

# LLM variables
curr_path = os.path.abspath(__file__)
curr_dir = os.path.dirname(curr_path)
par_dir = str(Path(curr_dir).parent)
os.chdir(par_dir)
#model_path = os.path.join(par_dir, "Qwen2.5-7B-Instruct")
model_path = "http://127.0.0.1:8000/generate"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Generation variables
MAX_NEW_TOKENS = 1000
TEMPERATURE = 0.7
TOP_K = 50
TOP_P = 0.95

# Other variables
language_list = ["english", "spanish", "portuguese"]
level = "College"
vocal_percent = 0.5

# Reading list of background files
background_directory = "conversationElle/assets/backgrounds/"
background_files = os.listdir(background_directory)
background_files = [f for f in background_files if os.path.isfile(background_directory+'/'+ f) and not '.py' in f]

# Reading list of music files
music_directory = "../templates/public/TitoAudios"
music_files = os.listdir(music_directory)
music_files = [f for f in music_files if os.path.isfile(music_directory+'/'+ f) and not '.py' in f]

# Format strings
json_string = """{\"thought\": # you should always think about what you need to do, \"tool\": # the name of the tool. This must be one of: [test_function], \"tool_input\": # the input to the tool}"""
grammar_response_json_string = """{\"response\": # your response to the message, \"score\": # your score, \"error\": # description of error, \"correction\": # corrected version, \"explanation\": # why it was wrong and how to fix it}"""
response_string = """{\"response\": # your response to the message}"""
grammar_json_string = """{\"score\": # your score from 1-10 or 'None' if the user's message is primarily in English, \"error\": # if there is an error, list one or more from ["Grammar Mistake", "Word Use Mistake", "Spelling Mistake", "Conjugation Mistake"] to descibe the error, \"correction\": # the corrected version, \"explanation\": # why it was wrong and how to fix it}"""
choose_background_and_music = """{\"background_file\": # one file name from: """ + str(background_files) + """, \"music_file\": # one file name from: """ + str(music_files) + """}"""

# Prompt f-strings
main_prompt = f"""You are a chatty parrot named Tito. Your goal is to respond in the same language as the user. You need to grade the user's message and return a response. Every response you generate must be in the following JSON format: {grammar_response_json_string}."""
free_prompt = f"""You are a chatty parrot named Tito. Your goal is to guide a user who is trying to learn a new language by answering their questions. Every response you generate must be in the following JSON format: {response_string}."""
background_music_prompt = f"""You are an expert summarizer. Your goal is to select the word that best matches a list of words. #Every response you generate must be in the following JSON format {choose_background_and_music}."""
identify_language_prompt = f"""Your goal is to identify the language the user is talking in. Only respond with one of the languages in the following list: {language_list}."""
