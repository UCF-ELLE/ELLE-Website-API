'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import MainTemplate from '@/components/MainTemplate';
import Footer from '@/components/Footer';
import { PermissionGroup } from '@/types/misc';
import { useRouter } from 'next/navigation';
import { NavigationBlockerProvider } from '../Navigation/NavigationBlock';

type PermissionLevels = PermissionGroup | undefined;

export default function Layout({ children, noFooter, requireUser }: { children: React.ReactNode; noFooter?: boolean; requireUser?: boolean }) {
    const { user, loading } = useUser();
    const router = useRouter();
    const [permission, setPermission] = useState<PermissionLevels>(undefined);

    useEffect(() => {
        if (loading) return;
        setPermission(user?.permissionGroup as PermissionLevels);

        if (requireUser && (!user || !user?.permissionGroup)) {
            router.push('/home');
        }
    }, [loading, user, requireUser, router]);

    return (
        <>
            <NavigationBlockerProvider>
                <MainTemplate permission={permission} />
                <main>{children}</main>
                {noFooter ? null : <Footer />}
            </NavigationBlockerProvider>
        </>
    );
}
