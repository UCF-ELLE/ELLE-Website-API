import { PermissionGroup } from '../misc';
import { DBGroup, DBUser, DBGroupUser } from './db';

// GET /elleapi/searchusergroups
export type UserGroup = DBGroup & {
    accessLevel: PermissionGroup;
    group_users: GroupUser[];
};

// GET /elleapi/usersingroup
export type GroupUser = Pick<DBUser, 'userID' | 'username'> & Pick<DBGroupUser, 'accessLevel'>;
