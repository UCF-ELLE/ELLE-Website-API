'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import backgroundFullImage from '../public/static/images/ELLE/ELLE-Background-Full.png';
import { useLogout } from '@/hooks/useLogout';

import styles from './Layout.module.css';

export default function Template(props: { permission?: string }) {
    const { logout } = useLogout();

    return (
        <header id={styles.header}>
            <div className={styles.container}>
                <div id='logo' className={styles.logo}>
                    <Link href='/home'>
                        <Image src={backgroundFullImage} alt='ELLE Ultimate' title='Home' className='mainLogoStyle' height={42} width={150} />
                    </Link>
                </div>

                <nav id={styles.nav_menu_container}>
                    <ul className={styles.nav_menu}>
                        <li>
                            <Link href='/games'>Games</Link>
                        </li>
                        {props.permission ? (
                            <>
                                <li>
                                    <Link href='/profile'>Profile</Link>
                                </li>
                                <li>
                                    <Link href='/modules'>Modules</Link>
                                </li>
                                <li>
                                    <Link href='/sessions'>Sessions</Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href='/home'>Home</Link>
                                </li>
                                <li>
                                    <Link href='/login'>Log In</Link>
                                </li>
                                <li>
                                    <Link href='/signup'>Sign Up</Link>
                                </li>
                            </>
                        )}
                        {props.permission === 'su' ? (
                            <li>
                                <Link href='/userlist'>User List</Link>
                            </li>
                        ) : null}
                        {props.permission === 'pf' ? (
                            <li>
                                <Link href='/classroster'>Class Roster</Link>
                            </li>
                        ) : null}
                        {props.permission && (
                            <>
                                <li>
                                    <Link href='/gamecode'>VR Game Code</Link>
                                </li>
                                <li>
                                    <Link href='/' onClick={logout}>
                                        Sign Out
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    );
}
