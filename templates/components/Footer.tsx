import React from 'react';
import styles from './Layout.module.css';

export default function Footer() {
    return (
        <footer id={styles.footer}>
            <div className={styles.container}>
                <div className={styles.copyright}>&copy; Copyright held by UCF. All Rights Reserved</div>
                <div className={styles.credits}>
                    {/*
                    All the links in the footer should remain intact.
                    You can delete the links only if you purchased the pro version.
                    Licensing information: https://bootstrapmade.com/license/
                    Purchase the pro version with working PHP/AJAX contact form: https://bootstrapmade.com/buy/?theme=Reveal
                    */}
                    Designed by <a href='https://bootstrapmade.com/'>BootstrapMade</a>
                </div>
            </div>
        </footer>
    );
}
