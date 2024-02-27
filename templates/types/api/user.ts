import { DBUser, DBUserPreferences } from './db';
import { UserGroup } from './group';

// GET /elleapi/users
// GET /elleapi/user
export type User = Pick<DBUser, 'userID' | 'username' | 'permissionGroup' | 'email'> & {
    groups?: Pick<UserGroup, 'groupID' | 'groupName' | 'groupCode'>[];
};

// GET /elleapi/userlevels
export type UserLevel = Pick<UserGroup, 'groupID' | 'groupName' | 'accessLevel'>;

// GET /elleapi/user_preferences
export type UserPreferences = DBUserPreferences;
