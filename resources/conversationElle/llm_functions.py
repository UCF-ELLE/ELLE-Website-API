from datetime import datetime
from pydantic import BaseModel
from resources.conversationElle.config import MAX_NEW_TOKENS, TEMPERATURE, TOP_K, TOP_P
from resources.conversationElle.config import model_path, main_prompt, get_main_prompt, english_prompt, identify_language_prompt, get_grammar_grading_prompt, background_music_prompt, background_files, music_files
import ast
import re
import json
import sys
import os
import requests

# Defining the API request and response formats.
def GenerateRequest(user_text, max_new_tokens=MAX_NEW_TOKENS, temperature=TEMPERATURE, top_k=TOP_K, top_p=TOP_P):
    return {
        "user_text": user_text,
        "max_new_tokens": max_new_tokens,
        "temperature": temperature,
        "top_k": top_k,
        "top_p": top_p
    }

def generate_message(message, prompt):
    """
    Sends API request to the running LLM.
    """
    full_prompt = f"Instruction: {prompt}\nUser: {message}\nAssistant:"
    request = GenerateRequest(user_text=full_prompt)
    #print("request: ", request)

    response = requests.post(model_path, json=request)
    response = response.json()
    #print("LLM response: ", response)
    
    return response


def identify_language(message: str):
    """
    Identifies the language of the user input.
    """
    return generate_message(message, identify_language_prompt)

def handle_message(message: str):
    """
    Handles the incoming message and generates a response using the LLM.
    """
    try:
        response = generate_message(message, main_prompt)
        response = response["Assistant"]
        response = response[response.index("{"):response.index("}")+1]
        response = ast.literal_eval(response)
        #print("returned message: ", response)
    except Exception as e:
        print(e)
        return {"response" : "Sorry, Tito could not understand your message! Please try again.", "score": 0}
    
    return response
        

def getUserBackgroundandMusic(vocab_list: str):
    """
    Returns a filename in the background folder and music folder
    with the name that is the most similar to the words in the vocab list.
    """
    try:
        response = generate_message(vocab_list, background_music_prompt)
        
        # clean response
        response = response["Assistant"]
        response = response[response.index("{"):response.index("}")+1]
        response = ast.literal_eval(response)
        
    except Exception as e:
        return background_files[0], music_files[0]

    return response["background_file"], response["music_file"]
