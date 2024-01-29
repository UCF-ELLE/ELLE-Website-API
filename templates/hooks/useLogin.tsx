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
            // Temporary Code for Games, given that they use localStorage
            // TODO: Remove this code once games are updated to use the currentUser cookie OR use the useUser hook
            // Given that game pages already make use of the useUser hook, this should be a simple change in the Unity jslib file
            localStorage.setItem('id', user.userID.toString());
            localStorage.setItem('jwt', user.jwt);
            localStorage.setItem('per', user.permissionGroup);
            router.push('/profile');
        }
        return user;
    };

    return { login };
};
