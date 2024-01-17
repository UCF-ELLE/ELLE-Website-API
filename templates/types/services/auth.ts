import { PermissionGroup } from '../misc';

export type UserRegisterInfo = {
    username: string;
    email?: string;
    password: string;
    password_confirm: string;
    groupCode?: string;
};

export type AuthUser = {
    jwt: string;
    username: string;
    userID: number;
    permissionGroup: PermissionGroup;
};
