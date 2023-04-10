import React, { Component } from 'react';
import { Container, Table, Row, Col, Input, Button, InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Card, CardBody } from 'reactstrap';
import ListGroup from 'react-bootstrap/ListGroup'
import Tab from 'react-bootstrap/Tab'
import Select from 'react-select';
import axios from 'axios';
import '../stylesheets/style.css';

import User from '../components/UserList/User';
import Footer from '../components/Footer';
import Template from './Template';
import Spinner from '../components/Loading/Spinner'; 
import { trackPromise } from 'react-promise-tracker';

class UserList extends Component {

  constructor(props) {
    super(props)
    this.state = {
      permission: this.props.user.permission,
      currentGroup: "su",
      selectedUser: '',
      users: [], 
      superAdmins: null,
      professors: null,
      students: null,
      search: "", 
      elevateModalOpen: false, 
    }
  }

  componentDidMount() {
    this.verifyPermission();
    this.getUsers(); 
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

  change(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  updateSearch(e) {
    this.setState({ search: e.target.value.substr(0,20) });
  }

  getUsers = () => {
    trackPromise(
      axios.get(this.props.serviceIP + '/users', {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
      }).then(res => {

        let su = res.data.filter((user) => user.permissionGroup === "su"); 
        let pf = res.data.filter((user) => user.permissionGroup === "pf"); 
        let st = res.data.filter((user) => user.permissionGroup === "st"); 

        this.setState({
          users : res.data,
          superAdmins: su, 
          professors: pf, 
          students: st 
        });
      }).catch(function (error) {
        console.log(error);
      })
    );
  }

  elevateUser = (group) => {
    var data = {
      userID: this.state.selectedUser.value,
      accessLevel: group
    }

    var headers = {
      'Authorization': 'Bearer ' + localStorage.getItem('jwt')
    }

    axios.post(this.props.serviceIP + '/elevateaccess', data, {headers:headers})
    .then(res => {
      this.toggleElevateModal(); 
      this.getUsers(); 
    }).catch(function (error) {
      console.log(error);
    });
  }

  renderUserTable = (group) => {
    let userList; 
    let filteredUsers;
    let nonAdminList = []; 
    let searchLength = 11; 
    let addButton = (     
      <Col sm={1} style={{paddingLeft: "5px"}}>
        <Button style={{borderRadius: "30px"}} onClick={() => this.toggleElevateModal()}>
          <img 
            src={require('../Images/plus.png')} 
            alt="Icon made by srip from www.flaticon.com"
            style={{width:"15px", height:"15px"}}
          />
        </Button>
      </Col>
    );
    if (group === "su") {
      userList = this.state.superAdmins;
    }
    else if (group === "pf") {
      userList = this.state.professors; 
    }
    else {
      userList = this.state.students;
      searchLength = 12; 
      addButton = null; 
    }

    if (this.state.currentGroup === "su" && this.state.students && this.state.superAdmins) {
      let list = this.state.students.concat(this.state.professors); 
      nonAdminList = list.map((user) => {return( {value: user.userID, label: user.username} )});
    }
    else if (this.state.currentGroup === "pf") {
      nonAdminList = this.state.students.map((user) => {return( {value: user.userID, label: user.username})}); 
    }

    if (userList) {
      filteredUsers = userList.filter(
        (user) => { 
          if (user) 
            return (user.username.toLowerCase().indexOf(this.state.search.toLowerCase()) !== -1);
          else 
            return null; 
        }
      );
    }

    return (
      <>
      <Row>
        <Col sm={searchLength}>
          <InputGroup style={{borderRadius: "8px"}}>
            <InputGroupAddon addonType="prepend" style={{margin: "10px"}}>
              <img 
                src={require('../Images/search.png')} 
                alt="Icon made by Freepik from www.flaticon.com" 
                style={{width: '20px', height: '20px'}}
              />
            </InputGroupAddon>
            <Input style={{border: "none"}}
              type="text" 
              placeholder="Search" 
              value={this.state.search} 
              onChange={this.updateSearch.bind(this)}
            />
          </InputGroup>
        </Col>
        {addButton}
      </Row>
      <br />

      {this.state.students && this.state.professors && this.state.superAdmins ?
        userList.length !== 0 ?
        <Table hover className="userListTable">
          <thead>
            <tr>
              <th style={{borderTopLeftRadius: "8px"}}>ID</th>
              <th>Username</th>
              <th style={{borderTopRightRadius: "8px"}}></th>
            </tr>
          </thead>
            <tbody>
              {filteredUsers.length !== 0 ?
                filteredUsers.map((user) => {
                  return (
                    <User key={user.userID} user={user} type="su" group={group} serviceIP={this.props.serviceIP} getUsers={this.getUsers}/>
                  )  
                }) :
                <tr>
                  <td colSpan="3">
                    {this.state.search} cannot be found.
                  </td>
                </tr>}
            </tbody>
        </Table>
        : 
        <Card>
          <CardBody>
            <Row>
              <Col xs="1">
                <img style={{width: "25px", height: "25px"}} src={require('../Images/exclamation.png')} />
              </Col>
              <Col xs="10" style={{padding: "0px"}}>
                {group === "su" ? "There are no other super admins." : group === "pf" ? 
                "There are currently no professors." : "There are currently no students."}
              </Col>
            </Row>
          </CardBody>
        </Card>
      : <Spinner />}
      <Modal isOpen={this.state.elevateModalOpen} toggle={() => this.toggleElevateModal()} backdrop={true}>
        <ModalHeader toggle={() => this.toggleElevateModal()}>Modify Permission</ModalHeader>
        <ModalBody>
          Select a user to promote them to {this.state.currentGroup === "su" ? "super admin" : "professor"} privileges: 
          <Select
            name="nonAdminList"
            options={nonAdminList}
            className="basic-single"
            classNamePrefix="select"
            isClearable={true}
            value={this.state.selectedUser}
            onChange={this.updateSelectedUser}
          />
          <br />
          <Button block onClick={() => this.elevateUser(this.state.currentGroup)}>Elevate</Button>
        </ModalBody>
      </Modal>
      </>
    )
  }

  resetVal = (k) => {
    let group = ""; 
    if (k === "#superAdmins") {
      group = "su"; 
    }
    else if (k === "#professors") {
      group = "pf"; 
    }
    else {
      group = "st"; 
    }

    this.setState({
      search: "", 
      currentGroup: group
    })
  }

  toggleElevateModal = () => {
    this.setState({
      elevateModalOpen: !this.state.elevateModalOpen,
    })
  }

  updateSelectedUser = (value) => {
    this.setState({
      selectedUser: value
    })
  }

  render() {
    return (
      <div>
        <Container className="user-list mainContainer">
          <Template permission={this.state.permission}/>
          <br></br><br></br>			
          <div>
          <h3>List of Users</h3>
            <Tab.Container id="userList" defaultActiveKey="#superAdmins" onSelect={(k) => this.resetVal(k)}>
              <Row>
                <Col sm={4}>
                  <ListGroup className="userListTabs">
                    <ListGroup.Item action href="#superAdmins">
                      Super Admins
                    </ListGroup.Item>
                    <ListGroup.Item action href="#professors">
                      Professors
                    </ListGroup.Item>
                    <ListGroup.Item action href="#students">
                      Students
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col sm={8}>
                  <Tab.Content>
                    <Tab.Pane eventKey="#superAdmins">
                      {this.renderUserTable("su")}
                    </Tab.Pane>
                    <Tab.Pane eventKey="#professors">
                      {this.renderUserTable("pf")}
                    </Tab.Pane>
                    <Tab.Pane eventKey="#students">
                      {this.renderUserTable("st")}
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </div>
        </Container>
        <Footer></Footer>
      </div>
    )
  }
}

export default UserList
