import { Group } from './groups';
import { Session } from './sessions';

export type PermissionGroup = 'st' | 'ta' | 'pf' | 'su';

export type User = {
    userID: number;
    username: string;
    jwt?: string;
    email?: string;
    permissionGroup: PermissionGroup;
    groups?: Pick<Group, 'groupID' | 'groupName' | 'groupCode'>[];
};

export type UserInfo = {
    userID: number;
    username: string;
    permissionGroup: PermissionGroup;
    email: string;
    sessions?: Session[];
};

export type SignUpInfo = {
    email: string;
    username: string;
    password: string;
    password_confirm: string;
    groupCode: string;
};

export type UserGroup = {
    groupID: number;
    groupName: string;
    groupCode: string;
};

export type ResetPasswordInfo = {
    emaiL: string;
    resetToken: string;
    password: string;
    confirmPassword: string;
};

export type UserScore = {
    score: number;
    usernames: string;
}

export type UserLevel = {
    groupID: number;
    groupName: string;
    accessLevel: number;
}

export type UserPreference = {
    userPreferenceID: number;
    userID: number;
    preferredHand: string;
    vrGloveColor: string;
}
