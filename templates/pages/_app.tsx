// Create standard next js app wrapper
import Layout from '@/components/Layouts/Layout';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { NextComponentType, NextPageContext } from 'next/types';

import React, { useEffect } from 'react';

type Page = NextComponentType<NextPageContext, any, any> & { getLayout?: (page: React.JSX.Element) => React.JSX.Element };

function MyApp({ Component, pageProps }: AppProps) {
    const env = process.env.NODE_ENV;
    const getLayout = (Component as Page).getLayout ?? ((page: React.JSX.Element) => <Layout>{page}</Layout>);

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
                <link rel='icon' href={env === 'production' ? '/elle/favicon.ico' : '/elle/favicon-dev.ico'} />
            </Head>
            {getLayout(<Component {...pageProps} />)}
        </>
    );
}

export default MyApp;
