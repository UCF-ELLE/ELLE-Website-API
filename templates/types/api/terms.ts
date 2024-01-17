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
export type Tag = Omit<DBTag, 'tagID'>;

// GET /elleapi/tagcount
export type TagCount = {
    [tagName: string]: number;
};
