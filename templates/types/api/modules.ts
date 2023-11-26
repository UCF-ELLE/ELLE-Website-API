import { Tag } from "./misc";

// GET /elleapi/modules
// GET /elleapi/retrievegroupmodules
// GET /elleapi/searchmodules
// GET /elleapi/retrieveusermodules
// GET /elleapi/module
// GET /elleapi/retrieveallmodules
export type Module = {
    moduleID: number;
    name: string;
    language: string;
    complexity: number;
    userID: number;
    groupID?: number;
    user_id?: number;
    owned?: boolean;
    username?: string;
}

// POST /elleapi/modulequestions
export type ModuleQuestion = {
    questionID: number;
    audioLocation?: string;
    imageLocation?: string;
    type: string;
    questionText: string;
    answers?: ModuleQuestionAnswer[];
}

export type ModuleQuestionAnswer = {
    termID: number;
    imageLocation?: string;
    audioLocation?: string;
    front: string;
    back: string;
    type: string;
    gender: 'F' | 'M' | 'N';
    language: string;
    tags?: Tag['tagName'][];
}
