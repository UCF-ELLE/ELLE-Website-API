import React, { Component } from 'react';
import { Container, Row, Col, Button, Card, Form, FormGroup, Label, Input, CustomInput, Alert } from 'reactstrap';
import axios from 'axios';

import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/ionicons/css/ionicons.min.css';
import Template from './Template';
import Loading from '../components/Loading/Loading';
import Session from '../components/Sessions/Session';
import Downloads from '../components/Sessions/Downloads';

export default class Sessions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      permission: this.props.user.permission,
      platform: "",
      userID: "",
      username: "",
      moduleID: "",
      date: "",
      sessions: [],
      LoggedAnswers: [],
      loading: false,
      searched: false,
    }

  }

  componentDidMount() {
    this.verifyPermission();
  }

  verifyPermission = () => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      this.props.history.push('/home');
    }
    else {
      var jwtDecode = require('jwt-decode');
      var decoded = jwtDecode(jwt);
      this.setState({ permission: decoded.user_claims.permission }); 
    }
  }

  handleChange = (e) => {
    this.setState({ [e.target.name] : e.target.id });
  }

  handleInput = (e) => {
    this.setState({ [e.target.name] : e.target.value });
  }

  clearInputs = () => {
    this.setState({
      platform: "",
      userID: "",
      username: "",
      moduleID: "",
      date: ""
    })
  }

  handleSearch = (e) => {
    this.setState({ 
      loading: true
    });

    this.searchSession(); 
  }

  searchSession = () => {
    let header = {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
      params: {
        moduleID: this.state.moduleID.length !== 0 ? parseInt(this.state.moduleID) : null, 
        userID: this.state.userID.length !== 0 ? parseInt(this.state.userID) : null, 
        userName: this.state.username.length !== 0 ? this.state.username : null,
        platform: this.state.platform.length !== 0 ? this.state.platform : null,
        sessionDate: this.state.date.length !== 0 ? this.state.date : null
      }  
    };

    axios.get(this.props.serviceIP + '/searchsessions', header)
    .then(res => {

      this.setState(()=>{
        window.setTimeout(()=>{
          this.setState({ 
            sessions : res.data,  
            loading: false, 
            searched: true
          })
        },1000)
      });

    }).catch(function (error) {
      console.log(error);
    });
  }

  render() {
    return (
      <Container>
      <Template permission={this.state.permission}/>
      <br /><br />
      <Row>
        <Col xs="4">
          <h3>Your ELLE Sessions:</h3>
        </Col>
        <Col xs={this.state.permission === "su" ? "6" : "8"} style={{padding: this.state.permission === "su" ?  "0 0 0 30px" :  "0 30px 0 30px"}}>
          {this.state.searched && this.state.sessions.length !== 0 && this.state.loading === false ? 
            <Alert color="info" style={{margin: "0px", textAlign: "center"}}>Click on a row to reveal logged answers.</Alert>
          : null}
        </Col>
        {this.state.permission === "su" ? 
        <Col xs="2" style={{padding: "0px"}}>
          <Downloads serviceIP={this.props.serviceIP}/> 
        </Col>
        : null}
      </Row>

      <br />

      <Row className="Seperated Col">
        <Col className="Left Column" xs="4">
          <Row>
            <Col>
              <Card style={{padding: "20px"}}>
                <Form>
                  <FormGroup>
                    <Label for="platform">Platform <a style={{fontSize: "10px", color: "red"}}>*Only select to filter based on a platform</a></Label>
                    <div style={{display: "flex", justifyContent: "center"}}>
                      <CustomInput type="radio" id="mb" name="platform" inline checked={this.state.platform === 'mb'} onChange={e => this.handleChange(e)}>
                        <img style={{width: "20px", height: "20px", marginLeft: "20px", marginRight: "5px"}} src={require('../Images/phoneGames.png')} alt="phone icon" />
                        Mobile
                      </CustomInput>
                      <CustomInput type="radio" id="cp" name="platform" inline checked={this.state.platform === 'cp'} onChange={e => this.handleChange(e)}>
                        <img style={{width: "20px", height: "20px", marginLeft: "20px", marginRight: "5px"}} src={require('../Images/computerGames.png')} alt="computer icon" />
                        PC
                      </CustomInput>                    
                      <CustomInput type="radio" id="vr" name="platform" inline checked={this.state.platform === 'vr'} onChange={e => this.handleChange(e)}>
                        <img style={{width: "20px", height: "20px", marginLeft: "20px", marginRight: "5px"}} src={require('../Images/vrGames.png')} alt="vr icon" />
                        VR
                      </CustomInput>
                    </div>
                  </FormGroup>
                  {localStorage.getItem("per") !== "st" ?
                    <FormGroup>
                      <Row>
                        <Col xs="5">
                          <Label for="userID">User ID</Label>
                          <Input
                            type="text"
                            name="userID"
                            placeholder="Filter by user ID"
                            value={this.state.userID}
                            onChange={e => this.handleInput(e)}
                          />
                        </Col>
                        <Col xs="7">
                          <Label for="userName">User Name</Label>
                          <Input
                            type="text"
                            name="username"
                            placeholder="Filter by username"
                            value={this.state.username}
                            onChange={e => this.handleInput(e)}
                          />
                        </Col>
                      </Row>
                    </FormGroup>
                  : null}
                  <FormGroup>
                    <Label for="moduleID">Module ID</Label>
                    <Input
                      type="text"
                      name="moduleID"
                      placeholder="Enter a module ID to find a specific module's sessions"
                      value={this.state.moduleID}
                      onChange={e => this.handleInput(e)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="date">Date</Label>
                    <Input
                      type="date"
                      name="date"
                      value={this.state.date}
                      onChange={e => this.handleInput(e)}
                    />
                  </FormGroup>
                  <Row>
                    <Col>
                      <Button block style={{backgroundColor: "#37f0f9", color: "black", border: "none", fontWeight: "500"}}
                        disabled={
                          this.state.platform.length === 0 && this.state.userID.length === 0 && this.state.username.length === 0 &&
                          this.state.moduleID.length === 0 && this.state.date.length === 0 
                          ? true : false }
                        onClick={() => this.clearInputs()}>
                        Clear
                      </Button>
                    </Col>
                    <Col>
                      <Button block style={{backgroundColor: "#37f0f9", color: "black", border: "none", fontWeight: "500"}} 
                        disabled={
                          this.state.platform.length === 0 && this.state.userID.length === 0 && this.state.username.length === 0 &&
                          this.state.moduleID.length === 0 && this.state.date.length === 0 
                          ? true : false }
                        onClick={() => this.handleSearch()}>
                        Search
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col className="Right Column">
          <Row>
            <Col>
              <Container>
                {!this.state.searched && this.state.loading === false ?
                  <Card style={{paddingBottom: "52%"}}>
                    <div>
                      <h3 style={{textAlign: 'center'}}>Please search for a session on the left.</h3>
                    </div>
                  </Card>
                : null} 

                {this.state.searched && this.state.sessions.length !== 0 && this.state.loading === false ? 
                  <Session sessions={this.state.sessions} serviceIP={this.props.serviceIP}/> 
                : null}

                {this.state.searched && this.state.sessions.length === 0 && this.state.loading === false ? 
                  <Card style={{paddingBottom: "46%"}}>
                    <div>
                      <h3 style={{textAlign: 'center'}}>No matching sessions could be found.</h3>
                      <h3 style={{textAlign: 'center'}}>Please search for another session on the left.</h3>
                    </div>
                  </Card>
                : null}

                {this.state.loading === true ? <Loading /> : null}
              </Container>
            </Col>
          </Row>
        </Col>
      </Row>
      </Container>
    );
  }
}
