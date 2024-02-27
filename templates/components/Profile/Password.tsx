import React, { ChangeEvent, useState } from 'react';
import { Button, Tooltip, Modal, ModalHeader, ModalBody, Row, Col, Card, Form, FormGroup, Label, InputGroup, Input, FormFeedback } from 'reactstrap';
import axios from 'axios';
import passwordImage from '@/public/static/images/password.png';
import hidePasswordImage from '@/public/static/images/hide.png';
import showPasswordImage from '@/public/static/images/show.png';
import Image from 'next/image';
import styles from './SuperAdminView.module.css';
import { useUser } from '@/hooks/useUser';

export default function Password({
    userType,
    email,
    editEmail
}: {
    userType: string;
    email?: string;
    editEmail: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
    const { user } = useUser();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validConfirm, setValidConfirm] = useState(false);
    const [invalidConfirm, setInvalidConfirm] = useState(false);
    const [hiddenPassword, setHiddenPassword] = useState(true);
    const [hiddenConfirm, setHiddenConfirm] = useState(true);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);

    const validatePassword = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.name === 'newPassword') {
            setNewPassword(e.target.value);
            if ((e.target.value.length === 0 && confirmPassword.length === 0) || (e.target.value.length > 0 && confirmPassword.length === 0)) {
                setValidConfirm(false);
                setInvalidConfirm(false);
            } else if (e.target.value.localeCompare(confirmPassword) === 0) {
                setValidConfirm(true);
                setInvalidConfirm(false);
            } else {
                setValidConfirm(false);
                setInvalidConfirm(true);
            }
        } else {
            setConfirmPassword(e.target.value);
            if (e.target.value.length === 0 && newPassword.length === 0) {
                setValidConfirm(false);
                setInvalidConfirm(false);
            } else if (e.target.value.localeCompare(newPassword) === 0) {
                setValidConfirm(true);
                setInvalidConfirm(false);
            } else {
                setValidConfirm(false);
                setInvalidConfirm(true);
            }
        }
    };

    const submitPassword = () => {
        // var data = {
        //   password: this.state.newPassword
        // }
        // var headers = {
        //   'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        // }

        // axios.post(this.props.serviceIP + '/changepassword', data, {headers:headers})
        // .then(res => {
        //   this.toggleModal();
        // }).catch(function (error) {
        //   console.log(error.response);
        // });

        const data = {
            password: newPassword
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post('elleapi/changepassword', data, header)
            .then((res) => {
                toggleModal();
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const togglePWPrivacy = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (e.currentTarget.name === 'hiddenPassword') {
            setHiddenPassword(!hiddenPassword);
        } else {
            setHiddenConfirm(!hiddenConfirm);
        }
    };

    const toggleModal = () => {
        setModalOpen(!modalOpen);
        setNewPassword('');
        setConfirmPassword('');
        setValidConfirm(false);
        setInvalidConfirm(false);
        setIsEditingEmail(false);
    };

    const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        editEmail(e);
    };

    const toggleEditBtn = () => {
        setIsEditingEmail(!isEditingEmail);
    };

    const saveEmail = () => {
        const data = {
            newEmail: email
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .put('elleapi/user', data, header)
            .then((res) => {
                toggleEditBtn();
            })
            .catch((error) => {
                console.log(error);
            });
    };

    return (
        <>
            {userType === 'su' ? (
                <p className={styles.setting} onClick={() => toggleModal()}>
                    {' '}
                    settings{' '}
                </p>
            ) : (
                <>
                    <Button
                        id='changeSettings'
                        style={{
                            backgroundColor: 'aliceblue',
                            float: 'right',
                            border: 'none',
                            borderRadius: '0 3px 3px 0'
                        }}
                        onClick={() => toggleModal()}
                    >
                        <Image src={passwordImage} alt='Password' style={{ width: '15px', height: '15px' }} />
                    </Button>
                    <Tooltip placement='top' isOpen={tooltipOpen} target='changeSettings' toggle={() => setTooltipOpen(!tooltipOpen)}>
                        Click to Configure Settings
                    </Tooltip>
                </>
            )}

            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Profile Settings</ModalHeader>
                <ModalBody>
                    <Label>Edit Email</Label>
                    <Card style={{ padding: '10px' }}>
                        <Label style={{ fontSize: '12px' }}>Email:</Label>
                        <Row>
                            <Col xs='10' style={{ paddingRight: '0px' }}>
                                <Input
                                    disabled={isEditingEmail ? false : true}
                                    placeholder='No email is associated with this account'
                                    name='email'
                                    value={email}
                                    onChange={(e) => onChangeEmail(e)}
                                />
                            </Col>
                            <Col xs='2' style={{ paddingLeft: '10px' }}>
                                {isEditingEmail ? (
                                    <Button onClick={() => saveEmail()}>Save</Button>
                                ) : (
                                    <Button onClick={() => toggleEditBtn()}>Edit</Button>
                                )}
                            </Col>
                        </Row>
                    </Card>
                    <br />
                    <Label>Change Password</Label>
                    <Card style={{ padding: '10px' }}>
                        <Form>
                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>New Password:</Label>
                                <InputGroup>
                                    <Input
                                        type={hiddenPassword ? 'password' : 'text'}
                                        name='newPassword'
                                        id='newPassword'
                                        placeholder='Enter your new password here.'
                                        autoComplete='new-password'
                                        onChange={(e) => validatePassword(e)}
                                        value={newPassword}
                                    />
                                    <div>
                                        <Button
                                            style={{
                                                backgroundColor: 'white',
                                                border: 'none'
                                            }}
                                            name='hiddenPassword'
                                            onClick={(e) => togglePWPrivacy(e)}
                                        >
                                            {hiddenPassword ? (
                                                <Image
                                                    src={hidePasswordImage}
                                                    alt='Icon made by Pixel perfect from www.flaticon.com'
                                                    style={{
                                                        width: '24px',
                                                        height: '24px'
                                                    }}
                                                />
                                            ) : (
                                                <Image
                                                    src={showPasswordImage}
                                                    alt='Icon made by Kiranshastry from www.flaticon.com'
                                                    style={{
                                                        width: '24px',
                                                        height: '24px'
                                                    }}
                                                />
                                            )}
                                        </Button>
                                    </div>
                                </InputGroup>
                            </FormGroup>
                            <FormGroup>
                                <Label style={{ fontSize: '12px' }}>Confirm Password:</Label>
                                <InputGroup>
                                    <Input
                                        valid={validConfirm}
                                        invalid={invalidConfirm}
                                        type={hiddenConfirm ? 'password' : 'text'}
                                        name='confirmPassword'
                                        id='confirmPassword'
                                        placeholder='Confirm your new password here.'
                                        autoComplete='off'
                                        onChange={(e) => validatePassword(e)}
                                        value={confirmPassword}
                                    />
                                    <div>
                                        <Button
                                            style={{
                                                backgroundColor: 'white',
                                                border: 'none'
                                            }}
                                            name='hiddenConfirm'
                                            onClick={(e) => togglePWPrivacy(e)}
                                        >
                                            {hiddenConfirm ? (
                                                <Image
                                                    src={hidePasswordImage}
                                                    alt='Icon made by Pixel perfect from www.flaticon.com'
                                                    style={{
                                                        width: '24px',
                                                        height: '24px'
                                                    }}
                                                />
                                            ) : (
                                                <Image
                                                    src={showPasswordImage}
                                                    alt='Icon made by Kiranshastry from www.flaticon.com'
                                                    style={{
                                                        width: '24px',
                                                        height: '24px'
                                                    }}
                                                />
                                            )}
                                        </Button>
                                    </div>
                                    <FormFeedback valid className='feedback'>
                                        The passwords match!
                                    </FormFeedback>
                                    <FormFeedback invalid={invalidConfirm.toString()} className='feedback'>
                                        The passwords do not match, please try again.
                                    </FormFeedback>
                                </InputGroup>
                            </FormGroup>
                        </Form>
                        <Button disabled={validConfirm ? false : true} block onClick={() => submitPassword()}>
                            Submit New Password
                        </Button>
                    </Card>
                </ModalBody>
            </Modal>
        </>
    );
}
