/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/',
                destination: '/home',
                permanent: true
            }
        ]
    },
    async rewrites() {
        return [
            {
                source: '/elleapi/:slug*',
                destination: 'http://localhost:5050/elleapi/:slug*'
            }
        ]
    }
}

module.exports = nextConfig
