import { UserGroup } from "./group";

export type PermissionGroup = 'st' | 'ta' | 'pf' | 'su';

// GET /elleapi/users
// GET /elleapi/user
export type User = {
    /** @deprecated Use userID instead */ id?: number
    userID?: number;
    username: string;
    permissionGroup: PermissionGroup;
    email?: string;
    groups?: UserGroup
}
