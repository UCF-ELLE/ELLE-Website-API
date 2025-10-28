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


def prewarm_llm_context(module_id, session_id):
    """
    Pre-warm the LLM with module context so first real message is fast.
    Caches the system prompt (with vocab context) in llama.cpp's KV cache.
    Subsequent messages will reuse this cached prompt.
    """
    try:
        # Get the full enhanced prompt with module vocab context
        base_prompt = build_enhanced_prompt(module_id)
        # Format it exactly as it will appear in subsequent messages
        warming_prompt = f"{base_prompt}\n\nStudent: Hello\n\nTito:"
        
        request = {
            "prompt": warming_prompt,
            "n_predict": 5,
            "temperature": 0.7,
            "cache_prompt": True,  # Cache the full prompt for reuse
            "stream": False
        }
        
        response = requests.post(model_path, json=request, timeout=30)
        
        if response.status_code == 200:
            print(f"Pre-warmed LLM cache for module {module_id}")
            print(f"[DEBUG] Cached prompt will be reused for subsequent messages")
        else:
            print(f"Pre-warming got status {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Pre-warming failed: {e}")

def create_module(prompt, term_count, nat_lang, target_lang):
    """
    Creates a blueprint for a module with an LLM prompt - fails if AI fails
    """
    try:
        term_count = int(term_count)

        full_prompt = build_module_prompt(prompt, term_count, nat_lang, target_lang)

        # Build custom request specifically for module generation
        # Increase n_predict based on how many terms we need
        n_predict = max(150, term_count * 25)  # At least 25 tokens per term
        
        request = {
            "prompt": full_prompt,
            "n_predict": n_predict,
            "temperature": 0.5,
            "top_k": 30,
            "top_p": 0.9,
            "stop": ["STOP"],
            "stream": False,
            "ignore_eos": True,
            "cache_prompt": False
        }

        print(f"[DEBUG] Module generation request prompt:\n{full_prompt}\n")
        print(f"[DEBUG] Request config: {request}\n")

        try:
            response = requests.post(model_path, json=request, timeout=60)  # 10 second timeout
            response.raise_for_status()
            response_data = response.json()

            llm_response = response_data.get("content", "")
            
            print(f"[DEBUG] Raw LLM Response length: {len(llm_response)}")
            print(f"[DEBUG] Raw LLM Response:\n{llm_response}\n")

            parse_terms = parse_llm_response(llm_response, int(term_count))
            
            print(f"[DEBUG] Parsed {len(parse_terms)} terms (requested {term_count})\n")

            return parse_terms

        except requests.exceptions.Timeout:
            print("[ERROR] Request timed out - model took too long to respond")
            return {
                "status": "error",
                "message": "Request timed out",
                "terms": []
            }
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            return {
                "status": "error",
                "message": f"Request failed: {e}",
                "terms": []
            }

    except Exception as error:
        print(f"Module generation error: {error}")
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "message": f"AI generation failed with exception: {str(error)}",
            "terms": []
        }


def build_module_prompt(prompt, term_count, nat_lang, target_lang):
    # SIMPLIFIED VERSION - much shorter to test
    generation_prompt = f"""Generate {term_count} vocabulary terms about {prompt}.
    No numbers. No explanations. Only pipe-separated lines.
    Format: {nat_lang}|{target_lang}|part_of_speech|gender

    Output exactly {term_count} lines. Say STOP after line {term_count}. Do not continue."""

    return generation_prompt

