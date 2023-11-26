import { LoggedAnswer } from "./answers";

export type Session = {
    sessionID: number;
    userID: number;
    moduleID?: number;
    sessionDate?: string;
    playerScore?: number;
    startTime?: string;
    endTime?: string;
    platform?: string;
    mode: string;
    deleted_moduleID?: number;
}

export type SessionLog = {
    session: Session;
    loggedAnswers: LoggedAnswer[];
}

export type EndSessionInfo = {
    sessionID: number;
    endTime: string;
    playerScore: number;
}
