import Image from 'next/image';
import { Link } from '@/components/Navigation/Link';

import backgroundFullImage from '@/public/static/images/ELLE/ELLE-Background-Full.png';

import { useAuth } from '@/hooks/useAuth';
import styles from './Layout.module.css';
import { useState } from 'react';  

export default function Template(props: { permission?: string }) {
    const { logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false); 

    // Function to close the menu
    const handleLinkClick = () => {
        setIsMenuOpen(false); 
    };

    return (
        <header id={styles.header}>
            <div className={`${styles.container} container-fluid px-3 px-md-4`}>
                <div className="d-flex align-items-center justify-content-between">
                    {/* Logo Section */}
                    <div id="logo">
                        <Link href="/home">
                            <Image
                                src={backgroundFullImage}
                                alt="ELLE Ultimate"
                                title="Home"
                                className="img-fluid"
                                height={42}
                                width={150}
                                priority
                            />
                        </Link>
                    </div>

                    {/* Navigation Section (Desktop) */}
                    <nav id="nav_menu_container" className="d-none d-md-block">
                        <ul className={`d-flex mb-0 ${styles.nav_menu}`}>
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
                                        <Link href="/signup">Sign Up</Link>
                                    </li>
                                </>
                            )}
                            {props.permission === 'su' && (
                                <li>
                                    <Link href="/userlist">User List</Link>
                                </li>
                            )}
                            {props.permission === 'pf' && (
                                <li>
                                    <Link href="/classroster">Class Roster</Link>
                                </li>
                            )}
                            {props.permission && (
                                <>
                                    <li>
                                        <Link href="/gamecode">VR Game Code</Link>
                                    </li>
                                    <li>
                                        <Link href="/home" onClick={logout}>
                                            Sign Out
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="btn btn-outline-secondary d-md-none"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#mobileNavMenu"
                        aria-expanded={isMenuOpen ? 'true' : 'false'}
                        aria-controls="mobileNavMenu"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}  // Toggle menu state
                    >
                        <i className="fa fa-bars"></i> 
                    </button>
                </div>
            </div>

            {/* Mobile Navigation (Collapsed) */}
            <div className={`collapse d-md-none ${isMenuOpen ? 'show' : ''}`} id="mobileNavMenu">
                <ul className={`list-unstyled ${styles.nav_menu}`}>
                    <li>
                        <Link href="/games" onClick={handleLinkClick}>Games</Link>
                    </li>
                    {props.permission ? (
                        <>
                            <li>
                                <Link href="/profile" onClick={handleLinkClick}>Profile</Link>
                            </li>
                            <li>
                                <Link href="/modules" onClick={handleLinkClick}>Modules</Link>
                            </li>
                            <li>
                                <Link href="/sessions" onClick={handleLinkClick}>Sessions</Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link href="/home" onClick={handleLinkClick}>Home</Link>
                            </li>
                            <li>
                                <Link href="/login" onClick={handleLinkClick}>Log In</Link>
                            </li>
                            <li>
                                <Link href="/signup" onClick={handleLinkClick}>Sign Up</Link>
                            </li>
                        </>
                    )}
                    {props.permission === 'su' && (
                        <li>
                            <Link href="/userlist" onClick={handleLinkClick}>User List</Link>
                        </li>
                    )}
                    {props.permission === 'pf' && (
                        <li>
                            <Link href="/classroster" onClick={handleLinkClick}>Class Roster</Link>
                        </li>
                    )}
                    {props.permission && (
                        <>
                            <li>
                                <Link href="/gamecode" onClick={handleLinkClick}>VR Game Code</Link>
                            </li>
                            <li>
                                <Link href="/home" onClick={logout}>
                                    Sign Out
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </header>
    );
}
