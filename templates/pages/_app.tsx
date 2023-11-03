import App from 'next/app';
import { AuthProvider, getUser } from '@/hooks/useAuth';
import type { AuthContextProps } from '@/hooks/useAuth';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';


const AppWrapper = ({ Component, pageProps, auth }: AppProps & AuthContextProps) => {

    useEffect(() => {
    }, []);

    return (
        <AuthProvider auth={auth}>
            <Component {...pageProps} />
        </AuthProvider>
    );
}

AppWrapper.getInitialProps = (appContext: any) => {
    const appProps = App.getInitialProps(appContext);
    const auth = getUser();
    console.log(auth)
    return { ...appProps, auth };
}

export default AppWrapper;
