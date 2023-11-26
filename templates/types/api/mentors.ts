// GET /elleapi/studentresponses
export type StudentResponse = {
    mentorResponseID: number;
    questionID: number;
    sessionID: number;
    response?: string;
}

// POST /elleapi/getmentorquestions
// I don't know why this is a POST
export type MentorQuestion = {
    questionID: number;
    type: string;
    questionText: string;
}

// POST /elleapi/getmultiplechoiceoptions
// Again, I don't know why this is a POST
export type MultipleChoiceOption = {
    multipleChoiceID: number;
    questionID: number;
    answerChoice?: string;
}

// POST /elleapi/getmentorquestionfrequency
// Again, I don't know why this is a POST
export type MentorQuestionFrequency = {
    incorrectCardsFreq: number;
    correctCardsFreq: number;
    time: string;
    moduleID: number;
}
