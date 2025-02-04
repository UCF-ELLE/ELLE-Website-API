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
                    width: '500px',
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
        <div className="login-bg">
            <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
              <div className="login-form p-4 shadow rounded" style={{ maxWidth: '500px', width: '100%' }}>
                <h4 className="text-center mb-4">Welcome back to ELLE.</h4>
                <Form onSubmit={(e) => submit(e)}>
                  <FormGroup>
                    <Label for="userName">Username:</Label>
                    <Input
                      type="text"
                      name="username"
                      onChange={(e) => setUsername(e.target.value)}
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
                  </FormGroup>
          
                  <FormGroup>
                    <Label for="password">Password:</Label>
                    <Input
                      type="password"
                      name="password"
                      onChange={(e) => setPassword(e.target.value)}
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
                  <Button color="primary" type="submit" className="btn-block">
                    Submit
                  </Button>
                  {loginErr && generateErrorMsg()}
                </Form>
          
                <p className="text-center mt-3">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" style={{ color: '#007bff', textDecoration: 'underline' }}>
                    Create one.
                  </Link>
                </p>
              </div>
            </div>
          </div>          
    );
}

Login.getLayout = (page: React.JSX.Element) => <Layout noFooter>{page}</Layout>;
