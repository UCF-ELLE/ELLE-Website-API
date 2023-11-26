import { PermissionGroup } from "../users";

// GET /elleapi/searchusergroups
export type UserGroup = {
    groupID: number;
    groupName: string;
    groupCode: string;
    accessLevel: PermissionGroup;
}

// GET /elleapi/usersingroup
export type UserInGroup = {
    userID: number;
    username: string;
    accessLevel: PermissionGroup;
}