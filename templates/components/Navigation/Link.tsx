'use client';
import { startTransition } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useIsBlocked } from './NavigationBlock';

export function Link({ href, children, replace, ...rest }: Parameters<typeof NextLink>[0]) {
    const router = useRouter();
    const isBlocked = useIsBlocked();

    return (
        <NextLink
            href={href}
            onClick={(e) => {
                e.preventDefault();

                // Cancel navigation
                if (
                    isBlocked &&
                    !window.confirm('Do you really want to leave?\nYour game session data might be lost! Please end the game before leaving.')
                ) {
                    return;
                }

                startTransition(() => {
                    const url = href.toString();
                    if (replace) {
                        router.replace(url);
                    } else {
                        router.push(url);
                    }
                });
            }}
            {...rest}
        >
            {children}
        </NextLink>
    );
}
