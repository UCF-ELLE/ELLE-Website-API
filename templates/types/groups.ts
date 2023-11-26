import { PermissionGroup } from "./users";

export type Group = {
    groupID: number;
    groupName: string;
    groupCode: string;
}

export type GroupModule = {
    moduleID: number;
    groupID: number;
}

export type GroupUser = {
    userID: number;
    username: string;
    accessLevel: PermissionGroup;
}
