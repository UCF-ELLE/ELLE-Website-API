import React from 'react';
import { Form, FormGroup, Label, Input, InputGroupAddon, FormFeedback, Button, Container, InputGroup, Card } from 'reactstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import MainTemplate from '../pages/MainTemplate';

import '../stylesheets/loginstyle.css';
import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/ionicons/css/ionicons.min.css';

export default class Signup extends React.Component {
  constructor() {
    super();
    this.state = {
      email: "", 
      username: "",
      password: "",
      confirmation: "",
      validConfirm: false,
      invalidConfirm: false,
      hiddenPassword: true,
      hiddenConfirm: true, 
      classCode: "",
      permission: 'User',
      registerErr: false, 
      errorMsg: ""
    }
    this.change = this.change.bind(this);
    this.submit = this.submit.bind(this);
  };

  change(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  generateUsername = () => {
    let header = {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('jwt') } 
    };

    axios.get(this.props.serviceIP + '/generateusername', header)
    .then(res => {
      this.setState({username: res.data.username});
    }).catch(error => {
      console.log(error);
    })
  }

  validatePassword = (e) => {
    let id = e.target.name === "password" ? 0 : 1; 

    this.setState({
      [e.target.name]: e.target.value
    })

    if (id === 0) {
      if ((e.target.value.length === 0 && this.state.confirmation.length === 0)|| 
        (e.target.value.length > 0 && this.state.confirmation.length === 0)) {
        this.setState({
          validConfirm: false, 
          invalidConfirm: false
        })
      }
      else if (e.target.value.localeCompare(this.state.confirmation) === 0) {
        this.setState({
          validConfirm: true, 
          invalidConfirm: false
        })
      }
      else {
        this.setState({
          validConfirm: false, 
          invalidConfirm: true
        })
      }
    }
    else {
      if ((e.target.value.length === 0 && this.state.password.length === 0)) {
        this.setState({
          validConfirm: false, 
          invalidConfirm: false
        })
      }
      else if (e.target.value.localeCompare(this.state.password) === 0) {
        this.setState({
          validConfirm: true, 
          invalidConfirm: false
        })
      }
      else {
        this.setState({
          validConfirm: false, 
          invalidConfirm: true
        })
      }
    }
  }

  togglePWPrivacy = (e) => {
    if (e.target.name === "hiddenPassword") {
      this.setState({
        hiddenPassword: !this.state.hiddenPassword
      })
    }
    else {
      this.setState({
        hiddenConfirm: !this.state.hiddenConfirm
      })
    }
  }

