import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export const useLogout = () => {
    const router = useRouter();
    const logout = () => {
        Cookies.remove('currentUser');
        router.push('/home');
    };

    return { logout };
};
