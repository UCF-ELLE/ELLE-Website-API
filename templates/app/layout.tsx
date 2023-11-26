'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import MainTemplate from '@/components/MainTemplate';
import Footer from '@/components/Footer';
import { PermissionGroup } from '@/types/users';

type PermissionLevels = PermissionGroup | undefined;

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
        setPermission(user?.permissionGroup as PermissionLevels);
        console.log('permission', user?.permissionGroup);
    }, [user?.permissionGroup]);

    return (
        <>
            <MainTemplate permission={permission} />
            {children}
            {noFooter ? null : <Footer />}
        </>
    );
}
