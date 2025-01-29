import Layout from '@/components/Layouts/Layout';
import Link from 'next/link';
import React, { FormEvent, useState } from 'react';
import { Button, Card, Form, FormGroup, Input, Label } from 'reactstrap';

import { useAuth } from '@/hooks/useAuth';
import '@/lib/ionicons/css/ionicons.min.css';
import '@/public/static/css/loginstyle.css';
import '@/public/static/css/style.css';

export default function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loginErr, setLoginErr] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');

    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoginErr(false);
        setErrorMsg('');

        // Redirects to profile page if login is successful
        const loginVar = await login(username, password);
        console.log('login error', loginVar);
        if (loginVar && 'error' in loginVar) {
            setLoginErr(true);
            setErrorMsg(loginVar.error);
        }
    };

    const generateErrorMsg = () => {
        return (
            <Card
                style={{
                    width: '50px',
                    height: '30px',
                    border: 'none',
                    fontSize: '20px',
                    backgroundColor: 'transparent',
                    color: 'red'
                }}
            >
                {errorMsg}
            </Card>
        );
    };

    return (
        <div className='login-bg'>
            <div className='row main' style={{ margin: 0 }}>
                <div className='login-form' style={{ marginTop: 20 }}>
                    <h4 style={{ textAlign: 'center' }}>Welcome back to ELLE.</h4>
                    <Form onSubmit={(e) => submit(e)}>
                        <FormGroup>
                            <Label for='userName'>Username:</Label>
                            <Input
                                type='text'
                                name='username'
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                                id='username'
                                placeholder='Username'
                            />
                            <Link
                                href='/forgotusername'
                                style={{
                                    color: '#007bff',
                                    textDecoration: 'underline',
                                    fontSize: 'small',
                                    float: 'right'
                                }}
                            >
                                Forgot your username?
                            </Link>
                        </FormGroup>{' '}
                        <FormGroup>
                            <Label for='password'>Password:</Label>
                            <Input
                                type='password'
                                name='password'
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                id='password'
                                placeholder='Password'
                            />
                            <Link
                                href='/forgotpassword'
                                style={{
                                    color: '#007bff',
                                    textDecoration: 'underline',
                                    fontSize: 'small',
                                    float: 'right'
                                }}
                            >
                                Forgot your password?
                            </Link>
                        </FormGroup>
                        <br />
                        <Button color='primary' type='submit' className='btn-block'>
                            Submit
                        </Button>
                        <br />
                        {loginErr ? generateErrorMsg() : null}
                    </Form>
                    <br></br>
                    <p>
                        Don&apos;t have an account?&nbsp;
                        <Link
                            href='/signup'
                            style={{
                                color: '#007bff',
                                textDecoration: 'underline'
                            }}
                        >
                            Create one.
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

Login.getLayout = (page: React.JSX.Element) => <Layout noFooter>{page}</Layout>;
