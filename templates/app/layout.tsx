'use client'

import { useEffect, useState } from 'react';
import { getUser } from '@/hooks/useAuth';
import MainTemplate from '@/components/MainTemplate';

import '@/lib/bootstrap/css/bootstrap.min.css';
import '@/public/static/css/index.css';
import Footer from '@/components/Footer';
import { verifyPermission } from '@/utils/user';

export type PermissionLevels = 'su' | 'pf' | 'st' | 'ta' | undefined;

export default function RootLayout({
    children,
    noFooter,
}: {
    children: React.ReactNode;
    noFooter?: boolean;
}) {
    const [permission, setPermission] = useState<PermissionLevels>(undefined)

    useEffect(() => {
        setPermission(verifyPermission());
    }, []);

    return (
        <>
            <MainTemplate permission={permission}/>
            {children}
            { noFooter ? null : <Footer /> }
        </>
    );
}
