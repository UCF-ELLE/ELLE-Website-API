
export type MentorQuestion = {
    questionID: number;
    type: string;
    questionText: string;
}

export type MentorQuestionFrequency = {
    ID: number;
    numIncorrectCards?: number;
    numCorrectCards?: number;
    time?: string;
    moduleID: number;
}

export type MentorPreference = {
    mentorPreferenceID: number;
    userID: number;
    mentorName?: string;
}

export type MentorResponse = {
    mentorResponseID: number;
    questionID: number;
    sessionID: number;
    response?: string;
    deleted_questionID?: number;
}
