import React, { useState, FormEvent } from 'react';
import { Button, Form, FormGroup, Input, Label, Card } from 'reactstrap';
import { AuthContextType, useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Layout from '@/app/layout';

import '@/public/static/css/loginstyle.css';
import '@/public/static/css/style.css';
import '@/lib/bootstrap/css/bootstrap.min.css';
import '@/lib/ionicons/css/ionicons.min.css';

export default function Login() {
    const { login } = useAuth() as AuthContextType;
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loginErr, setLoginErr] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>('');

    const submit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoginErr(false);
        setErrorMsg('');

        const loginVar = login(username, password);
        const response = await loginVar;
        console.log(loginVar);
        console.log('sdhajskld', response);
        if (typeof response === 'string') {
            setLoginErr(true);
            setErrorMsg(response as string);
        }
    };

    const generateErrorMsg = () => {
        return (
            <Card
                style={{
                    width: '500px',
                    height: '30px',
                    border: 'none',
                    fontSize: '20px',
                    backgroundColor: 'transparent',
                    color: 'red',
                }}
            >
                {errorMsg}
            </Card>
        );
    };

    return (
        <Layout noFooter>
            <div className="login-bg">
                <div className="row main" style={{ margin: 0 }}>
                    <div className="login-form">
                        <h4 style={{ textAlign: 'center' }}>
                            Welcome back to ELLE.
                        </h4>
                        <Form onSubmit={(e) => submit(e)}>
                            <FormGroup>
                                <Label for="userName">Username:</Label>
                                <Input
                                    type="text"
                                    name="username"
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    value={username}
                                    id="username"
                                    placeholder="Username"
                                />
                                <Link
                                    href="/forgotusername"
                                    style={{
                                        color: '#007bff',
                                        textDecoration: 'underline',
                                        fontSize: 'small',
                                        float: 'right',
                                    }}
                                >
                                    Forgot your username?
                                </Link>
                            </FormGroup>{' '}
                            <FormGroup>
                                <Label for="password">Password:</Label>
                                <Input
                                    type="password"
                                    name="password"
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    value={password}
                                    id="password"
                                    placeholder="Password"
                                />
                                <Link
                                    href="/forgotpassword"
                                    style={{
                                        color: '#007bff',
                                        textDecoration: 'underline',
                                        fontSize: 'small',
                                        float: 'right',
                                    }}
                                >
                                    Forgot your password?
                                </Link>
                            </FormGroup>
                            <br />
                            <Button
                                color="primary"
                                type="submit"
                                className="btn-block"
                            >
                                Submit
                            </Button>
                            <br />
                            {loginErr ? generateErrorMsg() : null}
                        </Form>
                        <br></br>
                        <p>
                            Don&apos;t have an account?&nbsp;
                            <Link
                                href="/register"
                                style={{
                                    color: '#007bff',
                                    textDecoration: 'underline',
                                }}
                            >
                                Create one.
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
