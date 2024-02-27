import { Html, Head, Main, NextScript } from 'next/document';
import { useEffect } from 'react';

export default function Document() {
    useEffect(() => {
        const links = document.querySelectorAll("link[rel='preload'][as='style']") as NodeListOf<HTMLLinkElement>;
        links.forEach((link) => (link.rel = 'stylesheet'));
    }, []);

    return (
        <Html lang='en'>
            <Head />
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
