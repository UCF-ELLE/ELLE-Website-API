import React, { useState } from 'react';
import { Button, Input, Label, Row, Col, Modal, ModalHeader, ModalBody, Alert } from 'reactstrap';
import axios from 'axios';
import { useUser } from '@/hooks/useAuth';
import Layout from '@/components/Layouts/Layout';
import '@/public/static/css/loginstyle.css';

export default function ForgotPassword() {
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
            .post('/elleapi/forgotpassword', { email: email }, header)
            .then((res) => {
                setAlertOpen(true);
            })
            .catch((error) => {
                console.log('forgot pw error: ', error);
            });
    };

    return (
        <div className='forgot-bg'>
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="forgot-box p-4 shadow rounded" style={{ maxWidth: '600px', width: '100%' }}>
                    <h4 className="text-center mb-4">Forgot your Password?</h4>
                    <Row className="text-center mb-4">
                        <Col xs="12">
                            <div>Do you have an email associated with your account?</div>
                        </Col>
                    </Row>
                    <Row className="mb-4">
                        <Col xs="12" sm="6" className="d-flex justify-content-center mb-2 mb-sm-0">
                            <Button size="sm" style={{ fontWeight: 'bold' }} onClick={() => toggleEmailModal()} block>
                                Yes, I do!
                            </Button>
                        </Col>
                        <Col xs="12" sm="6" className="d-flex justify-content-center">
                            <Button size="sm" style={{ fontWeight: 'bold' }} onClick={() => toggleHelpModal()} block>
                                No, I do not.
                            </Button>
                        </Col>
                    </Row>
                </div>

                {/* Email Modal */}
                <Modal isOpen={emailModalOpen} toggle={() => toggleEmailModal()} size="lg">
                    <ModalHeader toggle={() => toggleEmailModal()}>Send me an email</ModalHeader>
                    <ModalBody>
                        {alertOpen && (
                            <Alert color="info" style={{ fontSize: 'small' }}>
                                If there's a user associated with the provided email, we will send information on how to reset your password. If
                                you have not received it within 15 minutes, please check your junk or spam emails.
                            </Alert>
                        )}
                        <Label>Email:</Label>
                        <Row>
                            <Col xs="12" sm="10">
                                <Input
                                    placeholder="user@email.com"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.currentTarget.value)}
                                />
                            </Col>
                            <Col xs="12" sm="2" className="p-0">
                                <Button size="sm" onClick={() => sendEmail()} className="w-100">
                                    Send
                                </Button>
                            </Col>
                        </Row>
                    </ModalBody>
                </Modal>

                {/* Help Modal */}
                <Modal isOpen={helpModalOpen} toggle={() => toggleHelpModal()} size="lg">
                    <ModalHeader toggle={() => toggleHelpModal()}>Help</ModalHeader>
                    <ModalBody>Please ask your professor or the super admin to reset your password.</ModalBody>
                </Modal>
            </div>
        </div>
    );
}

ForgotPassword.getLayout = (page: React.JSX.Element) => <Layout noFooter>{page}</Layout>;
