import spacy
from spacy import Language

import queue
import threading
from collections import defaultdict
import re

import ahocorasick
from .database import *



'''
    This is a SINGLE-THREADED background process to lemmatize single messages at a time 
        via a Queue and matches those tokens against a module's key terms/phrases using
        Aho-Corasick algorithm and matching only the longest match if there are overlaps.

    All that is required to awaken this process is to add a message to the queue via add_message(), 
        the process shall sleep once finished

    NOTE: Caching language models (pre-loading) vs Lazy-loading
        Currently using lazy-loading, but consider pre-loading if enough resources (RAM) exists 
            AND/OR the Tito service has a lot of varied traffic with different languages in the future
'''

# NOTE: DOWNLOADING spacy LANGUAGE SUPPORT examples (DOWNLOAD SMALLS FOR NOW)
# python -m spacy download en_core_web_sm
# python -m spacy download fr_core_news_sm
# python -m spacy download es_core_news_sm

# Set to True when trying to debug the chronological ordering of events
DEBUG_TRACING_FLAG = False
# Set to True when you want to view useful debugging info on all processes here 
SYSTEM_LOGGING_FLAG = False


# TODO: predownload spacy language models on ELLE server
# Map 2-letter language codes to spaCy model names, also found in the `terms`.`language` column
SPACY_MODELS = {
    "en": "en_core_web_sm",
    "es": "es_core_news_sm",
    "fr": "fr_core_news_sm",
    "de": "de_core_news_sm",
    "zh": "zh_core_web_sm",  # Chinese
    "pt": "pt_core_news_sm",
    # TODO: extend for other models
}

DEFAULT_LANGUAGE_CODE = "en" # english
CURRENT_LANGUAGE = DEFAULT_LANGUAGE_CODE

NLP = spacy.load(SPACY_MODELS[DEFAULT_LANGUAGE_CODE]) # init spacy nlp w/ defaulted lang
MESSAGE_QUEUE = queue.Queue() # Messages to be parsed
MODULE_AUTOMATA = {} # module_id -> automata

CURRENT_MODULE_ID = 0 # module_id starts @ 1
CURRENT_KEY_TERM_PHRASES = []  # list of tuples: (term_id, term_str)
CURRENT_KEY_TERM_PHRASES_LEMMATIZED = [] # same as above, but lemmatized







def add_message(message: str, module_id: int, user_id: int, message_id: int, chatbot_sid: int, update_db=True):
    '''
        Push a (message, module_id, user_id, message_id) tuple into the queue.
    '''
    if DEBUG_TRACING_FLAG:
        print("[CHRONOLOGY] VARIABLE: Running add_message()")

    try:
        # THIS SHOULD NOT HAPPEN!!!
        if module_id == FREE_CHAT_MODULE:
            return

        MESSAGE_QUEUE.put((message, module_id, user_id, message_id, chatbot_sid, update_db))
    except Exception as e:
        print(f"[ERROR] Failed to add message {message_id} to queue: Error: {e}")

    if SYSTEM_LOGGING_FLAG:
        print(f"[QUEUE] Added message for user {user_id} to process for key terms")

def load_language(lang_code: str):
    '''
        Loads another spaCy model for the given language code ONLY IF its is currently NOT loaded.
            Falls back to English if unsupported.
    '''
    if DEBUG_TRACING_FLAG:
        print("[CHRONOLOGY] 3: loading nlp model language @ load_language()")

    global CURRENT_LANGUAGE, NLP

    if lang_code != CURRENT_LANGUAGE:
        try:
            if SYSTEM_LOGGING_FLAG:
                print(f"[INFO] Trying to load spaCy model '{SPACY_MODELS[lang_code]}' for language '{lang_code}'")
            
            NLP = spacy.load(SPACY_MODELS[lang_code])
            CURRENT_LANGUAGE = lang_code

            if SYSTEM_LOGGING_FLAG:
                print(f"[INFO] NLP in use {NLP}")
                print(f"[INFO] Loaded spaCy model '{SPACY_MODELS[lang_code]}' for language '{lang_code}'")
        except OSError:
            print(f"[WARN] Failed while loading model '{SPACY_MODELS[lang_code]}'.Falling back to '{DEFAULT_LANGUAGE_CODE}'. \n{e}")
            NLP = spacy.load(SPACY_MODELS[DEFAULT_LANGUAGE_CODE])
            CURRENT_LANGUAGE = DEFAULT_LANGUAGE_CODE

