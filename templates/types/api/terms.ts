import { LanguageCode } from "../modules";
import { Gender } from "./misc";

// GET /elleapi/term
// GET /elleapi/tag_term
// GET /elleapi/specific_term
export type Term = {
    termID: number;
    imageID?: number;
    imageLocation?: string;
    audioID?: number;
    audioLocation?: string;
    front: string;
    back: string;
    type: string;
    gender: Gender;
    language: LanguageCode;
}

// GET /elleapi/tags
export type Tag = {
    termID: number;
    tagName?: string;
}

// GET /elleapi/tagcount
export type TagCount = {
    [tagName: string]: number;
}
