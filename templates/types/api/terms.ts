import { Gender, LanguageCode } from '../misc';
import { DBTag, DBTerm } from './db';
// GET /elleapi/term
// GET /elleapi/tag_term
// GET /elleapi/specific_term
export type Term = DBTerm & {
    imageLocation?: string;
    audioLocation?: string;
};

// GET /elleapi/tags
// GET /elleapi/tags_in_term
// For some reason the API returns a list of strings instead of a list of DBTag
export type Tag = string;

// GET /elleapi/tagcount
export type TagCount = {
    [tagName: string]: number;
};
