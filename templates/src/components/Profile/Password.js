import React, { Component } from 'react'
import { Button, Tooltip, Modal, ModalHeader, ModalBody, Row, Col, Card,
    Form, FormGroup, Label, InputGroup, Input, InputGroupAddon, FormFeedback } from 'reactstrap';
import axios from 'axios';

export default class Password extends Component {
	constructor(props){
		super(props);

		this.state = {
            newPassword: "",
            confirmPassword: "",
            validConfirm: false,
            invalidConfirm: false, 
            hiddenPassword: true,
            hiddenConfirm: true, 

            tooltipOpen: false,
            modalOpen: false, 
            editEmail: false,
        }
    }

    validatePassword = (e) => {
        let id = e.target.name === "newPassword" ? 0 : 1; 
    
        this.setState({
          [e.target.name]: e.target.value
        })
    
        if (id === 0) {
          if ((e.target.value.length === 0 && this.state.confirmPassword.length === 0)|| 
            (e.target.value.length > 0 && this.state.confirmPassword.length === 0)) {
            this.setState({
              validConfirm: false, 
              invalidConfirm: false
            })
          }
          else if (e.target.value.localeCompare(this.state.confirmPassword) === 0) {
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
          if ((e.target.value.length === 0 && this.state.newPassword.length === 0)) {
            this.setState({
              validConfirm: false, 
              invalidConfirm: false
            })
          }
          else if (e.target.value.localeCompare(this.state.newPassword) === 0) {
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

    submitPassword = () => {
        var data = {
          password: this.state.newPassword
        }
        var headers = {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
  
        axios.post(this.props.serviceIP + '/changepassword', data, {headers:headers})
        .then(res => {
          this.toggleModal(); 
        }).catch(function (error) {
          console.log(error.response);
        });
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

    toggleModal = () => {
        this.setState({
          modalOpen: !this.state.modalOpen, 
          newPassword: "", 
          confirmPassword: "", 
          validConfirm: false, 
          invalidConfirm: false, 
          editEmail: false
        })
    }

    onChangeEmail = (e) => {
      this.props.editEmail(e); 
    }

    toggleEditBtn = () => {
      this.setState({ editEmail : !this.state.editEmail }); 
    }

    saveEmail = () => {
      var data = {
        newEmail: this.props.email
      }

      let header = {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
      }

      axios.put(this.props.serviceIP + '/user', data, header)
      .then(res => {
        this.toggleEditBtn();
      }).catch(error => {
        console.log(error); 
      })
    }
  

	render() { 
        return (
            <>
                {this.props.userType === "su" 
                ?
                    <p className="setting" onClick={() => this.toggleModal()}> settings </p> 
                :
                    <>
                        <Button id="changeSettings" style={{backgroundColor: "aliceblue", float: "right", border: "none", borderRadius: "0 3px 3px 0"}}
                            onClick={() => this.toggleModal()}> 
                            <img src={require('../../Images/password.png')} style={{width: "15px", height: "15px"}}/>
                        </Button>
                        <Tooltip placement="top" isOpen={this.state.tooltipOpen} target="changeSettings" toggle={this.toggleTooltipOpen}>
                            Click to Configure Settings 
                        </Tooltip>
                    </>
                }

                <Modal isOpen={this.state.modalOpen} toggle={this.toggleModal}>
                    <ModalHeader toggle={this.toggleModal}>Profile Settings</ModalHeader>
                        <ModalBody>
                          <Label>Edit Email</Label>
                          <Card style={{padding: "10px"}}>
                            <Label style={{fontSize: "12px"}}>Email:</Label>
                            <Row>
                              <Col xs="10" style={{paddingRight: "0px"}}>
                                <Input 
                                  disabled={this.state.editEmail ? false : true}
                                  placeholder="No email is associated with this account"
                                  name="email"
                                  value={this.props.email}
                                  onChange={e => this.onChangeEmail(e)}
                                />
                              </Col>
                              <Col xs="2" style={{paddingLeft: "10px"}}>
                                {this.state.editEmail ? 
                                <Button onClick={() => this.saveEmail()}>Save</Button> : 
                                <Button onClick={() => this.toggleEditBtn()}>Edit</Button>}
                              </Col>
                            </Row>
                          </Card>
                          <br />
                          <Label>Change Password</Label>
                          <Card style={{padding: "10px"}}>
                            <Form>
                                <FormGroup>
                                <Label style={{fontSize: "12px"}}>New Password:</Label>
                                <InputGroup>
                                <Input 
                                    type={this.state.hiddenPassword ? 'password' : 'text'}
                                    name="newPassword"
                                    id="newPassword"
                                    placeholder="Enter your new password here."
                                    autoComplete="new-password"
                                    onChange={e => this.validatePassword(e)}
                                    value={this.state.newPassword}
                                />
                                <InputGroupAddon addonType="append">
                                    <Button 
                                        style={{backgroundColor: "white", border: "none"}} 
                                        name="hiddenPassword"
                                        onClick={e => this.togglePWPrivacy(e)}
                                    >
                                        {this.state.hiddenPassword ?
                                            <img 
                                                src={require('../../Images/hide.png')} 
                                                alt="Icon made by Pixel perfect from www.flaticon.com" 
                                                name="hiddenPassword"
                                                style={{width: '24px', height: '24px'}}
                                            />
                                            :
                                            <img 
                                                src={require('../../Images/show.png')} 
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
                                    <Label style={{fontSize: "12px"}}>Confirm Password:</Label>
                                    <InputGroup>
                                        <Input 
                                            valid={this.state.validConfirm}
                                            invalid={this.state.invalidConfirm}
                                            type={this.state.hiddenConfirm ? 'password' : 'text'}
                                            name="confirmPassword"
                                            id="confirmPassword"
                                            placeholder="Confirm your new password here."
                                            autoComplete="off"
                                            onChange={e => this.validatePassword(e)}
                                            value={this.state.confirmPassword}
                                        />
                                        <InputGroupAddon addonType="append">
                                            <Button 
                                                style={{backgroundColor: "white", border: "none"}} 
                                                name="hiddenConfirm"
                                                onClick={e => this.togglePWPrivacy(e)}
                                            >
                                                {this.state.hiddenConfirm ?
                                                    <img 
                                                        src={require('../../Images/hide.png')} 
                                                        alt="Icon made by Pixel perfect from www.flaticon.com" 
                                                        name="hiddenConfirm"
                                                        style={{width: '24px', height: '24px'}}
                                                    />
                                                    :
                                                    <img 
                                                        src={require('../../Images/show.png')} 
                                                        alt="Icon made by Kiranshastry from www.flaticon.com" 
                                                        name="hiddenConfirm"
                                                        style={{width: '24px', height: '24px'}}
                                                    />
                                                }
                                            </Button>
                                        </InputGroupAddon>
                                        <FormFeedback valid className="feedback">
                                            The passwords match!
                                        </FormFeedback>
                                        <FormFeedback invalid={this.state.invalidConfirm.toString()} className="feedback">
                                            The passwords do not match, please try again.
                                        </FormFeedback>
                                    </InputGroup>
                                </FormGroup>
                            </Form>
                            <Button disabled={this.state.validConfirm ? false : true} block onClick={() => this.submitPassword()}>
                              Submit New Password
                            </Button>
                          </Card>
                    </ModalBody>
                </Modal>
            </>
        );
    }
}