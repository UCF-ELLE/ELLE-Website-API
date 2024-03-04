import AuthService from '@/services/AuthService';
import Cookies from 'js-cookie';
import { AuthUser, UserRegisterInfo } from '@/types/services/auth';
import { useRouter } from 'next/router';

export const useAuth = () => {
    const router = useRouter();
    const login = async (username: string, password: string) => {
        const _as = new AuthService();
        const user = await _as.login(username, password);
        if (user && 'jwt' in user) {
            Cookies.set('currentUser', JSON.stringify(user as AuthUser));
            router.push('/profile');
        }
        return user;
    };

    const logout = () => {
        Cookies.remove('currentUser');
        router.push('/home');
    };

    const signup = async (username: string, email: string, password: string, confirmation: string, groupCode: string) => {
        const _as = new AuthService();
        const data = {
            username,
            email,
            password,
            password_confirm: confirmation,
            groupCode
        } as UserRegisterInfo;
        const response = await _as.signup(data);
        console.log(response);
        if ('Message' in response && response.Message.toLowerCase().includes('success')) {
            router.push('/login');
        }
        return response;
    };

    return { login, logout, signup };
};
