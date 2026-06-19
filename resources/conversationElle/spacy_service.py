import spacy
from spacy import Language

import queue
import threading
from collections import defaultdict
import re
import itertools

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
    "ca": "ca_core_news_sm",  # Catalan; Valencian
    "zh": "zh_core_web_sm",   # Chinese
    "hr": "hr_core_news_sm",  # Croatian
    "da": "da_core_news_sm",  # Danish
    "nl": "nl_core_news_sm",  # Dutch; Flemish
    "en": "en_core_web_sm",   # English
    "fi": "fi_core_news_sm",  # Finnish
    "fr": "fr_core_news_sm",  # French
    "de": "de_core_news_sm",  # German
    "el": "el_core_news_sm",  # Greek
    "it": "it_core_news_sm",  # Italian
    "ja": "ja_core_news_sm",  # Japanese
    "ko": "ko_core_news_sm",  # Korean
    "lt": "lt_core_news_sm",  # Lithuanian
    "mk": "mk_core_news_sm",  # Macedonian
    "nb": "nb_core_news_sm",  # Norwegian Bokmål
    "pl": "pl_core_news_sm",  # Polish
    "pt": "pt_core_news_sm",  # Portuguese
    "ro": "ro_core_news_sm",  # Romanian
    "ru": "ru_core_news_sm",  # Russian
    "sl": "sl_core_news_sm",  # Slovenian
    "es": "es_core_news_sm",  # Spanish
    "sv": "sv_core_news_sm",  # Swedish
    "uk": "uk_core_news_sm",  # Ukrainian
} # Expand later down the line if newer models come out

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
            return {}

        # Can't process messages whose language models don't exist
        if not SPACY_MODELS.get(getModuleLanguageCode(module_id), None):
            print("Error in retrieving spacy module for this language")
            return {}

        MESSAGE_QUEUE.put((message, module_id, user_id, message_id, chatbot_sid, update_db))
    except Exception as err:
        print("[ERROR] Failure occurred while trying to process message in spacy_service.py:", err)
        import traceback; traceback.print_exc()
        return {}  # <- IMPORTANT: don't crash the worker thread

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
                print(f"[INFO] Trying to load spaCy model '{SPACY_MODELS.get(lang_code, DEFAULT_LANGUAGE_CODE)}' for language '{lang_code}'")
            
            NLP = spacy.load(SPACY_MODELS.get(lang_code, DEFAULT_LANGUAGE_CODE))
            CURRENT_LANGUAGE = lang_code

            if SYSTEM_LOGGING_FLAG:
                print(f"[INFO] NLP in use {NLP}")
                print(f"[INFO] Loaded spaCy model '{SPACY_MODELS.get(lang_code, DEFAULT_LANGUAGE_CODE)}' for language '{lang_code}'")
        except Exception as e:
            print(f"[WARN] Failed while loading model '{SPACY_MODELS.get(lang_code, DEFAULT_LANGUAGE_CODE)}'.Falling back to '{DEFAULT_LANGUAGE_CODE}'. \n{e}")
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

    matches = find_used_key_terms(CURRENT_KEY_TERM_PHRASES_LEMMATIZED, lemmas, message_id, chatbot_sid, user_id, module_id, update_db, message=message)

    return matches

def get_word_variations(word: str, lang: str) -> list[str]:
    # 1. Slash expansion
    parts = []
    for part in word.split():
        if '/' not in part:
            parts.append([part])
            continue
        segments = part.split('/')
        base = segments[0]
        suffixes = segments[1:]
        options = [base]
        
        vowels = set("aeiouáéíóúüñàèìòùâêîôûçäëïöüßAEIOUÁÉÍÓÚÜÑÀÈÌÒÙÂÊÎÔÛÇÄËÏÖÜß")
        is_vowel = lambda c: c in vowels
        
        for suffix in suffixes:
            if len(suffix) >= len(base) - 1 or len(base) <= 2 or suffix.lower() in {'la', 'una', 'un', 'les', 'des'}:
                options.append(suffix)
            else:
                ends_with_vowel = is_vowel(base[-1]) if base else False
                if ends_with_vowel and suffix and is_vowel(suffix[0]):
                    options.append(base[:-1] + suffix)
                else:
                    options.append(base + suffix)
        parts.append(options)

    # Cartesian product for slash expansion
    phrases = []
    for combo in itertools.product(*parts):
        phrases.append(" ".join(combo))

    final_variations = set()
    l = lang.lower()

    for phrase in phrases:
        final_variations.add(phrase)
        
        phrase_words = phrase.split()
        inflected_words = []
        for w in phrase_words:
            w_opts = {w}
            length = len(w)
            if length <= 2:
                inflected_words.append(list(w_opts))
                continue
            
            last_char = w[-1].lower()
            
            if l in ('es', 'pt'):
                if last_char == 'o':
                    w_opts.add(w[:-1] + 'a')
                    w_opts.add(w[:-1] + 'os')
                    w_opts.add(w[:-1] + 'as')
                elif last_char == 'a':
                    w_opts.add(w[:-1] + 'o')
                    w_opts.add(w[:-1] + 'as')
                    w_opts.add(w[:-1] + 'os')
                elif last_char == 'e':
                    w_opts.add(w + 's')
                else:
                    w_opts.add(w + 'a')
                    w_opts.add(w + 'es')
                    w_opts.add(w + 'as')
            elif l == 'fr':
                if last_char == 'e':
                    w_opts.add(w + 's')
                else:
                    w_opts.add(w + 'e')
                    w_opts.add(w + 's')
                    w_opts.add(w + 'es')
            else:
                # English or default
                if w.endswith('y') and length >= 2 and not (w[-2] in vowels):
                    w_opts.add(w[:-1] + 'ies')
                else:
                    w_opts.add(w + 's')
                    w_opts.add(w + 'es')
            inflected_words.append(list(w_opts))
            
        for combo in itertools.product(*inflected_words):
            final_variations.add(" ".join(combo))
            
    article_regex = re.compile(r"^(el|la|los|las|un|una|unos|unas|le|les|l'|une|des)\s+", re.IGNORECASE)
    for variant in list(final_variations):
        if article_regex.match(variant):
            final_variations.add(article_regex.sub("", variant))
            
    return list(final_variations)

