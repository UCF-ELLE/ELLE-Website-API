import AuthService from '@/services/AuthService';
import { useRouter } from 'next/router';
import { SignUpInfo } from '@/services/AuthService';

export const useSignUp = () => {
    const router = useRouter();

    const signUp = async (
        username: string,
        email: string,
        password: string,
        confirmation: string,
        groupCode: string
    ) => {
        const _as = new AuthService();
        const data = {
            username,
            email,
            password,
            password_confirm: confirmation,
            groupCode,
        } as SignUpInfo;
        const response = await _as.signup(data);
        if ('jwt' in response) {
            router.push('/login');
        }
        return response;
    };

    return { signUp };
};
