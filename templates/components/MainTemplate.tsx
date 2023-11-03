'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

import backgroundFullImage from '../public/static/images/ELLE/ELLE-Background-Full.png';

export default function Template(props: { permission?: string }) {
    return (
        <header id="header">
            <div className="container">
                <div id="logo" className="pull-left">
                    <Link href="/home">
                        <Image
                            src={backgroundFullImage}
                            alt="ELLE Ultimate"
                            title="Home"
                            className="mainLogoStyle"
                        />
                    </Link>
                </div>

                <nav id="nav-menu-container">
                    <ul className="nav-menu">
                        <li>
                            <Link href="/games">Games</Link>
                        </li>
                        {props.permission ? (
                            <>
                                <li>
                                    <Link href="/profile">Profile</Link>
                                </li>
                                <li>
                                    <Link href="/modules">Modules</Link>
                                </li>
                                <li>
                                    <Link href="/sessions">Sessions</Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link href="/home">Home</Link>
                                </li>
                                <li>
                                    <Link href="/login">Log In</Link>
                                </li>
                                <li>
                                    <Link href="/register">Sign Up</Link>
                                </li>
                            </>
                        )}
                        {props.permission === 'su' ? (
                            <li>
                                <Link href="/userlist">User List</Link>
                            </li>
                        ) : null}
                        {props.permission === 'pf' ? (
                            <li>
                                <Link href="/classroster">Class Roster</Link>
                            </li>
                        ) : null}
                        {props.permission && (
                            <>
                                <li>
                                    <Link href="/gamecode">VR Game Code</Link>
                                </li>
                                <li>
                                    <Link href="/logout">Sign Out</Link>
                                </li>
                            </>
                        )}
                        <li>
                            <a
                                href="https://github.com/Naton-1/ELLE-2023-Website-API"
                                className="github"
                            >
                                <i className="fa fa-github fa-lg"></i>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