def process_message(message: str, module_id: int, user_id: int, message_id: int, chatbot_sid: int, update_db: bool):
    '''
    4-step process:
        1. Check if module is currently loaded in to prevent unnecessary lookups and update key-terms as needed
        2. Check if the currently loaded language is correct, update nlp as needed
        3. Run spaCy on new key-terms and messages
        4. Match key terms to messages
    '''
    if DEBUG_TRACING_FLAG:
        print("[CHRONOLOGY] 2: Processing message at process_message()")

    global CURRENT_MODULE_ID, CURRENT_KEY_TERM_PHRASES, CURRENT_KEY_TERM_PHRASES_LEMMATIZED
    if SYSTEM_LOGGING_FLAG:
        print(f"[INFO] Loaded method: process_message")

    update_key_term_flag = False

    # 1. Ensure module is set, should run on the first time since module_id=0 DNE
    if module_id != CURRENT_MODULE_ID:
        update_key_term_flag = True

        if SYSTEM_LOGGING_FLAG:
            print(f"[INFO] Loading language {getModuleLanguage(module_id)[0]}")

        # 2. Ensures right language model is set up
        load_language(getModuleLanguage(module_id)[0])
        if SYSTEM_LOGGING_FLAG:
            print(f"[INFO] Loaded language {getModuleLanguage(module_id)[0]}")


        CURRENT_KEY_TERM_PHRASES = getModuleTerms(module_id)
        CURRENT_MODULE_ID = module_id
        if SYSTEM_LOGGING_FLAG:
            print(f"[INFO] Loaded key terms for module {module_id}")
            print(f"[INFO] Terms loaded: \n{CURRENT_KEY_TERM_PHRASES}")

    # 3. spaCy parsing
    doc = NLP(message)
    if SYSTEM_LOGGING_FLAG:
        print(f"[INFO] Lemmatizing message")

    lemmas = [token.lemma_.lower() for token in doc]
    if SYSTEM_LOGGING_FLAG:
        print(f"[INFO] lemmatized: \n{lemmas}")


    # 3.1 lemmatize new key terms if new module
    if SYSTEM_LOGGING_FLAG:
        print(f"[INFO] Updating key terms:")

    if update_key_term_flag or not CURRENT_KEY_TERM_PHRASES_LEMMATIZED:
        CURRENT_KEY_TERM_PHRASES_LEMMATIZED = lemmatize_terms(CURRENT_KEY_TERM_PHRASES, NLP)
        update_key_term_flag = False
        if SYSTEM_LOGGING_FLAG:
            print(f"[INFO] Key terms lemmatized: \n{CURRENT_KEY_TERM_PHRASES_LEMMATIZED}")

    # 4. Find matches and update in the DB
    if SYSTEM_LOGGING_FLAG:
        print(f"[INFO] Updating key terms matches:")

    matches = find_used_key_terms(CURRENT_KEY_TERM_PHRASES_LEMMATIZED, lemmas, message_id, chatbot_sid, user_id, module_id, update_db)

    return matches

def clean_term_phrase(term_phrase: str):
    '''
    Clean up raw term words/phrases using regex:
      - Trim word endings like "naranjo/a" -> "naranjo"
      - Leave spaced slashes ("apples / oranges") untouched
      - Convert isolated "/word" -> ""
    '''
    # Handle things like "naranjo/a" to ret naranjo
    term_phrase = re.sub(r"(\w+)/\w+\b", r"\1", term_phrase)

    # Handle cases like "/word" -> ""
    term_phrase = re.sub(r"(^|\s)/\w+\b", r"\1", term_phrase)

    return term_phrase.strip()

def lemmatize_terms(terms: (int, str), nlp: Language):
    '''
        terms: list of [id, term]
        returns: list of (id, lemmatized_term)
    '''
    if DEBUG_TRACING_FLAG:
        print("[CHRONOLOGY] 4: Lemmatizing key terms/phrases at lemmatize_terms()")

    lemmatized = []
    for term_id, term_phrase in terms:
        sanitized = clean_term_phrase(term_phrase)

        # May be a single word or a phrase
        # when a term is a phrase/multi-word term -> "w1 w2 w3..."
        doc = nlp(sanitized) 
        
        lemma = " ".join([token.lemma_.lower() for token in doc])
        if SYSTEM_LOGGING_FLAG:
            print(f"lemma (sanitized): ({lemma}), original phrase: ({term_phrase})")
        lemmatized.append((term_id, lemma))
    return lemmatized

