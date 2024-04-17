import Layout from '@/app/layout';
import { useUser } from '@/hooks/useUser';
import '@/public/static/css/loginstyle.css';
import hideImage from '@/public/static/images/hide.png';
import showImage from '@/public/static/images/show.png';
import axios from 'axios';
import Image from 'next/image';
import React, { useState } from 'react';
import { Alert, Button, Form, FormFeedback, FormGroup, Input, InputGroup, Label } from 'reactstrap';

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [validConfirm, setValidConfirm] = useState(false);
    const [invalidConfirm, setInvalidConfirm] = useState(false);
    const [hiddenPassword, setHiddenPassword] = useState(true);
    const [hiddenConfirm, setHiddenConfirm] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);
    const [msg, setMsg] = useState('');
    const { user } = useUser();

    const validatePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        let id = e.target.name === 'password' ? 0 : 1;

        if (id === 0) setPassword(e.target.value);
        else setConfirm(e.target.value);

        if (id === 0) {
            if ((e.target.value.length === 0 && confirm.length === 0) || (e.target.value.length > 0 && confirm.length === 0)) {
                setValidConfirm(false);
                setInvalidConfirm(false);
            } else if (e.target.value.localeCompare(confirm) === 0) {
                setValidConfirm(true);
                setInvalidConfirm(false);
            } else {
                setValidConfirm(false);
                setInvalidConfirm(true);
            }
        } else {
            if (e.target.value.length === 0 && password.length === 0) {
                setValidConfirm(false);
                setInvalidConfirm(false);
            } else if (e.target.value.localeCompare(password) === 0) {
                setValidConfirm(true);
                setInvalidConfirm(false);
            } else {
                setValidConfirm(false);
                setInvalidConfirm(true);
            }
        }
    };

    const togglePWPrivacy = (name: string) => {
        if (name === 'hiddenPassword') {
            setHiddenPassword(!hiddenPassword);
        } else {
            setHiddenConfirm(!hiddenConfirm);
        }
    };

    const resetPassword = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        let data = {
            email: email,
            resetToken: token,
            password: password,
            confirmPassword: confirm
        };

        axios
            .post('/elleapi/resetpassword', data, header)
            .then((res) => {
                setSuccess(true);
                setError(false);
                setMsg(res.data.Message);
                resetField();
            })
            .catch((error) => {
                if (error.response) {
                    setSuccess(false);
                    setError(true);
                    setMsg(error.response.data.Error);
                }
            });
    };

    const resetField = () => {
        setEmail('');
        setToken('');
        setPassword('');
        setConfirm('');
        setValidConfirm(false);
        setInvalidConfirm(false);
        setHiddenPassword(true);
        setHiddenConfirm(true);
    };

    return (
        <Layout>
            <div className='reset-bg'>
                <div className='row main' style={{ margin: 0 }}>
                    <div className='reset-box' style={{ marginTop: 20 }}>
                        <h4 style={{ display: 'flex', justifyContent: 'center' }}>Reset Your Password</h4>
                        {success ? <Alert color='success'>{msg}</Alert> : null}
                        {error ? <Alert color='danger'>{msg}</Alert> : null}
                        <Form onSubmit={(e) => resetPassword(e)} style={{ marginBottom: '10px' }}>
                            <FormGroup>
                                <Label>Email:</Label>
                                <InputGroup style={{ borderRadius: '12px' }}>
                                    <Input placeholder='user@email.com' name='email' value={email} onChange={(e) => setEmail(e.target.value)} />
                                </InputGroup>
                            </FormGroup>
                            <FormGroup>
                                <Label>ResetToken:</Label>
                                <InputGroup style={{ borderRadius: '12px' }}>
                                    <Input placeholder='token' name='token' value={token} onChange={(e) => setToken(e.target.value)} />
                                </InputGroup>
                            </FormGroup>
                            <FormGroup>
                                <Label>Password:</Label>
                                <InputGroup style={{ borderRadius: '12px' }}>
                                    <Input
                                        value={password}
                                        onChange={(e) => validatePassword(e)}
                                        type={hiddenPassword ? 'password' : 'text'}
                                        name='password'
                                        placeholder='*********'
                                        autoComplete='new-password'
                                        style={{ border: 'none' }}
                                    />
                                    <div>
                                        <Button
                                            style={{ backgroundColor: 'white', border: 'none' }}
                                            name='hiddenPassword'
                                            onClick={() => togglePWPrivacy('hiddenPassword')}
                                        >
                                            {hiddenPassword ? (
                                                <Image
                                                    src={hideImage}
                                                    alt='Icon made by Pixel perfect from www.flaticon.com'
                                                    style={{ width: '24px', height: '24px' }}
                                                />
                                            ) : (
                                                <Image
                                                    src={showImage}
                                                    alt='Icon made by Kiranshastry from www.flaticon.com'
                                                    style={{ width: '24px', height: '24px' }}
                                                />
                                            )}
                                        </Button>
                                    </div>
                                </InputGroup>
                            </FormGroup>
                            <FormGroup>
                                <Label>Confirm Password:</Label>
                                <InputGroup style={{ borderRadius: '12px' }}>
                                    <Input
                                        value={confirm}
                                        valid={validConfirm}
                                        invalid={invalidConfirm}
                                        onChange={(e) => validatePassword(e)}
                                        type={hiddenConfirm ? 'password' : 'text'}
                                        name='confirm'
                                        placeholder='*********'
                                        autoComplete='new-password'
                                        style={{ border: 'none' }}
                                    />
                                    <div>
                                        <Button
                                            style={{ backgroundColor: 'white', border: 'none', borderRadius: '0 5px 5px 0' }}
                                            name='hiddenConfirm'
                                            onClick={() => togglePWPrivacy('hiddenConfirm')}
                                        >
                                            {hiddenConfirm ? (
                                                <Image
                                                    src={hideImage}
                                                    alt='Icon made by Pixel perfect from www.flaticon.com'
                                                    style={{ width: '24px', height: '24px' }}
                                                />
                                            ) : (
                                                <Image
                                                    src={showImage}
                                                    alt='Icon made by Kiranshastry from www.flaticon.com'
                                                    style={{ width: '24px', height: '24px' }}
                                                />
                                            )}
                                        </Button>
                                    </div>
                                    <FormFeedback valid>The passwords match!</FormFeedback>
                                    <FormFeedback invalid={invalidConfirm.toString()}>The passwords do not match, please try again.</FormFeedback>
                                </InputGroup>
                            </FormGroup>
                            <Button block type='submit' disabled={validConfirm ? false : true}>
                                Reset
                            </Button>
                        </Form>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
