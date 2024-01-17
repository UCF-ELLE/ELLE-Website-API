import { Gender, LanguageCode } from '../misc';
import { LoggedAnswer } from './logged_answer';
import { Session } from './sessions';

// GET /elleapi/modulereport
export type ModuleReport = Session & { logged_answers: LoggedAnswer[] }[];

// GET /elleapi/modulestats
// GET /elleapi/allmodulestats
export type ModuleStats = {
    averageScore: number;
    averageSessionLength: number;
    platform?: string;
    moduleID?: number;
    name?: string;
};

// GET /elleapi/platformstats
export type PlatformStats = {
    [platform: string]: {
        frequency: number;
        total_score: number;
        time_spent: number;
        avg_score: number;
        avg_time_spent: number;
        total_records_avail: number;
    };
};

// GET /elleapi/termsperformance
export type TermPerformance = {
    [loggedAnswerTermID: number]: {
        correctness: number;
        count: number;
        modules: {
            [moduleID: number]: string;
        };
        front: string;
        back: string;
        type: string;
        gender: Gender;
        language: LanguageCode;
    };
};

// GET /elleapi/languagestats
export type LanguageStats = {
    [languageCode in LanguageCode]: number;
};
