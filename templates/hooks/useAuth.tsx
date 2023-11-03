'use client';

import axios, { AxiosRequestConfig } from 'axios';
import React, { PropsWithChildren, createContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/router';

export type AuthContextProps = {
    auth: { status: string; user: any };
};

interface decodedJWT {
    user_claims: {
        permission: 'su' | 'pf' | 'st' | 'ta';
    };
    identity: string;
}

export type AuthContextType = {
    auth: AuthContextProps['auth'];
    login: (
        username: string,
        password: string
    ) => Promise<LoginResponseData | string>;
    getUserInfo: () => Promise<UserInfo | void>;
    logout: () => void;
};

type LoginResponseData = {
    access_token: string;
    id: string;
};

export type UserInfo = {
        userId: string;
        username: string;
        email: string;
        sessions: never[];
}

const signedOutObj = { status: 'SIGNED_OUT', user: null };

const AuthContext = createContext<AuthContextType | null>(null);

export const getUser = () => {
    if (typeof window === 'undefined') return { status: 'UNKNOWN', user: null };

    const jwt = localStorage.getItem('jwt');
    if (!jwt) return signedOutObj;

    const decoded = jwtDecode(jwt) as decodedJWT;

    if (!decoded.identity || !decoded.user_claims.permission) {
        localStorage.removeItem('jwt');
        return signedOutObj;
    }

    const user = {
        userID: decoded.identity,
        permission: decoded.user_claims.permission,
        jwt,
    };

    return { status: 'SIGNED_IN', user };
};

export const AuthProvider = (props: PropsWithChildren<AuthContextProps>) => {
    const auth = props.auth || signedOutObj;
    const router = useRouter();

    const login = async (
        username: string,
        password: string
    ): Promise<LoginResponseData | string> => {
        const config: AxiosRequestConfig = {
            method: 'post',
            url: `/elleapi/login`,
            data: { username, password },
            withCredentials: true,
        };

        return await axios(config)
            .then((res) => {
                console.log(res);
                // Dunno why these are all localStorage, should probably be cookies...
                localStorage.setItem('jwt', res.data.access_token);
                const decoded = jwtDecode(res.data.access_token) as decodedJWT;
                localStorage.setItem('per', decoded.user_claims.permission);
                localStorage.setItem('id', decoded.identity);

                return res.data;
                //router.push('/profile');
            })
            .catch((err) => {
                if (err.response !== undefined) {
                    console.log('login error', err.response.data);
                    return err.response.data.Error;
                }
            });
    };

    const logout = () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('per');
        localStorage.removeItem('id');
        router.push('/home');
    };

    const getUserInfo = async () => {
        return await axios
            .get('/elleapi/user', {
                headers: {
                    Authorization: 'Bearer ' + localStorage.getItem('jwt'),
                },
            })
            .then(async (res) => {
                const values: UserInfo = {
                    userId: res.data.id,
                    username: res.data.username,
                    email: res.data.email === null ? '' : res.data.email,
                    sessions: [],
                };

                await axios
                    .get('/elleapi/searchsessions', {
                        params: { userID: values.userId },
                        headers: {
                            Authorization:
                                'Bearer ' + localStorage.getItem('jwt'),
                        },
                    })
                    .then((res) => {
                        //make a check for res.data if its empty
                        values.sessions = res.data;
                        return;
                    })
                    .catch(function (error) {
                        console.log(error);
                    });

                return values;
            })
            .catch(function (error) {
                console.log(error);
            });
    };

    return <AuthContext.Provider value={{ auth, login, logout, getUserInfo }} {...props} />;
};

export const useAuth = () => React.useContext(AuthContext);
export const AuthConsumer = AuthContext.Consumer;
