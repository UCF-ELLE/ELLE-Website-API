import React from 'react';
import styles from './Layout.module.css';

export default function Footer() {
    return (
        <footer id={styles.footer}>
            <div className={styles.container}>
                <div className={styles.credits}>
                    Questions? Want access to a demo class? Contact <a href='mailto:ekj@ucf.edu'>Dr. Johnson here</a>.
                </div>
                <div className={styles.copyright}>&copy; Copyright held by UCF. All Rights Reserved</div>
            </div>
        </footer>
    );
}
