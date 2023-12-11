// GET /elleapi/searchbytype
// GET /elleapi/searchbytext
// GET /elleapi/question
export type Question = {
    questionID: number;
    audioID?: number;
    audioLocation?: string;
    imageID?: number;
    imageLocation?: string;
    type: string;
    questionText: string;
    answers?: string[];
}
