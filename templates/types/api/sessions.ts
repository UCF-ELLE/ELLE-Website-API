// GET /elleapi/searchsessions
// GET /elleapi/getallsessions
export type Session = {
    sessionID: number;
    moduleID: number;
    userID: number;
    sessionDate: string;
    playerScore: number;
    startTime: string;
    endTime: string;
    platform: string;
    mode?: string;
}

// GET /elleapi/session
export type APISession = {
    session: Session;
    logged_answers: LoggedAnswer[];
}

export type LoggedAnswer = {
    logID: number;
    questionID: number;
    termID: number;
    sessionID: number;
    correct: boolean;
    mode: string;
}
