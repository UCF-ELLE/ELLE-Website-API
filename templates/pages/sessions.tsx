import React, { Component, useCallback, useEffect, useState } from 'react';
import { Container, Row, Col, Button, Card, Form, FormGroup, Label, Input, Alert } from 'reactstrap';
import axios from 'axios';

import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/ionicons/css/ionicons.min.css';
import Loading from '@/components/Loading/Loading';
import SessionComponent from '../components/Sessions/SessionComponent';
import { Downloads } from '../components/Sessions/Downloads';
import { LoggedAnswer } from '@/types/api/logged_answer';
import { useRouter } from 'next/router';
import { useUser } from '@/hooks/useUser';
import Layout from '@/app/layout';
import Image from 'next/image';

import phoneGameImage from '@/public/static/images/phoneGames.png';
import computerGameImage from '@/public/static/images/computerGames.png';
import vrGameImage from '@/public/static/images/vrGames.png';
import { Session } from '@/types/api/sessions';

export default function Sessions() {
    const [platform, setPlatform] = useState<string>('');
    const [userID, setUserID] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [moduleID, setModuleID] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [LoggedAnswers, setLoggedAnswers] = useState<LoggedAnswer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searched, setSearched] = useState<boolean>(false);
    const { user, loading: userLoading } = useUser();
    const permission = user?.permissionGroup;
    const router = useRouter();

    useEffect(() => {
        require('@/lib/ionicons/css/ionicons.min.css');
        require('@/lib/bootstrap/css/bootstrap.min.css');
    }, []);

    const clearInputs = () => {
        setPlatform('');
        setUserID('');
        setUsername('');
        setModuleID('');
        setDate('');
    };

    const handleSearch = () => {
        setLoading(true);
        searchSession();
    };

    const searchSession = () => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: {
                moduleID: moduleID.length !== 0 ? parseInt(moduleID) : null,
                userID: userID.length !== 0 ? parseInt(userID) : null,
                userName: username.length !== 0 ? username : null,
                platform: platform.length !== 0 ? platform : null,
                sessionDate: date.length !== 0 ? date : null
            }
        };

        axios
            .get('/elleapi/searchsessions', header)
            .then((res) => {
                // Arbitrary second wait?
                window.setTimeout(() => {
                    setSessions(res.data);
                    setLoading(false);
                    setSearched(true);
                }, 1000);
            })
            .catch(function (error) {
                console.log(error);
            });
    };

    return (
        <Layout requireUser>
            <div>
                <Container className='mainContainer'>
                    <br />
                    <br />
                    <Row>
                        <Col xs='4'>
                            <h3>Your ELLE Sessions:</h3>
                        </Col>
                        <Col
                            xs={permission === 'su' ? '6' : '8'}
                            style={{
                                padding: permission === 'su' ? '0 0 0 30px' : '0 30px 0 30px'
                            }}
                        >
                            {searched && sessions.length !== 0 && loading === false ? (
                                <Alert
                                    color='info'
                                    style={{
                                        margin: '0px',
                                        textAlign: 'center'
                                    }}
                                >
                                    Click on a row to reveal logged answers.
                                </Alert>
                            ) : null}
                        </Col>
                        {permission === 'su' ? (
                            <Col xs='2' style={{ padding: '0px' }}>
                                <Downloads />
                            </Col>
                        ) : null}
                    </Row>

                    <br />

                    <Row className='Seperated Col'>
                        <Col className='Left Column' xs='4'>
                            <Row>
                                <Col>
                                    <Card style={{ padding: '20px' }}>
                                        <Form>
                                            <FormGroup>
                                                <Label for='platform'>
                                                    Platform{' '}
                                                    <a
                                                        style={{
                                                            fontSize: '10px',
                                                            color: 'red'
                                                        }}
                                                    >
                                                        *Only select to filter based on a platform
                                                    </a>
                                                </Label>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-around'
                                                    }}
                                                >
                                                    <div>
                                                        <Input
                                                            type='radio'
                                                            id='mb'
                                                            name='platform'
                                                            inline
                                                            checked={platform === 'mb'}
                                                            onChange={(e) => setPlatform(e.target.id)}
                                                        />
                                                        <Image
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                marginRight: '5px'
                                                            }}
                                                            src={phoneGameImage}
                                                            alt='phone icon'
                                                        />
                                                        Mobile
                                                    </div>
                                                    <div>
                                                        <Input
                                                            type='radio'
                                                            id='cp'
                                                            name='platform'
                                                            inline
                                                            checked={platform === 'cp'}
                                                            onChange={(e) => setPlatform(e.target.id)}
                                                        />
                                                        <Image
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                marginRight: '5px'
                                                            }}
                                                            src={computerGameImage}
                                                            alt='computer icon'
                                                        />
                                                        PC
                                                    </div>
                                                    <div>
                                                        <Input
                                                            type='radio'
                                                            id='vr'
                                                            name='platform'
                                                            inline
                                                            checked={platform === 'vr'}
                                                            onChange={(e) => setPlatform(e.target.id)}
                                                        />
                                                        <Image
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                marginRight: '5px'
                                                            }}
                                                            src={vrGameImage}
                                                            alt='vr icon'
                                                        />
                                                        VR
                                                    </div>
                                                </div>
                                            </FormGroup>
                                            {permission !== 'st' ? (
                                                <FormGroup>
                                                    <Row>
                                                        <Col xs='5'>
                                                            <Label for='userID'>User ID</Label>
                                                            <Input
                                                                type='text'
                                                                name='userID'
                                                                placeholder='Filter by user ID'
                                                                value={userID}
                                                                onChange={(e) => setUserID(e.target.value)}
                                                            />
                                                        </Col>
                                                        <Col xs='7'>
                                                            <Label for='userName'>User Name</Label>
                                                            <Input
                                                                type='text'
                                                                name='username'
                                                                placeholder='Filter by username'
                                                                value={username}
                                                                onChange={(e) => setUsername(e.target.value)}
                                                            />
                                                        </Col>
                                                    </Row>
                                                </FormGroup>
                                            ) : null}
                                            <FormGroup>
                                                <Label for='moduleID'>Module ID</Label>
                                                <Input
                                                    type='text'
                                                    name='moduleID'
                                                    placeholder="Enter a module ID to find a specific module's sessions"
                                                    value={moduleID}
                                                    onChange={(e) => setModuleID(e.target.value)}
                                                />
                                            </FormGroup>
                                            <FormGroup>
                                                <Label for='date'>Date</Label>
                                                <Input type='date' name='date' value={date} onChange={(e) => setDate(e.target.value)} />
                                            </FormGroup>
                                            <Row>
                                                <Col>
                                                    <Button
                                                        block
                                                        style={{
                                                            backgroundColor: '#37f0f9',
                                                            color: 'black',
                                                            border: 'none',
                                                            fontWeight: '500'
                                                        }}
                                                        disabled={
                                                            platform.length === 0 &&
                                                            userID.length === 0 &&
                                                            username.length === 0 &&
                                                            moduleID.length === 0 &&
                                                            date.length === 0
                                                                ? true
                                                                : false
                                                        }
                                                        onClick={() => clearInputs()}
                                                    >
                                                        Clear
                                                    </Button>
                                                </Col>
                                                <Col>
                                                    <Button
                                                        block
                                                        style={{
                                                            backgroundColor: '#37f0f9',
                                                            color: 'black',
                                                            border: 'none',
                                                            fontWeight: '500'
                                                        }}
                                                        disabled={
                                                            platform.length === 0 &&
                                                            userID.length === 0 &&
                                                            username.length === 0 &&
                                                            moduleID.length === 0 &&
                                                            date.length === 0
                                                                ? true
                                                                : false
                                                        }
                                                        onClick={() => handleSearch()}
                                                    >
                                                        Search
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </Card>
                                </Col>
                            </Row>
                        </Col>
                        <Col className='Right Column'>
                            <Row>
                                <Col>
                                    <Container>
                                        {!searched && loading === false ? (
                                            <Card style={{ paddingBottom: '52%' }}>
                                                <div>
                                                    <h3
                                                        style={{
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        Please search for a session on the left.
                                                    </h3>
                                                </div>
                                            </Card>
                                        ) : null}

                                        {searched && sessions.length !== 0 && loading === false ? <SessionComponent sessions={sessions} /> : null}

                                        {searched && sessions.length === 0 && loading === false ? (
                                            <Card style={{ paddingBottom: '46%' }}>
                                                <div>
                                                    <h3
                                                        style={{
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        No matching sessions could be found.
                                                    </h3>
                                                    <h3
                                                        style={{
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        Please search for another session on the left.
                                                    </h3>
                                                </div>
                                            </Card>
                                        ) : null}

                                        {loading === true ? <Loading /> : null}
                                    </Container>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </div>
        </Layout>
    );
}