def clean_term_phrase(term_phrase: str):
    '''
    Clean up raw term words/phrases using regex:
      - Trim word endings like "naranjo/a" -> "naranjo"
      - Leave spaced slashes ("apples / oranges") untouched
      - Convert isolated "/word" -> ""
    '''
    term_phrase = re.sub(r"(\w+)/\w+\b", r"\1", term_phrase)
    return term_phrase.strip()

def lemmatize_terms(terms: [(int, str)], nlp: Language):
    '''
        terms: list of [id, term]
        returns: list of (id, lemmatized_term)
    '''
    if DEBUG_TRACING_FLAG:
        print("[CHRONOLOGY] 4: Lemmatizing key terms/phrases at lemmatize_terms()")

    lemmatized = []
    lang = getattr(nlp, "lang", "es")
    for term_id, term_phrase in terms:
        variations = get_word_variations(term_phrase, lang)
        for var in variations:
            # 1. Add raw normalized variation
            clean_var = re.sub(r"[^\w\sáéíóúüñàèìòùâêîôûçäëïöüß]", " ", var.lower())
            clean_var = " ".join(clean_var.split())
            if clean_var:
                lemmatized.append((term_id, clean_var))
            
            # 2. Add lemmatized variation
            doc = nlp(var)
            lemma = " ".join([token.lemma_.lower() for token in doc])
            clean_lemma = re.sub(r"[^\w\sáéíóúüñàèìòùâêîôûçäëïöüß]", " ", lemma)
            clean_lemma = " ".join(clean_lemma.split())
            if clean_lemma:
                lemmatized.append((term_id, clean_lemma))

    return list(set(lemmatized))

def find_used_key_terms(key_terms_lemmatized: [(int, str)], lemmas: [str], message_id: int, chatbot_sid: int, user_id: int, module_id: int, update_db=True, message=""):
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
    
    texts_to_search = []
    
    # Lemmatized text
    lemmatized_text = " ".join(lemmas).strip()
    if lemmatized_text:
        texts_to_search.append(lemmatized_text)
        
    # Raw normalized text
    if message:
        clean_msg = re.sub(r"[^\w\sáéíóúüñàèìòùâêîôûçäëïöüß]", " ", message.lower())
        clean_msg = " ".join(clean_msg.split())
        if clean_msg:
            texts_to_search.append(clean_msg)

    if not texts_to_search:
        return {}

    # Find all (start,end) indexes for matched term/phrases in all texts
    matches = []
    for text in texts_to_search:
        for end_index, (term_id, term_phrase) in A.iter(text):
            start_index = end_index - len(term_phrase) + 1
            is_start_boundary = (start_index == 0 or not text[start_index - 1].isalnum())
            is_end_boundary = (end_index == len(text) - 1 or not text[end_index + 1].isalnum())
            if is_start_boundary and is_end_boundary:
                matches.append((start_index, end_index, term_id, term_phrase))

    # prefer the longest matches first, then earlier start
    matches.sort(key=lambda x: (-(x[1] - x[0] + 1), x[0]))

    occupied = set()
    words_found = defaultdict(int)
    total_count = 0

    if not matches:
        return {}

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
            if update_db and matches:
                if SYSTEM_LOGGING_FLAG:
                    print(f"[INFO] printing matches: {matches}")
                if DEBUG_TRACING_FLAG:
                    print("[CHRONOLOGY] END OF MESSAGE PROCESSING: Updating used key terms/phrases @ update_words_used()")
                updateWordsUsed(matches, user_id, module_id)
        except Exception as err:
            print("[ERROR] Failure occurred while trying to process message in spacy_service.py:", err)
            import traceback; traceback.print_exc()
            return {}  # <- IMPORTANT: don't crash the worker thread
        finally:
            MESSAGE_QUEUE.task_done()

if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    if TWT_ENABLED:
        print("STARTING SPACY SERVICE")
        threading.Thread(target=spacy_service, daemon=True).start()




