// Create standard next js app wrapper
import type { AppProps } from 'next/app';
// import '@/lib/bootstrap/js/bootstrap.bundle.min.js'

import React, { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
    useEffect(() => {
        require('@/lib/bootstrap/css/bootstrap.min.css');
        require('@/public/static/css/index.css');
        require('@/public/static/css/style.css');
    }, []);

    return <Component {...pageProps} />;
}

export default MyApp;
