// Create standard next js app wrapper
import type { AppProps } from 'next/app';
import '@/lib/bootstrap/css/bootstrap.min.css';
// import '@/lib/bootstrap/js/bootstrap.bundle.min.js'
import '@/public/static/css/index.css';

import React from 'react';

function MyApp({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />;
}

export default MyApp;
