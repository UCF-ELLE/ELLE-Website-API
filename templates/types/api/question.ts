// GET /elleapi/searchbytype
// GET /elleapi/searchbytext

import { DBAnswer, DBQuestion } from './db';

// GET /elleapi/question
export type Question = DBQuestion & {
    imageLocation?: string;
    audioLocation?: string;
    answers?: DBAnswer['termID'][];
};
