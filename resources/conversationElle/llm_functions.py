from datetime import datetime
from pydantic import BaseModel
from config import MAX_NEW_TOKENS, TEMPERATURE, TOP_K, TOP_P
from config import model_path, get_main_prompt, english_prompt, identify_language_prompt, device, music_prompt, vocab_list, background_prompt, background_files, music_files
import re
import json
import sys
import os
from resources.conversationElle.utils import grade_grammar, count_words
import requests

# Defining the API request and response formats.
def GenerateRequest(user_text, max_new_tokens=MAX_NEW_TOKENS, temperature=TEMPERATURE, top_k=TOP_K, top_p=TOP_P):
    return {
        user_text: user_text,
        max_new_tokens: max_new_tokens,
        temperature: temperature,
        top_k: top_k,
        top_p: top_p
    }

#class GenerateResponse(BaseModel):
#    generated_text: str

def generate_message(message, prompt):
    full_prompt = f"Instruction: {prompt}\nUser: {message}\nAssistant:"
    request = GenerateRequest(user_text=full_prompt)

    try:
        response = requests.post(model_path, data=request)
        print(response)
    except Exception as e:
        #raise HTTPException(status_code=500, detail="Failed to generate response")
        print("Error")

    return response


def identify_language(message: str):
    """
    Identifies the language of the user input.
    """

    return generate_message(message, identify_language_prompt)
    

def handle_message(message: str, prompt=None):
    """
    Handles the incoming message and generates a response using the LLM.
    """
    # Construct the full prompt
    if prompt == None:
        try:
            language = identify_language(message)
        except:
            language = "english"

        if language == "english":
            prompt = english_prompt
            return generate_message(message, prompt)
        else:
            prompt = get_main_prompt(language)
            response = generate_message(message, prompt)
            grade = grade_grammar(message, language)
            return {"generated_text": response, "grammar_grading": grade}


def getUserBackground(vocab_list: str):
    """
    Returns a filename in the background folder with name that
    is the most similar to the words in the vocab list.
    """
    try:
        response = handle_message(vocab_list, background_prompt)
    except Exception as e:
        return background_files[0]

    return response


def getUserMusicChoice(vocab_list: str):
    """
    Returns a filename in the music folder with name that
    is the most similar to the words in the vocab list.
    """
    try:
        response = handle_message(vocab_list, music_prompt)
    except Exception as e:
        return music_files[0]

    return response


'''
# Root endpoint to test if the server is up
@app.get("/")
async def root():
    return {"message": "Hola soy Tito!"}

# Endpoint to generate text using the LLM
@app.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    """
    Generates text based on the user's input using the LLM.
    """
    try:
        user = request.user_text

        response = requests.post(model_path, data=request)
        print(response)

        return GenerateResponse(response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
'''