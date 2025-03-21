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
        vocab_dict = {word: 0 for word in vocab_list}
    
    # Case that teacher has added new words
    if not len(vocab_dict.keys()) == len(vocab_list):
        for word in vocab_list:
            if word not in vocab_dict:
                vocab_dict[word] = 0
    
    # Parse string to see if vocab word was used
    clean_text = ''.join([char for char in text if char not in string.punctuation])
    for word in clean_text.split(" "):
        if word in vocab_list:
            vocab_dict[word] += 1
    
    return vocab_dict

