// Create standard next js app wrapper
import type { AppProps } from 'next/app';
import Head from 'next/head';

import React, { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
    const env = process.env.NODE_ENV;

    useEffect(() => {
        require('@/lib/bootstrap/css/bootstrap.min.css');
        require('@/lib/bootstrap/js/bootstrap.bundle.min.js');
        require('@/public/static/css/index.css');
        require('@/public/static/css/style.css');
        require('react-bootstrap-typeahead/css/Typeahead.css');
    }, []);

    return (
        <>
            <Head>
                <title>{`Elle 2.0${env === 'development' ? ' Dev' : ''}`}</title>
                <link rel='icon' href={env === 'production' ? '/favicon.ico' : '/favicon-dev.ico'} />
            </Head>
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
