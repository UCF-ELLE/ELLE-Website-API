import AuthService from '@/services/AuthService';
import { UserRegisterInfo } from '@/types/services/auth';
import { useRouter } from 'next/router';

export const useSignUp = () => {
    const router = useRouter();

    const signUp = async (username: string, email: string, password: string, confirmation: string, groupCode: string) => {
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

    return { signUp };
};
