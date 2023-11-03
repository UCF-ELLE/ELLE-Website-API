import React, { ChangeEvent, useEffect, useState } from 'react';
import { Container } from 'reactstrap';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import SuperAdminView from '../components/Profile/SuperAdminView';
import AdminView from '../components/Profile/AdminView';
import StudentView from '../components/Profile/StudentView';
import Footer from '../components/Footer';
import { AuthContextType, UserInfo, getUser, useAuth } from '@/hooks/useAuth';
import { verifyPermission } from '@/utils/user';

export function Profile() {

    const user = getUser();
    const { getUserInfo } = useAuth() as AuthContextType;
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [permission, setPermission] = useState<string>(user.user?.permission as string);

    useEffect(() => {
        setPermission(verifyPermission() as string);
        
        getUserInfo().then((userInfoResponse) => {
            const userInfo = userInfoResponse as UserInfo;
            setUsername(userInfo.username);
            setEmail(userInfo.email);
        });

    }, [getUserInfo]);

    const editEmail = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value); 
    }

    return (
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
                        permission={permission}
                        editEmail={editEmail}
                    />
                ) : null}
                {permission === 'st' ? (
                    <StudentView
                        username={username}
                        email={email}
                        permission={permission}
                        editEmail={editEmail}
                    />
                ) : null}
                <br />
            </Container>
            <Footer></Footer>
        </div>
    );
}
