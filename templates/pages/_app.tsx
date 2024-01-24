// Create standard next js app wrapper
import type { AppProps } from 'next/app';
import '@/public/static/css/index.css';
import '@/public/static/css/style.css';

import React, { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
    useEffect(() => {
        require('@/lib/bootstrap/css/bootstrap.min.css');
        require('@/lib/bootstrap/js/bootstrap.bundle.min.js');
    }, []);

    return <Component {...pageProps} />;
}

export default MyApp;
