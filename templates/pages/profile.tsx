import React, { ChangeEvent, useEffect, useState } from 'react';
import { Container } from 'reactstrap';
import SuperAdminView from '../components/Profile/SuperAdminView';
import AdminView from '../components/Profile/AdminView';
import StudentView from '@/components/Profile/StudentView';
import { useUser } from '@/hooks/useUser';
import Layout from '@/app/layout';
import '@/public/static/css/style.css';
import { User } from '@/types/api/user';

export default function Profile() {
    const { user, getUserInfo } = useUser();
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string | undefined>(undefined);
    const [permission, setPermission] = useState<string>(user?.permissionGroup as string);

    useEffect(() => {
        if (user && !username && !email) {
            setPermission(user?.permissionGroup as string);
            getUserInfo().then((userInfoResponse) => {
                const userInfo = userInfoResponse as User;
                console.log(userInfo);
                setUsername(userInfo.username);
                setEmail(userInfo?.email);
            });
        }
    }, [email, getUserInfo, user, username]);

    const editEmail = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    return (
        <Layout>
            <div>
                <Container className='mainContainer'>
                    <br></br>
                    {permission === 'su' ? <SuperAdminView username={username} email={email} editEmail={editEmail} /> : null}
                    {permission === 'pf' ? <AdminView username={username} email={email} editEmail={editEmail} /> : null}
                    {permission === 'st' ? <StudentView username={username} email={email} editEmail={editEmail} /> : null}
                    <br />
                </Container>
            </div>
        </Layout>
    );
}
