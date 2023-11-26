import axios, { AxiosInstance } from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { PermissionGroup, User, UserInfo, SignUpInfo } from '@/types/users';

type decodedJWT = {
    user_claims: {
        permission: PermissionGroup
    };
    identity: string;
}

export type Error = { error: string };

export default class AuthService {
    protected readonly instance: AxiosInstance;
    public constructor() {
        this.instance = axios.create({
            timeout: 1000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    login = async (username: string, password: string) => {
        try {
            const res = await this.instance.post('/elleapi/login', {
                username,
                password,
            });

            const decoded = jwtDecode(res.data.access_token) as decodedJWT;
            const permission = decoded.user_claims.permission;
            const userID = Number(decoded.identity);
            return {
                jwt: res.data.access_token,
                username,
                userID,
                permissionGroup: permission,
            } as User;
        } catch (err: any) {
            if (err.response !== undefined) {
                console.log('login error', err.response.data);
                return { error: err.response.data.Error } as Error;
            }
        }
    };

    signup = async (data: SignUpInfo) => {
        try {
            const res = await this.instance.post('/elleapi/register', data);
            return res.data;
        } catch (err: any) {
            console.log('signup error', err.response.data);
            return { error: err.response.data.Error } as Error;
        }
    }

    getUserInfo = async (jwt: string) => {
        try {
            const res = await this.instance.get('/elleapi/user', {
                headers: {
                    Authorization: 'Bearer ' + jwt,
                },
            });
            const values: UserInfo = {
                userID: res.data.id,
                username: res.data.username,
                email: res.data.email === null ? '' : res.data.email,
                permissionGroup: res.data.permissionGroup,
            };

            const res2 = await this.instance.get('/elleapi/searchsessions', {
                params: { userID: values.userID },
                headers: { Authorization: 'Bearer ' + jwt },
            });

            values.sessions = res2.data;

            return values;
        }
        catch(err: any) {
            console.log('getUserInfo error', err.response.data);
            return { error: err.response.data.Error } as Error;
        }
    }
}
