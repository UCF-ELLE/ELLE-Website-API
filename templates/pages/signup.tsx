import React from 'react';
import { Form, FormGroup, Label, Input, FormFeedback, Button, InputGroup, Card } from 'reactstrap';
import Link from 'next/link';
import axios from 'axios';

import '@/public/static/css/loginstyle.css';
import '@/public/static/css/style.css';
import '@/lib/ionicons/css/ionicons.min.css';
import diceImage from '@/public/static/images/dice.png';
import hideImage from '@/public/static/images/hide.png';
import showImage from '@/public/static/images/show.png';

import MainTemplate from '@/components/MainTemplate';
import Image from 'next/image';
import { useSignUp } from '@/hooks/useSignUp';
import { useUser } from '@/hooks/useUser';

export default function Signup() {
    const { signUp } = useSignUp();

    const [email, setEmail] = React.useState<string>('');
    const [username, setUsername] = React.useState<string>('');
    const [password, setPassword] = React.useState<string>('');
    const [confirmation, setConfirmation] = React.useState<string>('');
    const [validConfirm, setValidConfirm] = React.useState<boolean>(false);
    const [invalidConfirm, setInvalidConfirm] = React.useState<boolean>(false);
    const [hiddenPassword, setHiddenPassword] = React.useState<boolean>(true);
    const [hiddenConfirm, setHiddenConfirm] = React.useState<boolean>(true);
    const [classCode, setClassCode] = React.useState<string>('');
    const [permission, setPermission] = React.useState<string>('User');
    const [registerErr, setRegisterErr] = React.useState<boolean>(false);
    const [errorMsg, setErrorMsg] = React.useState<string | void>('');

    const { user } = useUser();

    const generateUsername = () => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .get('/elleapi/generateusername', header)
            .then((res) => {
                setUsername(res.data.username);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const validatePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.name === 'password') {
            setPassword(e.target.value);

            if ((e.target.value.length === 0 && confirmation.length === 0) || (e.target.value.length > 0 && confirmation.length === 0)) {
                setValidConfirm(false);
                setInvalidConfirm(false);
            } else if (e.target.value.localeCompare(confirmation) === 0) {
                setValidConfirm(true);
                setInvalidConfirm(false);
            } else {
                setValidConfirm(false);
                setInvalidConfirm(true);
            }
        } else {
            setConfirmation(e.target.value);

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

    const togglePWPrivacy = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (e.currentTarget.name === 'hiddenPassword') {
            setHiddenPassword(!hiddenPassword);
        } else {
            setHiddenConfirm(!hiddenConfirm);
        }
    };

    const submit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await signUp(username, email, password, confirmation, classCode);

        if ('error' in response) {
            setRegisterErr(true);
            setErrorMsg(response.error);
        }
    };

    const generateErrorMsg = () => {
        return <Card style={{ border: 'none', backgroundColor: 'transparent' }}>{errorMsg || 'An error occurred, please try again.'}</Card>;
    };

    return (
        <div className='signup-bg'>
            <MainTemplate />
            <div>
                <div className='login-form'>
                    <h4 style={{ textAlign: 'center', color: 'white' }}>Start your ELLE experience today.</h4>
                    {registerErr ? generateErrorMsg() : null}
                    <Form onSubmit={(e) => submit(e)} className='signup-form-details'>
                        <FormGroup>
                            <Label for='userName'>Username:</Label>
                            <InputGroup>
                                <Input
                                    value={username}
                                    id='username'
                                    name='username'
                                    placeholder='Roll the dice for a random username'
                                    autoComplete='off'
                                    disabled={true}
                                />
                                <div>
                                    <Button
                                        style={{
                                            backgroundColor: 'white',
                                            border: 'none'
                                        }}
                                        name='dice'
                                        onClick={() => generateUsername()}
                                    >
                                        <Image
                                            src={diceImage}
                                            alt='Icon made by Freepik from www.flaticon.com'
                                            style={{
                                                width: '24px',
                                                height: '24px'
                                            }}
                                        />
                                    </Button>
                                </div>
                            </InputGroup>
                        </FormGroup>
                        <FormGroup>
                            <Label for='classCode'>Email:</Label>
                            <Input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type='text'
                                id='email'
                                name='email'
                                placeholder='Optional'
                                autoComplete='off'
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for='password'>Password:</Label>
                            <InputGroup>
                                <Input
                                    value={password}
                                    onChange={(e) => validatePassword(e)}
                                    type={hiddenPassword ? 'password' : 'text'}
                                    id='password'
                                    name='password'
                                    placeholder='*********'
                                    autoComplete='new-password'
                                    style={{ border: 'none' }}
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
                                                src={hideImage}
                                                alt='Icon made by Pixel perfect from www.flaticon.com'
                                                style={{
                                                    width: '24px',
                                                    height: '24px'
                                                }}
                                            />
                                        ) : (
                                            <Image
                                                src={showImage}
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
                            <Label for='confirmation'>Confirm Password:</Label>
                            <InputGroup>
                                <Input
                                    value={confirmation}
                                    valid={validConfirm}
                                    invalid={invalidConfirm}
                                    onChange={(e) => validatePassword(e)}
                                    type={hiddenConfirm ? 'password' : 'text'}
                                    id='confirmation'
                                    name='confirmation'
                                    placeholder='*********'
                                    autoComplete='new-password'
                                    style={{ border: 'none' }}
                                />
                                <div>
                                    <Button
                                        style={{
                                            backgroundColor: 'white',
                                            border: 'none',
                                            borderRadius: '0 5px 5px 0'
                                        }}
                                        name='hiddenConfirm'
                                        onClick={(e) => togglePWPrivacy(e)}
                                    >
                                        {hiddenConfirm ? (
                                            <Image
                                                src={hideImage}
                                                alt='Icon made by Pixel perfect from www.flaticon.com'
                                                style={{
                                                    width: '24px',
                                                    height: '24px'
                                                }}
                                            />
                                        ) : (
                                            <Image
                                                src={showImage}
                                                alt='Icon made by Kiranshastry from www.flaticon.com'
                                                style={{
                                                    width: '24px',
                                                    height: '24px'
                                                }}
                                            />
                                        )}
                                    </Button>
                                </div>
                                <FormFeedback valid>The passwords match!</FormFeedback>
                                <FormFeedback invalid={invalidConfirm.toString()}>The passwords do not match, please try again.</FormFeedback>
                            </InputGroup>
                        </FormGroup>
                        <FormGroup>
                            <Label for='classCode'>Class Code:</Label>
                            <Input
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value)}
                                type='text'
                                id='classCode'
                                name='classCode'
                                placeholder='Optional'
                                autoComplete='off'
                            />
                        </FormGroup>
                        <Button color='primary' type='submit' className='btn-block' disabled={username.length > 0 && validConfirm ? false : true}>
                            Signup
                        </Button>
                    </Form>
                    <br></br>
                    <p>
                        Already have an account? &nbsp;
                        <Link
                            href='/Login'
                            style={{
                                color: '#007bff',
                                textDecoration: 'underline'
                            }}
                        >
                            Log in.
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
