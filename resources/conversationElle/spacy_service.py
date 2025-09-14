import spacy
from spacy import util, Language
import queue
import threading
import time
from collections import Counter
from .database import *

'''
    This is a SINGLE-THREADED background process to lemmatize singles messages at a time 
        and may also compare those tokens to key-terms from a module's associated terms.

    All that is required to awaken this process is to add a message to the queue, 
        the process shall sleep once finished

    NOTE: Caching language models (pre-loading) vs Lazy-loading
        Currently using lazy-loading, but consider pre-loading if enough resources exists 
            AND/OR the Tito service has a lot of varied traffic with different languages in the future
'''

# TODO: predownload spacy language models on ELLE server
# Map 2-letter codes to spaCy model names
SPACY_MODELS = {
    "en": "en_core_web_sm",
    "es": "es_core_news_sm",
    "fr": "fr_core_news_sm",
    "de": "de_core_news_sm",
    "zh": "zh_core_web_sm",  # Chinese
    # TODO: extend for other models
}

DEFAULT_LANGUAGE_CODE = "en" # english
# current_language_model = SPACY_MODELS[DEFAULT_LANGUAGE_CODE] # "en_core_web_sm", currently unused

nlp = spacy.load(SPACY_MODELS[DEFAULT_LANGUAGE_CODE])

current_language = DEFAULT_LANGUAGE_CODE
current_module_id = 0
current_key_terms = []  # list of tuples: (term_str, term_id)
current_key_terms_lemmatized = [] # same as above, but lemmatized

# Holds the messages to be parsed
message_queue = queue.Queue()



def add_message(message: str, module_id: int, user_id: int, message_id: int):
    '''
        Push a (message, module_id, user_id, message_id) tuple into the queue.
    '''
    message_queue.put((message, module_id, user_id, message_id))
    print(f"[QUEUE] Added message for user {user_id} to process for key terms")

def load_language(lang_code: str):
    '''
        Loads another spaCy model for the given language code ONLY IF its is currently NOT loaded.
            Falls back to English if unsupported.
    '''
    global current_language, nlp

    # model_name = SPACY_MODELS[lang_code]

    if lang_code != current_language:
        try:
            print(f"[INFO] Trying to load spaCy model '{SPACY_MODELS[lang_code]}' for language '{lang_code}'")
            nlp = spacy.load(SPACY_MODELS[lang_code])
            current_language = lang_code
            print(f"[INFO] Loaded spaCy model '{SPACY_MODELS[lang_code]}' for language '{lang_code}'")
        except OSError:
            print(f"[WARN] Failed while loading model '{SPACY_MODELS[lang_code]}'.Falling back to '{DEFAULT_LANGUAGE_CODE}'. \n{e}")
            nlp = spacy.load(SPACY_MODELS[DEFAULT_LANGUAGE_CODE])
            current_language = DEFAULT_LANGUAGE_CODE

def process_message(message: str, module_id: int, user_id: int, message_id: int):
    '''
    4-step process:
        1. Check if module is currently loaded in to prevent unnecessary lookups and update key-terms as needed
        2. Check if the currently loaded language is correct, update nlp as needed
        3. Run spaCy on new key-terms and messages
        4. Match key terms to messages
    '''
    global current_module_id, current_key_terms, current_key_terms_lemmatized
    print(f"[INFO] Loaded method: process_message")

    update_key_term_flag = False

    # 1. Ensure module is set, should run on the first time since module_id=0 DNE
    if module_id != current_module_id:
        update_key_term_flag = True

        print(f"[INFO] Loading language {getModuleLanguage(module_id)[0]}")

        # 2. Ensures right language model is set up
        load_language(getModuleLanguage(module_id)[0])
        print(f"[INFO] Loaded language {getModuleLanguage(module_id)[0]}")


        current_key_terms = getModuleTerms(module_id)
        current_module_id = module_id
        print(f"[INFO] Loaded key terms for module {module_id}")
        print(f"[INFO] Terms loaded: \n{current_key_terms}")

    # 3. spaCy parsing
    doc = nlp(message)
    print(f"[INFO] Lemmatizing message")

    lemmas = [token.lemma_.lower() for token in doc]
    print(f"[INFO] lemmatized: \n{lemmas}")


    # 3.1 lemmatize new key terms if new module
    # TODO: figure out how to lemmatize the list of lists
    print(f"[INFO] Updating key terms:")

    if update_key_term_flag or not current_key_terms_lemmatized:
        current_key_terms_lemmatized = lemmatize_terms(current_key_terms, nlp)
        update_key_term_flag = False
        print(f"[INFO] Key terms lemmatized: \n{current_key_terms_lemmatized}")

    # 4. Find matches and update in the DB
    print(f"[INFO] Updating key terms matches:")
    matches = find_used_key_terms(current_key_terms_lemmatized, lemmas, message_id)

    return matches
    # print(f"[RESULT] Message='{message}' → Matches={matches}")

def lemmatize_terms(terms: [str], nlp: Language):
    '''
        terms: list of [id, term]
        returns: list of (id, lemmatized_term)
    '''
    lemmatized = []
    for term_id, term_phrase in terms:
        doc = nlp(term_phrase) # May be a single word or a phrase
        # when a term is a phrase/multi-word term -> "w1 w2 w3..."
        lemma = " ".join([token.lemma_.lower() for token in doc])
        lemmatized.append((term_id, lemma))
    return lemmatized


def find_used_key_terms(key_terms_lemmatized, lemmas: [str], message_id: int):
    '''
        Match lemmas against known key terms.
        Returns dict: term_id -> times_found
    '''

    lemma_counts = Counter(lemmas)
    words_found = {}
    count = 0

    # TODO: Implement variable length support for messages that use PHRASE LENGTH keyterms
    # Currently checks for individual keyterms
    for term_id, term_lemma in key_terms_lemmatized:
        if term_lemma in lemma_counts:
            words_found[term_id] = lemma_counts[term_lemma]
            count += lemma_counts[term_lemma]

    print(f"[INFO] Updating key term counts: {count}")

    update_message_key_term_count(count, message_id)
    return words_found



def spacy_service():
    '''
        Core service to handle message parsing while there are messages to parse in the Queue.
        Sleeps when Queue is empty.
    '''
    while True:
        message, module_id, user_id, message_id = message_queue.get()

        try:
            matches = process_message(message, module_id, user_id, message_id)
            update_words_used(matches, user_id, module_id)
        except Exception as e:
            print(f"[ERROR] Failure occurred while trying to process message: {e}")
        finally:
            message_queue.task_done()

threading.Thread(target=spacy_service, daemon=True).start()



# # DOWNLOADING spacy LANGUAGE SUPPORT
# # python -m spacy download en_core_web_sm
# # en_core_web_trf
# # python -m spacy download fr_core_news_sm
# # python -m spacy download es_core_news_sm

