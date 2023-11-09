'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import MainTemplate from '@/components/MainTemplate';
import Footer from '@/components/Footer';

export type PermissionLevels = 'su' | 'pf' | 'st' | 'ta' | undefined;

export default function RootLayout({
    children,
    noFooter,
}: {
    children: React.ReactNode;
    noFooter?: boolean;
}) {
    const { user } = useUser();
    const [permission, setPermission] = useState<PermissionLevels>(undefined);

    useEffect(() => {
        setPermission(user?.permission as PermissionLevels);
        console.log('permission', user?.permission);
    }, [user?.permission]);

    return (
        <>
            <MainTemplate permission={permission} />
            {children}
            {noFooter ? null : <Footer />}
        </>
    );
}
