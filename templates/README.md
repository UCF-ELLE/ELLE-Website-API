# refinedELLEWebPortal

### Module Page Functions 
----Module----
- [x] searchModules()
- [x] searchCards()
- [x] addModule() : all fields must be filled out otherwise highlight the field that is not filled out 
- [x] include dropdown list of languages (2 char format) that users can choose from 
- [x] editModule() : modal popup for the user to edit the name of the module // editing the language is forbidden 
- [x] deleteModule() : modal popup for user handling to double check if the user still wants to delete the module 

----Term----
- [x] addCard() : depends on module type, should include validation for the front/back field of the card, the tag, picture, and audio fields are optional. (3 different types of card forms need to be made.)
- [x] include dropdown options for term types and gender 
- [x] addExistingTerms() : be able to add existing terms under the same language as the module to the term tab
- [x] editCard() : modal popup for the user to edit the front/back of the card, and to edit the picture/audio file. 
- [x] editTags() : edit the tags for each term in edit mode  
- [x] deleteCard() : modal popup for user handling to double check if the user still wants to delete the card 
- [x] downloadImage() needs more testing when site is deployed
- [x] downloadAudio() needs more testing when site is deployed

----Phrase----
- [x] addPhrase() : add a new phrase 
- [x] editPhrase() : edit the fields of the phrase 
- [x] deletePhrase() : modal popup for user handling to double check if the user still wants to delete the phrase
- [x] downloadImage() needs more testing when site is deployed
- [x] downloadAudio() needs more testing when site is deployed

----Form Validation when adding Modules and Terms---- 
WILL THESE FUNCTIONS BE INEFFICIENT? 
//will not include because we do not want to limit the users from using the same names for modules 
- [ ] traverse through the modules array to check if that module name is taken already or not // or does this work like autocomplete? 
- [ ] traverse through the terms array for that specific module to see if it exists already

---- Question ----
- [ ] Need to clear up the code for adding a Question, might need an API call to simplify this functionality 

---- Other ----
- [x] Figure out new layout of organizing each individual Module to reflect the new database 
- [x] Super tiny fix: include module name next to the search bar on the card list side 
- [x] Move module info above the forms when the collapse is open 
- [x] Add information icon to inform users what the tag functionality is all about 
- [x] Add a handbook for admin users to understand how the games will utilize the terms in the module and how to maximize their student's experience when playing the games
- [ ] Find bugs on the modules page and fix them (especially those regarding tags and questions) 
- [ ] Figure out a good design/layout for ELLE Downloads Page

### Stat Page Functions
- TBD 

### UserList Page Functions
- TBD 

### Profile Page 
- [ ] Finish up word of the day ??? Maybe/probably not adding this 
- [x] Include class invite code for professors/TAs
- [x] Include add additional class functionality for students 
- [x] Color Code the modules based on how they are performing 
- [x] Finish the student lookup functionality for professors 
- [ ] Request for an API to get how students are doing relative to their classmates (leaving this for the future group to implement)

### Register Page 
- [x] Create a randomizer for usernames, need an API call for this
- [x] Include add class functionality for students 

## Useful Resources 
### API 
- https://documenter.getpostman.com/view/11718453/Szzhdy4c?version=latest#50bd0f7c-2580-4aa5-b47f-856251cd49e5
- https://docs.google.com/document/d/1aiQBnWNgU0gbnhKs8gcCMAhAvQbg8qeuwIkITDbRRg8/edit
- https://alligator.io/react/axios-react/

### Database Fields and Inputs For Cards 
- Terms, words and their translations along with other information
  - Types:
    - NN  (Noun)
    - VR  (Verb)
    - AJ  (Adjective)+
    - AV  (Adverb)
    - PH  (Phrase)

  - Genders:
    - MA (Male)
    - FE (Female)
    - NA (Nongendered)

- Front/Back clarification
  - Front is the word in the foreign language (prompt),
  - Back is the word in the native language (answer)

  - Types:
    - MATCH       (Base type, uses a term as the question prompt, only one answer)
    - PHRASE      (Identical to MATCH, but for whole phrases, only one answer)
    - IMAGE       (Select a word corresponding to an image, may have multiple answers)
    - AUDIO       (Select a word corresponding to audio, may have multiple answers)
    - LONGFORM    (Questions with a full text prompt, may have multiple answers)

### Reactjs Knowledge 
#### React Life Cycle Diagram 
- https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/
#### Other
- https://www.youtube.com/watch?v=M-X0Jw2e68A&t=553s
#### React Redux 
- Should we consider it? 
- https://daveceddia.com/what-does-redux-do/
