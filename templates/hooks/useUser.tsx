import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import AuthService from '@/services/AuthService';
import { AuthUser } from '@/types/services/auth';

export const useUser = () => {
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
        const _as = new AuthService();
        const userInfo = await _as.getUserInfo(user?.jwt as string);
        return userInfo;
    };

    return { user, loading, getUserInfo };
};
