import React, { useState } from 'react';
import { Button, Input, Label, Row, Col, Modal, ModalHeader, ModalBody, Alert } from 'reactstrap';
import axios from 'axios';
import { useUser } from '@/hooks/useUser';
import Layout from '@/app/layout';
import '@/public/static/css/loginstyle.css';

export default function ForgotUsername() {
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [alertOpen, setAlertOpen] = useState(false);
    const { user } = useUser();

    const toggleHelpModal = () => {
        setHelpModalOpen(!helpModalOpen);
    };

    const toggleEmailModal = () => {
        setEmailModalOpen(!emailModalOpen);
        setEmail('');
        setAlertOpen(false);
    };

    const sendEmail = () => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post('/elleapi/forgotusername', { email: email }, header)
            .then((res) => {
                setAlertOpen(true);
            })
            .catch((error) => {
                console.log('forgot username error: ', error.response);
            });
    };

    return (
        <Layout>
            <div className='forgot-bg'>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <div className='forgot-box'>
                        <h4 style={{ display: 'flex', justifyContent: 'center', margin: '10px' }}>Forgot your username?</h4>
                        <Row style={{ display: 'flex', justifyContent: 'center', margin: '10px' }}>
                            Do you have an email associated with your account?
                        </Row>
                        <Row style={{ marginBottom: '10px' }}>
                            <Col style={{ display: 'flex', justifyContent: 'center' }}>
                                <Button style={{ fontWeight: 'bold' }} onClick={() => toggleEmailModal()}>
                                    Yes, I do!
                                </Button>
                            </Col>
                            <Col style={{ display: 'flex', justifyContent: 'center' }}>
                                <Button style={{ fontWeight: 'bold' }} onClick={() => toggleHelpModal()}>
                                    No, I do not.
                                </Button>
                            </Col>
                        </Row>
                    </div>

                    <Modal isOpen={emailModalOpen} toggle={() => toggleEmailModal()}>
                        <ModalHeader toggle={() => toggleEmailModal()}>Send me an email</ModalHeader>
                        <ModalBody>
                            {alertOpen ? (
                                <Alert color='info' style={{ fontSize: 'small' }}>
                                    If there&apos;s an user associated with the provided email, we will send information on your username. If you have
                                    not received it within 15 minutes, please check under junk or spam emails.
                                </Alert>
                            ) : null}
                            <Label>Email:</Label>
                            <Row>
                                <Col xs='10'>
                                    <Input
                                        placeholder='user@email.com'
                                        name='email'
                                        value={email}
                                        onChange={(e) => setEmail(e.currentTarget.value)}
                                    />
                                </Col>
                                <Col xs='2' style={{ padding: '0' }}>
                                    <Button onClick={() => sendEmail()}>Send</Button>
                                </Col>
                            </Row>
                        </ModalBody>
                    </Modal>

                    <Modal isOpen={helpModalOpen} toggle={() => toggleHelpModal()}>
                        <ModalHeader toggle={() => toggleHelpModal()}>Help</ModalHeader>
                        <ModalBody>Please ask your professor or the super admin to help you find your username.</ModalBody>
                    </Modal>
                </div>
            </div>
        </Layout>
    );
}
