'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import MainTemplate from '@/components/MainTemplate';
import Footer from '@/components/Footer';
import { PermissionGroup } from '@/types/misc';
import { useRouter } from 'next/navigation';

type PermissionLevels = PermissionGroup | undefined;

export default function RootLayout({ children, noFooter, requireUser }: { children: React.ReactNode; noFooter?: boolean; requireUser?: boolean }) {
    const { user, loading } = useUser();
    const router = useRouter();
    const [permission, setPermission] = useState<PermissionLevels>(undefined);

    useEffect(() => {
        if (loading) return;
        setPermission(user?.permissionGroup as PermissionLevels);

        if (requireUser && (!user || !user?.permissionGroup)) {
            router.push('/home');
        }
        console.log('permission', user?.permissionGroup);
    }, [loading, user, requireUser, router]);

    return (
        <>
            <MainTemplate permission={permission} />
            {children}
            {noFooter ? null : <Footer />}
        </>
    );
}
