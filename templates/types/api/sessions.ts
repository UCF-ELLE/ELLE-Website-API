// GET /elleapi/searchsessions

import { DBSession } from './db';
import { LoggedAnswer } from './logged_answer';

// GET /elleapi/getallsessions
export type Session = Omit<DBSession, 'deleted_moduleID'> & {
    moduleName?: string;
};

// GET /elleapi/session
export type APISession = {
    session: Session;
    logged_answers: LoggedAnswer[];
};

// export type LoggedAnswer = {
//     logID: number;
//     questionID: number;
//     termID: number;
//     sessionID: number;
//     correct: boolean;
//     mode: string;
// }
