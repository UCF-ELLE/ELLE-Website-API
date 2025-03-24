import string

def begin_function(text: str) -> str:
    return "Hello, my name is Tito! What would you like to talk about today? Please make sure to chat in the language your professor assigned!"

def count_words(text: str, vocab_list: list, vocab_dict=None) -> dict:
    '''
    This function counts the words used in a given string and stores
    the number of times each vocabulary word is used using a dictionary
    data structure.

    Parameters:
        text: String corresponding to the text inputted to the LLM
        vocab_list: List corresponding to the required vocabulary word list
        vocab_dict: Dictionary of existing word usage from previous sessions

    Returns:
        Dictionary in the form: {vocab_word: number of times used}
    '''
    # Initialize new dict
    if vocab_dict == None:
        new_vocab_dict = {word: 0 for word in vocab_list}
    
    # Previous chats exist
    # Case that teacher has added edited vocab_list
    else:
        new_vocab_dict = {}
        for word in vocab_list:
            try:
                new_vocab_dict[word] = vocab_dict[word]
            except:
                new_vocab_dict[word] = 0
    
    # Parse string to see if vocab word was used
    # Appends to counter regardless of punctuation and capitalization
    clean_text = ''.join([char for char in text if char not in string.punctuation])
    for word in clean_text.split(" "):
        if any(vocab_word.lower() == word.lower() for vocab_word in vocab_list):
            new_vocab_dict[word] += 1
    
    return new_vocab_dict

def vocab_dict_to_list(vocab_dict: dict):
    '''
    This function converts a dictionary to a list in the format specific for frontend.
    If word has been used (more than 0 times) will return that word as part of vocab_list.

    Parameters:
        vocab_dict: Dictionary of existing word usage from previous sessions

    Returns:
        vocab_list: List corresponding to the required vocabulary word list
    '''
    vocab_list = []
    for word, value in vocab_dict.items():
        if value > 0:
            vocab_list.append(word)
    return vocab_list
