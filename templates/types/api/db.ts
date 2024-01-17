import { Gender, LanguageCode, PermissionGroup } from '../misc';

export type DBAnimelleSaveData = {
    saveID: number;
    userID: number;
    saveData?: string;
};

export type DBGroup = {
    groupID: number;
    groupName: string;
    groupCode: string;
};

export type DBGroupUser = {
    userID: number;
    groupID: number;
    accessLevel: PermissionGroup;
};

export type DBUser = {
    userID: number;
    username: string;
    password: string;
    pwdResetToken?: string;
    permissionGroup: PermissionGroup;
    otc?: string;
    email?: string;
};

export type DBLoggedAnswer = {
    logID: number;
    questionID?: number;
    termID?: number;
    sessionID?: number;
    correct?: boolean;
    mode: string;
    log_time?: string;
    deleted_questionID?: number;
    deleted_termID?: number;
};

export type DBTerm = {
    termID: number;
    imageID?: number;
    audioID?: number;
    front?: string;
    back?: string;
    type?: string;
    gender: Gender;
    language?: LanguageCode;
};

export type DBMentorResponse = {
    mentorResponseID: number;
    questionID: number;
    sessionID: number;
    response?: string;
    deleted_questionID?: number;
};

export type DBQuestion = {
    questionID: number;
    audioID?: number;
    imageID?: number;
    type?: string;
    questionText?: string;
};

export type DBModuleQuestion = {
    moduleID: number;
    questionID: number;
};

export type DBMultipleChoiceOption = {
    multipleChoiceID: number;
    questionID: number;
    answerChoice?: string;
};

export type DBMentorQuestionFrequency = {
    ID: number;
    numIncorrectCards?: number;
    numCorrectCards?: number;
    time?: number;
    moduleID: number;
};

export type DBModule = {
    moduleID: number;
    name?: string;
    language: LanguageCode;
    complexity?: number;
    userID: number;
};

export type DBTag = {
    termID: number;
    tagName: string;
};

export type DBAnswer = {
    questionID: number;
    termID: number;
};

export type DBSession = {
    sessionID: number;
    userID: number;
    moduleID?: number;
    sessionDate?: string;
    playerScore?: number;
    startTime?: string;
    endTime?: string;
    platform?: string;
    mode: string;
    deleted_moduleID?: number;
};

export type DBUserPreferences = {
    userPreferenceID: number;
    userID: number;
    preeferredHand: 'R' | 'L' | 'A' | '';
    vrGloveColor: string;
};
