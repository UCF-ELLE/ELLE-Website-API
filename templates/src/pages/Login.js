import React, { Component } from 'react';
import { Button, Form, FormGroup, Input, Label, Card } from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MainTemplate from '../pages/MainTemplate';

import '../stylesheets/loginstyle.css';
import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/ionicons/css/ionicons.min.css';

export default class Login extends Component {
  constructor() {
    super();
    this.state = {
      username: '',
      password: '',
      loginErr: false, 
      errorMsg: ""
    };
    this.change = this.change.bind(this);
    this.submit = this.submit.bind(this);
  }

  change(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  submit(e) {
    e.preventDefault();

    axios.post(this.props.serviceIP + '/login', {
      username: this.state.username,
      password: this.state.password   
    }).then(res => {
      var jwtDecode = require('jwt-decode');

      localStorage.setItem('jwt', res.data.access_token); 

      var decoded = jwtDecode(res.data.access_token);
  
      localStorage.setItem('per', decoded.user_claims.permission);

      localStorage.setItem('id', decoded.identity);

      let user = {
        username: this.state.username, 
        userID: decoded.identity,
        permission: decoded.user_claims.permission
      }

      this.setState({loginErr : false});
      this.props.updateUserInfo(user); 

      this.props.history.push('/profile');
    }).catch(error => {
      if (error.response !== undefined) {
        console.log("login error", error.response.data); 

        this.setState({
          loginErr : true,
          errorMsg : error.response.data.message
        }); 

      }
    });
  }

  generateErrorMsg = () => {
    return (
      <Card style={{border: "none", backgroundColor: "transparent"}}>
        {this.state.errorMsg}
      </Card>
    )
  }

  render() {
    return (
    <div className="login-bg">
      <MainTemplate/>

      <div className="row main" >
        <div className="login-form">
          <h4 style={{textAlign: 'center'}}>Welcome back to ELLE.</h4>
          {this.state.loginErr ? this.generateErrorMsg() : null}
          <Form onSubmit={e => this.submit(e)}>
            <FormGroup>
              <Label for="userName">Username:</Label>
              <Input type="username" name="username"
                onChange={e => this.change(e)}
                value={this.state.username}
                id="username" placeholder="Username" />
                <Link 
                  to ='/forgotusername' 
                  style={{color: '#007bff', textDecoration: 'underline', fontSize: "small", float: "right"}}>
                  Forgot your username? 
                </Link>
            </FormGroup>
            {' '}
            <FormGroup>
              <Label for="password">Password:</Label>
              <Input type="password" name="password"
                onChange={e => this.change(e)}
                value={this.state.password}
                id="password" placeholder="Password" />
              <Link 
                to ='/forgotpassword' 
                style={{color: '#007bff', textDecoration: 'underline', fontSize: "small", float: "right"}}>
                Forgot your password? 
              </Link>
            </FormGroup>
            <br />
            <Button color="primary" type="submit" className="btn-block">Submit</Button>
          </Form>
          <br></br>
					<p>
						Don't have an account? &nbsp;
						<Link to ='/register' style={{color: '#007bff', textDecoration: 'underline'}}>Create one.</Link>
					</p>
        </div>
      </div>
    </div>
    );
  }
}