def find_used_key_terms(key_terms_lemmatized: [(int, str)], lemmas: [str], message_id: int, chatbot_sid: int, user_id: int, module_id: int, update_db=True):
    '''
        Match lemmas against known key terms/phrases, finding the longest, non-overlapping matches
        - key_terms_lemmatized: [(term_id, lemmatized term/phrase)]
        - lemmas: lemmatized tokens of the user's message

        Returns dict: term_id -> times_found
    '''
    if DEBUG_TRACING_FLAG:
        print("[CHRONOLOGY] 5: Finding matched used terms/phrases at find_used_key_terms()")

    global CURRENT_MODULE_ID

    A = get_automaton_for_module(CURRENT_MODULE_ID, key_terms_lemmatized)
    text = " ".join(lemmas).strip()
    if not text:
        # update_message_key_term_count(0, message_id)
        return {}

    # Find all (start,end) indexes for matched term/phrases
    matches = []
    for end_index, (term_id, term_phrase) in A.iter(text):
        start_index = end_index - len(term_phrase) + 1
        matches.append((start_index, end_index, term_id, term_phrase))

    # prefer the longest matches first, then earlier start
    matches.sort(key=lambda x: (-(x[1] - x[0] + 1), x[0]))

    occupied = set()
    words_found = defaultdict(int)
    total_count = 0

    # Match UNIQUE matches
    for start, end, term_id, term_phrase in matches:
        overlap = False
        for pos in range(start, end + 1):
            if pos in occupied:
                overlap = True
                break
        if overlap:
            continue

        for pos in range(start, end + 1):
            occupied.add(pos)

        if not update_db:
            print(f'matched word {term_phrase}')
            updateMisspellings(user_id, module_id, term_id)
            return {}

        words_found[term_id] += 1
        total_count += 1
        
        if SYSTEM_LOGGING_FLAG:
            print(f"Matched '{term_phrase}' (id={term_id}) at pos {start}-{end}")

    updateMessageKeytermCount(total_count, message_id, chatbot_sid)

    return dict(words_found)

def get_automaton_for_module(module_id: int, key_terms_lemmatized: [(int, str)]):
    '''
        Returns a cached automaton for the module, or builds it if it doesn't aready exist.
    '''
    if DEBUG_TRACING_FLAG:
        print("[CHRONOLOGY] 6: Fetching/Updating automatons @ get_automaton_for_module()")

    if module_id in MODULE_AUTOMATA:
        return MODULE_AUTOMATA[module_id]

    A = ahocorasick.Automaton()
    for term_id, term_phrase in key_terms_lemmatized:
        A.add_word(term_phrase, (term_id, term_phrase))

    A.make_automaton()
    MODULE_AUTOMATA[module_id] = A
    return A

def spacy_service():
    '''
        Core service to handle message parsing while there are messages to parse in the Queue.
        Sleeps when Queue is empty.
    '''
    if DEBUG_TRACING_FLAG or SYSTEM_LOGGING_FLAG:
        print("[START] Waking up spacy_service()")
    while True:
        message, module_id, user_id, message_id, chatbot_sid, update_db = MESSAGE_QUEUE.get()
        if SYSTEM_LOGGING_FLAG:
            print(f"[INFO] started processing message {message_id}")
        

        try:
            if DEBUG_TRACING_FLAG:
                print("[CHRONOLOGY] 1: Beginning to process message")

            matches = process_message(message, module_id, user_id, message_id, chatbot_sid, update_db)
            if update_db:
                if SYSTEM_LOGGING_FLAG:
                    print(f"[INFO] printing matches: {matches}")
                if DEBUG_TRACING_FLAG:
                    print("[CHRONOLOGY] END OF MESSAGE PROCESSING: Updating used key terms/phrases @ update_words_used()")
                updateWordsUsed(matches, user_id, module_id)
        except Exception as e:
            print(f"[ERROR] Failure occurred while trying to process message in spacy_service.py: error: {e}")
        finally:
            MESSAGE_QUEUE.task_done()

print("STARTING SPACY SERVICE")
threading.Thread(target=spacy_service, daemon=True).start()




