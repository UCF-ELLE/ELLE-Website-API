import axios, { AxiosInstance } from 'axios';
import { jwtDecode } from 'jwt-decode';
// import type { PermissionGroup, User, UserInfo, SignUpInfo } from '@/types/users';
import { ApiError, ApiMessage, PermissionGroup } from '@/types/misc';
import { User } from '@/types/api/user';
import { AuthUser, UserRegisterInfo } from '@/types/services/auth';

type decodedJWT = {
    user_claims: {
        permission: PermissionGroup;
    };
    identity: string;
};

export default class AuthService {
    protected readonly instance: AxiosInstance;
    public constructor() {
        this.instance = axios.create({
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    login = async (username: string, password: string) => {
        try {
            const res = await this.instance.post('/elleapi/login', {
                username,
                password
            });

            console.log('login response', res.data);

            const decoded = jwtDecode(res.data.access_token) as decodedJWT;
            const permission = decoded.user_claims.permission;
            const userID = Number(decoded.identity);
            return {
                jwt: res.data.access_token,
                username,
                userID,
                permissionGroup: permission
            } as AuthUser;
        } catch (err: any) {
            if (err.response !== undefined) {
                console.log('login error', err.response.data);
                return { error: err.response.data.Error } as ApiError;
            }
        }
    };

    signup = async (data: UserRegisterInfo): Promise<ApiMessage | ApiError> => {
        try {
            const res = await this.instance.post<ApiMessage>('/elleapi/register', data);
            return res.data;
        } catch (err) {
            console.log('signup error', err);

            let errorMessage = 'Signup failed';
            if (err instanceof Error) {
                errorMessage = err.message;
            }
            return { error: errorMessage } as ApiError;
        }
    };

    getUserInfo = async (jwt: string) => {
        try {
            const res = await this.instance.get('/elleapi/user', {
                headers: {
                    Authorization: 'Bearer ' + jwt
                }
            });

            const values: User = {
                userID: res.data.id,
                username: res.data.username,
                email: res.data.email === null ? '' : res.data.email,
                permissionGroup: res.data.permissionGroup
            };

            return values;
        } catch (err: any) {
            console.log('getUserInfo error', err.response.data);
            return { error: err.response.data.Error } as ApiError;
        }
    };
}
