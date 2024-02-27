import { DBMentorResponse, DBQuestion, DBMultipleChoiceOption, DBMentorQuestionFrequency } from './db';

// GET /elleapi/studentresponses
export type StudentResponse = Pick<DBMentorResponse, 'mentorResponseID' | 'questionID' | 'sessionID' | 'response'>;

// POST /elleapi/getmentorquestions
// I don't know why this is a POST
export type MentorQuestion = Pick<DBQuestion, 'questionID' | 'type' | 'questionText'>;

// POST /elleapi/getmultiplechoiceoptions
// Again, I don't know why this is a POST
export type MultipleChoiceOption = DBMultipleChoiceOption;

// POST /elleapi/getmentorquestionfrequency
// Again, I don't know why this is a POST
export type MentorQuestionFrequency = {
    incorrectCardsFreq?: DBMentorQuestionFrequency['numIncorrectCards'];
    correctCardsFreq?: DBMentorQuestionFrequency['numCorrectCards'];
    time?: DBMentorQuestionFrequency['time'];
    moduleID: DBMentorQuestionFrequency['moduleID'];
};