def parse_llm_response(llm_response, term_count=5):
    try:
        terms = []
        lines = llm_response.strip().split('\n')

        print(f"[DEBUG] Parsing {len(lines)} lines from response")

        for line in lines:
            line = line.strip()
            
            if len(terms) >= term_count:
                break

            # Skip empty lines
            if not line:
                continue
            
            # Remove leading numbers (e.g., "1. animal" -> "animal")
            line = re.sub(r'^\d+\.\s*', '', line)

            # Only process lines with pipes
            if "|" not in line:
                print(f"[DEBUG] Skipping non-pipe: {line[:50]}")
                continue

            # Remove leading numbers (e.g., "1. " or "1. ")
            if line[0].isdigit():
                # Find the first non-digit character after numbers and dots
                for i, char in enumerate(line):
                    if char.isalpha():
                        line = line[i:]
                        break

            parts = [p.strip() for p in line.split("|")]

            # Need at least 3 parts (word|word|something)
            if len(parts) < 3:
                continue

            native_word = parts[0]
            target_word = parts[1]
            
            # Extract gender and POS from remaining parts (order might vary)
            remaining = [p.lower() for p in parts[2:]]
            gender = "neutral"
            pos = "noun"
            
            for part in remaining:
                if part in ['masculine', 'masc', 'feminine', 'fem', 'neutral']:
                    gender = part if len(part) > 4 else ('masculine' if part == 'masc' else 'feminine' if part == 'fem' else 'neutral')
                elif part in ['noun', 'verb', 'adj', 'adjective', 'adverb', 'prep', 'preposition']:
                    pos = part

            # Basic validation
            if (native_word and target_word and 
                len(native_word) < 30 and len(target_word) < 30):  # Not a copy
                
                term = {
                    "native_word": native_word,
                    "target_word": target_word,
                    "part_of_speech": pos,
                    "gender": gender
                }
                terms.append(term)
                print(f"[DEBUG] ✓ Parsed: {term}")
            else:
                print(f"[DEBUG] ✗ Rejected: {parts}")

        print(f"[DEBUG] Successfully parsed {len(terms)} terms (requested {term_count})")
        return terms

    except Exception as error:
        return []

# def validate_term(term: Dict):
#     """
#     Validates that a term has all required fields.
#     """
#     required_fields = ['native_word', 'target_word', 'part_of_speech', 'gender']
#     return all(field in term for field in required_fields)


def handle_message_with_context(message: str, module_id: int, session_id: int):
    """
    Handle a chat message with module context.
    During pre-warm, the system prompt is cached in llama.cpp.
    Subsequent messages ONLY send: Student: {message}\n\nTito:
    This way the cached prompt is reused without re-evaluation.
    """
    try:
        # Only send the message, not the system prompt
        # The system prompt was already cached during pre-warm
        full_prompt = f"Student: {message}\n\nTito:"
        response = generate_message_direct(full_prompt)
        return response.strip()
        
    except Exception as error:
        print(f"Context-aware message error: {error}")
        return "Sorry, Tito had trouble responding!"

def build_enhanced_prompt(module_id: int = None):
    """
    Builds the enhanced prompt with module context.
    """
    if module_id == FREE_CHAT_MODULE or module_id is None:
        return free_prompt

    enhanced_prompt = main_prompt

    try:
        terms = getModuleTerms(module_id)
        language = getModuleLanguage(module_id)

        if terms and language:
            vocab_list = [term[1] for term in terms[:8]]
            vocab_context = ", ".join(vocab_list)
            enhanced_prompt = f"""{enhanced_prompt}

            Context: Student learning {language[0]}. Key vocab: {vocab_context}
            """
    except Exception as error:
        print(f"Could not load module context: {error}")

    return enhanced_prompt

def generate_message_direct(full_prompt: str):
    """
    Direct generation for chat messages.
    Uses cache_prompt to reuse the system prompt from pre-warming.
    """
    request = {
        "prompt": full_prompt,
        "n_predict": MAX_NEW_TOKENS,
        "temperature": TEMPERATURE,
        "top_k": TOP_K,
        "top_p": TOP_P,
        "stop": ["\nStudent:"],
        "stream": False,
        "cache_prompt": True
    }

    try:
        response = requests.post(model_path, json=request, timeout=60)
        response.raise_for_status()
        response_data = response.json()

        if "content" in response_data:
            return response_data["content"]
        return ""

    except Exception as error:
        print(f"Generation error: {error}")
        return "Sorry, I'm having trouble connecting."

def clear_session_context(session_id: int):
    """
    Clear context when session ends or user wants to restart.
    Calls this when a chatbot session is closed.
    """

    if session_id in SESSION_CONTEXTS:
        del SESSION_CONTEXTS[session_id]
        print(f"Cleared context for session {session_id}")

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

        print(f"[DEBUG] Raw LLM response: {response}")
            
    except Exception as e:
        return {"response" : "Sorry, Tito could not understand your message! Please try again."}
    
    return response
        
# Not used right / WIP
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
