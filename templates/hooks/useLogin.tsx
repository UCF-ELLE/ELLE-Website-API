import AuthService from '@/services/AuthService';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types/services/auth';

export const useLogin = () => {
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

    return { login };
};
