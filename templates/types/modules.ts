import languageCode from '@/public/static/json/languageCodes.json'

export type LanguageCode = keyof typeof languageCode

export type Module = {
    moduleID: number;
    name: string;
    language: LanguageCode;
    complexity: string;
    userID: number;
    groupID?: number;
    owned?: boolean;
    username?: string;
}

export type DeletedModule = {
    moduleID: number;
    name: string;
    language: LanguageCode;
    complexity?: string;
    userID?: number;
}

export type ModuleQuestion = {
    moduleID: number;
    questionID: number;
}
