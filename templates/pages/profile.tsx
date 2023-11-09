import React, { ChangeEvent, useEffect, useState } from 'react';
import { Container } from 'reactstrap';
import SuperAdminView from '../components/Profile/SuperAdminView';
import AdminView from '../components/Profile/AdminView';
import StudentView from '@/components/Profile/StudentView';
import { useUser } from '@/hooks/useUser';
import { UserInfo } from '@/services/AuthService';
import Layout from '@/app/layout';
import '@/public/static/css/style.css';

export default function Profile() {
    const { user, getUserInfo } = useUser();
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [permission, setPermission] = useState<string>(
        user?.permission as string
    );

    useEffect(() => {
        if (user && !username && !email) {
            setPermission(user?.permission as string);
            getUserInfo().then((userInfoResponse) => {
                const userInfo = userInfoResponse as UserInfo;
                console.log(userInfo)
                setUsername(userInfo.username);
                setEmail(userInfo.email);
            });
        }
    }, [email, getUserInfo, user, username]);

    const editEmail = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    return (
        <Layout>
            <div>
                <Container className="mainContainer">
                    <br></br>
                    {permission === 'su' ? (
                        <SuperAdminView
                            username={username}
                            email={email}
                            editEmail={editEmail}
                        />
                    ) : null}
                    {permission === 'pf' ? (
                        <AdminView
                            username={username}
                            email={email}
                            editEmail={editEmail}
                        />
                    ) : null}
                    {permission === 'st' ? (
                        <StudentView
                            username={username}
                            email={email}
                            editEmail={editEmail}
                        />
                    ) : null}
                    <br />
                </Container>
            </div>
        </Layout>
    );
}
