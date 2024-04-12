/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.modules.push(path.resolve('./node_modules'));
        }
        return config;
    },

    basePath: '/elle',

    async redirects() {
        return [
            {
                source: '/',
                destination: '/home',
                permanent: true
            },
            {
                source: '/',
                destination: '/elle/home',
                permanent: true,
                basePath: false
            }
        ];
    },
    async rewrites() {
        return [
            {
                source: '/elleapi/:slug*',
                destination: 'http://localhost:5050/elleapi/:slug*',
                basePath: process.env.NODE_ENV === 'production' ? undefined : false
            },
            {
                source: '/images/:slug*',
                destination: 'http://localhost:5050/images/:slug*'
            },
            {
                source: '/audios/:slug*',
                destination: 'http://localhost:5050/audios/:slug*'
            }
        ];
    }
};

module.exports = nextConfig;
