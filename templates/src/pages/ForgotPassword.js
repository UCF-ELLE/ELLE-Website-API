import React, { Component } from 'react';
import { Button, Input, Label, Row, Col, Modal, ModalHeader, ModalBody, Alert } from 'reactstrap';
import axios from 'axios';
import MainTemplate from '../pages/MainTemplate';

export default class ForgotPassword extends Component {
  constructor() {
    super();
    this.state = {
      helpModalOpen: false, 
      emailModalOpen: false,
      email: "",
      alertOpen: false
    };

  }

  change(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  toggleHelpModal = () => {
    this.setState({ helpModalOpen: !this.state.helpModalOpen }); 
  }

  toggleEmailModal = () => {
    this.setState({ 
        emailModalOpen: !this.state.emailModalOpen,
        email: "",
        alertOpen: false
    });
  }

  sendEmail = () => {
    let header = {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
    }

    axios.post(this.props.serviceIP + '/forgotpassword', { email: this.state.email }, header)
    .then(res => {
      this.setState({ alertOpen: true });
    }).catch(error => {
      console.log("forgot pw error: ", error); 
    })
  }

  render() {
    return (
        <div className="forgot-bg">
        <MainTemplate/>
        <div style={{margin: "10%"}}>
            <div className="forgot-box">
                <h4 style={{display: "flex", justifyContent: "center", margin: "10px"}}>
                    Forgot your Password?
                </h4>
                <Row style={{display: "flex", justifyContent: "center", margin: "10px"}}>
                    Do you have an email associated with your account?
                </Row>
                <Row style={{marginBottom: "10px"}}>
                  <Col style={{display: "flex", justifyContent: "center"}}>
                      <Button style={{fontWeight: "bold"}} onClick={() => this.toggleEmailModal()}>
                          Yes, I do!
                      </Button>
                  </Col>
                  <Col style={{display: "flex", justifyContent: "center"}}>
                      <Button style={{fontWeight: "bold"}} onClick={() => this.toggleHelpModal()}>
                          No, I do not.
                      </Button>
                  </Col>
                </Row>
            </div>

            <Modal isOpen={this.state.emailModalOpen} toggle={() => this.toggleEmailModal()}>
                <ModalHeader toggle={() => this.toggleEmailModal()}>Send me an email</ModalHeader>
                <ModalBody>
                    {this.state.alertOpen ?
                    <Alert color="info" style={{fontSize: "small"}}>
                        If there's an user associated with the provided email, 
                        we will send information on how to reset your password. 
                        If you have not received it within 15 minutes, 
                        please check under junk or spam emails.
                    </Alert>
                    : null}
                    <Label>Email:</Label>
                    <Row>
                        <Col xs="10">
                            <Input 
                                placeholder="user@email.com"
                                name="email"
                                value={this.state.email}
                                onChange={e => this.change(e)}
                            />
                        </Col>
                        <Col xs="2" style={{padding: "0"}}>
                            <Button onClick={() => this.sendEmail()}>Send</Button>
                        </Col>
                    </Row>
                </ModalBody>
            </Modal>

            <Modal isOpen={this.state.helpModalOpen} toggle={() => this.toggleHelpModal()}>
                <ModalHeader toggle={() => this.toggleHelpModal()}>Help</ModalHeader>
                <ModalBody>
                    Please ask your professor or the super admin to reset your password.
                </ModalBody>
            </Modal>
        </div>
        </div>
    );
  }
}