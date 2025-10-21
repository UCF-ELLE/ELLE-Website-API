from datetime import datetime
from pydantic import BaseModel
from .config import *
from config import FREE_CHAT_MODULE
from .database import getModuleTerms, getModuleLanguage
# from .convo_grader import *
import ast
import re
import json
import sys
import os
import requests 
import threading

# tool = None
# current_language = 'en-US'
# #user_language_history = defaultdict(list)

# Defining the API request and response formats, format was created for use with llama.cpp
def GenerateRequest(user_text, max_new_tokens=MAX_NEW_TOKENS, temperature=TEMPERATURE, top_k=TOP_K, top_p=TOP_P):
    return {
        "prompt": user_text,
        "n_predict": max_new_tokens,
        "temperature": temperature,
        "top_k": top_k,
        "top_p": top_p,
        "stop": ["User:", "\nUser:", "Instruction"],
        "stream": False
    }


def prewarm_llm_context(module_id, session_id):
    """
    Pre-warm the LLM with module context so first real message is fast.
    Sends a dummy message to cache the prompt.
    """
    # Determines what prompt to use based on module ID
    try: 
        if module_id == FREE_CHAT_MODULE or module_id is None:
            base_prompt = free_prompt
        else:
            base_prompt = main_prompt


            # If module is not a free chat then acquire language and vocab to pass into prompt
            try:
               terms = getModuleTerms(module_id)
               language = getModuleLanguage(module_id)

               if terms and language:
                    vocab_list = [term[1] for term in terms[:20]]
                    vocab_context = ", ".join(vocab_list)
                    base_prompt = f"""{base_prompt}
                    Context: Student learning {language[0]}. Key vocab: {vocab_context}
                    , When a vocab word remark that you remember more and thank for reminding"""

            except Exception as error:
                pass

        # Short "warming" message for LLM
        warming_message = "Hi"
        full_prompt = f"{base_prompt}\n\nStudent: {warming_message}\n\nTito:"

        request = GenerateRequest(user_text = full_prompt, max_new_tokens = 10) # Uses minimal tokens
        response = requests.post(model_path, json=request, timeout = 30)

        if response.status_code == 200:
            pass
        else:
            pass

    except Exception as error:
        pass


def create_module (prompt, term_count, nat_lang, target_lang):
    """
    Creates a blueprint for a module with an LLM prompt - fails if AI fails
    """
    try:
        full_prompt = build_module_prompt(prompt, term_count, nat_lang, target_lang)

        llm_response = generate_message_with_timeout("", full_prompt, timeout=30)
        
        if not llm_response:
            return {
                "status": "error",
                "message": "AI failed to generate a response (timeout or connection error)",
                "terms": []
            }
        
        parsed_terms = parse_llm_response(llm_response)
        
        if len(parsed_terms) == 0:
            return {
                "status": "error",
                "message": "AI generated response but no valid terms could be parsed",
                "terms": []
            }
            
        return {
            "status": "success",
            "message": f"AI generated {len(parsed_terms)} terms successfully",
            "terms": parsed_terms
        }

    except Exception as error:
        return {
            "status": "error",
            "message": f"AI generation failed with exception: {str(error)}",
            "terms": []
        }


def build_module_prompt(prompt, term_count, nat_lang, target_lang):
    # Very simple prompt optimized for small models like Phi-3
    # Start with fewer terms to avoid timeout
    actual_count = min(term_count, 5)  # Limit to 5 terms initially
    
    generation_prompt = f"""Generate {actual_count} basic {target_lang} vocabulary words about {prompt}.

Format: english|spanish|noun|feminine

Examples:
mother|madre|noun|feminine
father|padre|noun|masculine

Generate {actual_count} terms:"""

    return generation_prompt

def parse_llm_response(llm_response):
    try:
        terms = []
        lines = llm_response.strip().split('\n')

        for line in lines:
            line = line.strip()

            if not line or "|" not in line:
                continue
            
            # Remove leading numbers (e.g., "1. animal" -> "animal")
            line = re.sub(r'^\d+\.\s*', '', line)

            term_attributes = line.split("|")

            if len(term_attributes) >= 4:
                target_word = term_attributes[0].strip()   # AI puts Spanish first
                native_word = term_attributes[1].strip()   # AI puts English second
                part_of_speech = term_attributes[2].strip()
                gender = term_attributes[3].strip()

                if native_word and target_word:
                    term = {
                        "native_word": native_word,
                        "target_word": target_word,
                        "part_of_speech": part_of_speech,
                        "gender": gender
                    }

                    # if validate_term(term):
                    terms.append(term)
        return terms

    except Exception as error:
        return []

# def validate_term(term: Dict):
#     """
#     Validates that a term has all required fields.
#     """
#     required_fields = ['native_word', 'target_word', 'part_of_speech', 'gender']
#     return all(field in term for field in required_fields)

def generate_message_with_timeout(message, prompt, timeout=30):
    """
    Sends API request to the running llama.cpp server with custom timeout.
    """
    full_prompt = f"Instruction: {prompt}\nUser: {message}\nAssistant:"
    request = GenerateRequest(user_text=full_prompt)
    
    try:
        response = requests.post(model_path, json=request, timeout=timeout)
        response.raise_for_status()
        response_data = response.json()
        
        if "content" in response_data:
            return response_data["content"]
        else:
            return str(response_data)
            
    except requests.exceptions.RequestException as e:
        return None
    except json.JSONDecodeError as e:
        return None

def generate_message(message, prompt):
    """
    Sends API request to the running llama.cpp server.
    """
    full_prompt = f"Instruction: {prompt}\nUser: {message}\nAssistant:"
    request = GenerateRequest(user_text=full_prompt)

    try:
        response = requests.post(model_path, json=request, timeout=60)  # 1 minute timeout
        response.raise_for_status()  # Raise an exception for bad status codes
        response_data = response.json()
        
        # llama.cpp returns response in "content" field
        if "content" in response_data:
            return response_data["content"]
        else:
            # Fallback for different response formats
            return str(response_data)
            
    except requests.exceptions.RequestException as e:
        return "Sorry, I'm having trouble connecting to the language model."
    except json.JSONDecodeError as e:
        return "Sorry, I received an invalid response from the language model."

def handle_message(message: str, module_id: int = None, prompt=None):
    """
    Handles the incoming message and generates a response using the LLM.
    """
    try:
        if module_id == FREE_CHAT_MODULE or module_id is None:
            if prompt is None:
                prompt = free_prompt
        else:
            if prompt is None:
                prompt = main_prompt

        response = generate_message(message, prompt)
        response = response.strip()

        
            
    except Exception as e:
        return {"response" : "Sorry, Tito could not understand your message! Please try again."}
    
    return response
        

def detect_innapropriate_language(message: str):
    """
    Safety filter for educational environment.
    """

    try:
        response = generate_message(message, content_filter_prompt)
        response = response["Assistant"]
        response = response[response.index("{"):response.index("}")+1]
        response = ast.literal_eval(response)
        
        return {
            "is_appropriate": response.get("appropriate", True),
            "reason": response.get("reason", ""),
            "severity": response.get("severity", "low")
        }
        
    except Exception as e:
        # Default to appropriate if filter fails
        return {
            "is_appropriate": True,
            "reason": "",
            "severity": "low"
        }



# TODO: Figure out about
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
