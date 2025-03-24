import os
import torch
from pathlib import Path

curr_path = os.path.abspath(__file__)
curr_dir = os.path.dirname(curr_path)
par_dir = str(Path(curr_dir).parent)
os.chdir(par_dir)
#model_path = os.path.join(par_dir, "Qwen2.5-7B-Instruct")
model_path = "http://10.200.8.216:8000/generate"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

language_list = ["english", "spanish", "portuguese"]
level = "College"
vocal_percent = 0.5

# Reading list of background files
background_directory = "conversationElle/assets/backgrounds/"
#background_directory = "/assets/backgrounds"
background_files = os.listdir(background_directory)
background_files = [f for f in background_files if os.path.isfile(background_directory+'/'+ f) and not '.py' in f]

# Reading list of music files
#music_directory = "./assets/music"
music_directory = "../templates/public/TitoAudios"
music_files = os.listdir(music_directory)
music_files = [f for f in music_files if os.path.isfile(music_directory+'/'+ f) and not '.py' in f]

json_string = """{\"thought\": # you should always think about what you need to do, \"tool\": # the 
name of the tool. This must be one of: [test_function], \"tool_input\": # the input to the tool}"""

grammar_response_json_string = """{\"response\": # your response to the message, \"score\": # your score, \"error\": # description of error, \"correction\": # corrected version,
\"explanation\": # why it was wrong and how to fix it}"""

grammar_json_string = """{\"score\": # your score from 1-10, \"error\": # description of error, \"correction\": # corrected version,
\"explanation\": # why it was wrong and how to fix it}"""

'''
# original prompt
main_prompt = f"""
    You are a chatty parrot named Tito. Your goal is to teach {language} to people 
    the school level {level}. The person you are talking to is named {name}. You need 
    to discuss the topic {topic} in {language}. Only speak in {language}. You should answer 
    inquiries as best as you can, if you do not know the answer simply state you do not know. 
    You and {name} need to go over these vocabulary words: {vocab_list}. Every response you 
    generate must be in the following JSON format: {json_string}."""
'''

main_prompt = f"""You are a chatty parrot named Tito. Your goal is to respond in the same language as the user. You need to grade the user's message and return a response. Every response you generate must be in the following JSON format: {grammar_response_json_string}."""

# edited prompts
english_prompt = f"""
    You are a chatty parrot named Tito. Your goal is to teach language to people 
    at the school level {level}.
    You should answer inquiries as best as you can in English, 
    if you do not know the answer simply state you do not know."""

identify_language_prompt = f"""
    Your goal is to identify the language the user is talking in.
    Only respond with one of the languages in the following list:
    {language_list}."""

def get_grammar_grading_prompt(language):
    return f"""You are being given a sentence from a student. Grade the student's grammar on a scale of 1-10.
    The language the student is using is {language}. Identify and explain any grammatical errors in the text.
    Explain your reasoning for the score you give the student. For each error,
    provide an example of the correct usage to help the student understand the mistake. Provide your feedback in the
    following JSON format: {grammar_json_string}"""

choose_background_and_music = """{\"background_file\": # one file name from: """ + str(background_files) + """, \"music_file\": # one file name from: """ + str(music_files) + """}"""

#choose_music = """{\"music_file\": # one file name from: """ + str(music_files) + """}"""

background_music_prompt = f"""You are an expert summarizer. Your goal is to select the word that best matches a list of words. #Every response you generate must be in the following JSON format {choose_background_and_music}."""

#background_prompt = f"""You are an expert summarizer. Your goal is to select the word that best matches a list of words. #Every response you generate must be in the following JSON format {choose_background}."""

#music_prompt = f"""You are an expert summarizer. Your goal is to select the word that best matches a list of words. #Every response you generate must be in the following JSON format {choose_music}."""

def get_main_prompt(language):
    return f"""
    You are a chatty parrot named Tito. Your goal is to teach {language} to people 
    at the school level {level}. You need to only speak in {language}. 
    You should answer inquiries as best as you can, 
    if you do not know the answer simply state you do not know."""

# Other important variables for all files go here...
MAX_NEW_TOKENS = 1000
TEMPERATURE = 0.7
TOP_K = 50
TOP_P = 0.95
