export type LoggedAnswer = {
    logID: number;
    questionID?: number;
    termID?: number;
    sessionID?: number;
    correct?: boolean;
    mode: string;
    log_time?: string;
    deleted_questionID?: number;
    deleted_termID?: number;
}

export type Answer = {
    questionID: number;
    termID: number;
}

export type MultipleChoiceAnswer = {
    multipleChoiceID: number;
    questionID: number;
    answerChoice?: string;
}
