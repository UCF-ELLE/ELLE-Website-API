import { DBLoggedAnswer, DBTerm } from './db';

// GET /elleapi/loggedanswer
export type LoggedAnswer = Pick<DBLoggedAnswer, 'logID' | 'questionID' | 'termID' | 'sessionID' | 'correct' | 'mode'> & Pick<DBTerm, 'front'>;
