import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import AuthService from "@/services/AuthService";
import { User } from "@/types/users";

export const useUser = () => {
    const [user, setUser] = useState<User>();

    useEffect(() => {
        const userCookie = Cookies.get('currentUser');
        if (userCookie) {
            setUser(JSON.parse(userCookie));
        }
    }, []);

    const getUserInfo = async () => {
        const _as = new AuthService();
        const userInfo = await _as.getUserInfo(user?.jwt as string);
        return userInfo;
    }

    return { user , getUserInfo };
}
