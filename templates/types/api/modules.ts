import { DBAnswer, DBModule, DBQuestion, DBTerm } from './db';
import { Tag } from './terms';

// GET /elleapi/modules
// GET /elleapi/retrievegroupmodules
// GET /elleapi/searchmodules
// GET /elleapi/retrieveusermodules
// GET /elleapi/module
// GET /elleapi/retrieveallmodules
export type Module = DBModule & {
    groupID?: number;
    owned?: boolean;
    username?: string;
};

// POST /elleapi/modulequestions
export type ModuleQuestion = Pick<DBQuestion, 'questionID' | 'type' | 'questionText'> & {
    audioLocation?: string;
    imageLocation?: string;
    answers?: ModuleQuestionAnswer[];
};

export type ModuleQuestionAnswer = Pick<DBAnswer, 'termID'> &
    Pick<DBTerm, 'front' | 'back' | 'type' | 'gender' | 'language'> & {
        imageLocation?: string;
        audioLocation?: string;
        tags?: Tag[];
    };
