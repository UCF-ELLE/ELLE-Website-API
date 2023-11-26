// GET /elleapi/loggedanswer
export type LoggedAnswer = {
    logID: number;
    questionID?: number;
    termID?: number;
    sessionID?: number;
    correct?: boolean;
    mode: string;
    front?: string;
}