  submit(e) {
    e.preventDefault();

    var data = {
      username: this.state.username,
      email: this.state.email,
      password: this.state.password,
      password_confirm: this.state.confirmation,
      groupCode: this.state.classCode
    }

    axios.post(this.props.serviceIP + '/register', data)
    .then(res => {
      localStorage.setItem('jwt', res.data);
      this.setState({registerErr: false}); 
      this.props.history.push('/login');
    })
    .catch(error => {
      if (error.response.data !== undefined) {
        console.log("signup error", error.response.data); 

        this.setState({
          registerErr : true,
          errorMsg : error.response.data.Error
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
    <div className="signup-bg">
      <MainTemplate/>
      
      <div>
        <div className="login-form">
          <h4 style={{textAlign: 'center', color: "white"}}>Start your ELLE experience today.</h4>
          {this.state.registerErr ? this.generateErrorMsg() : null}
          <Form onSubmit={e => this.submit(e)} className="signup-form-details">
            <FormGroup> 
              <Label for="userName">Username:</Label>
              <InputGroup>
                <Input value={this.state.username}
                  id="username"
                  name="username"
                  placeholder="Roll the dice for a random username"
                  autoComplete="off"
                  disabled={true}
                />
                <InputGroupAddon addonType="append">
                  <Button 
                    style={{backgroundColor: "white", border: "none"}}
                    name="dice"
                    onClick={() => this.generateUsername()}
                  >
                    <img 
                      src={require('../Images/dice.png')} 
                      alt="Icon made by Freepik from www.flaticon.com" 
                      name="dice"
                      style={{width: '24px', height: '24px'}}
                    />
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </FormGroup>
            <FormGroup>
              <Label for="classCode">Email:</Label>
              <Input 
                value={this.state.email}
                onChange={e => this.change(e)}
                type="text"
                id="email"
                name="email"
                placeholder="Optional"
                autoComplete="off"
              />
            </FormGroup>
            <FormGroup>
            <Label for="password">Password:</Label>
            <InputGroup>
              <Input 
                value={this.state.password}
                onChange={e => this.validatePassword(e)}
                type={this.state.hiddenPassword ? 'password' : 'text'}
                id="password"
                name="password"
                placeholder="*********"
                autoComplete="new-password"
                style={{border: "none"}} 
              />
              <InputGroupAddon addonType="append">
                <Button 
                  style={{backgroundColor: "white", border: "none"}}
                  name="hiddenPassword"
                  onClick={e => this.togglePWPrivacy(e)}
                >
                {this.state.hiddenPassword ?
                  <img 
                    src={require('../Images/hide.png')} 
                    alt="Icon made by Pixel perfect from www.flaticon.com" 
                    name="hiddenPassword"
                    style={{width: '24px', height: '24px'}}
                  />
                :
                  <img 
                    src={require('../Images/show.png')} 
                    alt="Icon made by Kiranshastry from www.flaticon.com" 
                    name="hiddenPassword"
                    style={{width: '24px', height: '24px'}}
                  />
                }
                </Button>
              </InputGroupAddon>
            </InputGroup>
            </FormGroup>
            <FormGroup>
              <Label for="confirmation">Confirm Password:</Label>
              <InputGroup>
                <Input 
                  value={this.state.confirmation}
                  valid={this.state.validConfirm}
                  invalid={this.state.invalidConfirm}
                  onChange={e => this.validatePassword(e)}
                  type={this.state.hiddenConfirm ? 'password' : 'text'}
                  id="confirmation"
                  name="confirmation"
                  placeholder="*********" 
                  autoComplete="new-password"
                  style={{border: "none"}} 
                />
                <InputGroupAddon addonType="append">
                  <Button 
                    style={{backgroundColor: "white", border: "none", borderRadius: "0 5px 5px 0"}} 
                    name="hiddenConfirm"
                    onClick={e => this.togglePWPrivacy(e)}
                  >
                  {this.state.hiddenConfirm ? 
                    <img 
                      src={require('../Images/hide.png')} 
                      alt="Icon made by Pixel perfect from www.flaticon.com" 
                      name="hiddenConfirm"
                      style={{width: '24px', height: '24px'}}
                    />
                  :
                    <img 
                      src={require('../Images/show.png')} 
                      alt="Icon made by Kiranshastry from www.flaticon.com" 
                      name="hiddenConfirm"
                      style={{width: '24px', height: '24px'}}
                    />
                  }
                  </Button>
                </InputGroupAddon>
                <FormFeedback valid>
                  The passwords match!
                </FormFeedback>
                <FormFeedback invalid={this.state.invalidConfirm.toString()}>
                  The passwords do not match, please try again.
                </FormFeedback>
              </InputGroup>
            </FormGroup>
            <FormGroup>
              <Label for="classCode">Class Code:</Label>
              <Input 
                value={this.state.classCode}
                onChange={e => this.change(e)}
                type="text"
                id="classCode"
                name="classCode"
                placeholder="Optional"
                autoComplete="off"
              />
            </FormGroup>
            <Button 
              color="primary" 
              type="submit" 
              className="btn-block"
              disabled={this.state.username.length > 0 && this.state.validConfirm ? false : true}
            >
              Signup
            </Button>
          </Form>
          <br></br>
          <p>
            Already have an account? &nbsp;
            <Link to ='/Login' style={{color: '#007bff', textDecoration: 'underline'}}>Log in.</Link>
          </p>
        </div>
      </div>
    </div>
    );
    }
  }
