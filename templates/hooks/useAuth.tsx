import AuthService from '@/services/AuthService';
import Cookies from 'js-cookie';
import { AuthUser, UserRegisterInfo } from '@/types/services/auth';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User } from '@/types/api/user';
import { ApiError, ApiMessage } from '@/types/misc';

const AuthenticationContext = createContext<{
    user: AuthUser | undefined;
    loading: boolean;
    getUserInfo: () => Promise<User | ApiError>;
    generateUsername: () => Promise<ApiError | { username: string }>;
    login: (username: string, password: string) => Promise<AuthUser | ApiError | undefined>;
    logout: () => void;
    signup: (
        username: string,
        email: string,
        password: string,
        confirmation: string,
        reason: string,
        location: string,
        groupCode: string
    ) => Promise<ApiError | ApiMessage>;
}>({
    user: undefined,
    loading: true,
    getUserInfo: async () => {
        return { error: 'getUserInfo not implemented' };
    },
    generateUsername: async () => {
        return { error: 'generateUsername not implemented' };
    },
    login: async () => ({ error: 'login not implemented' }),
    logout: () => {},
    signup: async () => ({ error: 'signup not implemented' })
});

export const useAuthInit = () => {
    const router = useRouter();
    const _as = useMemo(() => new AuthService(), []);
    const [user, setUser] = useState<AuthUser>();
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const userCookie = Cookies.get('currentUser');
        if (userCookie) {
            setUser(JSON.parse(userCookie));
        }
        setLoading(false);
    }, []);

    const getUserInfo = async () => {
        const userInfo = await _as.getUserInfo(user?.jwt as string);
        return userInfo;
    };

    const generateUsername = async () => {
        const username = await _as.generateUsername();
        return username;
    };

    const login = async (username: string, password: string) => {
        const user = await _as.login(username, password);
        if (user && 'jwt' in user) {
            Cookies.set('currentUser', JSON.stringify(user));
            setUser(user);
            router.push('/profile');
        }
        return user;
    };

    const logout = () => {
        Cookies.remove('currentUser');
        setUser(undefined);
        router.push('/home');
    };

    const signup = async (
        username: string,
        email: string,
        password: string,
        confirmation: string,
        reason: string,
        location: string,
        groupCode: string
    ) => {
        const data = {
            username,
            email,
            password,
            password_confirm: confirmation,
            reason,
            location,
            groupCode
        } as UserRegisterInfo;
        const response = await _as.signup(data);
        if ('Message' in response && response.Message.toLowerCase().includes('success')) {
            router.push('/login');
        }
        return response;
    };

    return { user, loading, getUserInfo, generateUsername, login, logout, signup };
};

export const AuthenticationProvider = ({ children }: { children: React.ReactNode }) => {
    const authHook = useAuthInit();
    return <AuthenticationContext.Provider value={authHook}>{children}</AuthenticationContext.Provider>;
};

export const useUser = () => {
    const { user, loading, getUserInfo, generateUsername } = useContext(AuthenticationContext);
    return { user, loading, getUserInfo, generateUsername };
};

export const useAuth = () => {
    const { login, logout, signup } = useContext(AuthenticationContext);
    return { login, logout, signup };
};
