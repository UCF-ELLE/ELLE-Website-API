import React, { Component } from 'react';
import { Container, Row, Col, Input, Button, Card,
  InputGroup, InputGroupAddon, Modal, ModalHeader, ModalBody, Alert, CardHeader, Collapse } from 'reactstrap';
import ListGroup from 'react-bootstrap/ListGroup'
import Tab from 'react-bootstrap/Tab'
import Select from 'react-select';
import axios from 'axios';
import '../stylesheets/style.css';

import Template from './Template';
import Class from './../components/ClassRoster/Class'; 

class ClassRoster extends Component {

  constructor(props) {
    super(props)
    this.state = {
      permission: this.props.user.permission,
      groups: [], 
      currentGroup: "st",
      search : "",
      elevateModalOpen: false,
      selectedClass: '',
      selectedUser: '', 

      collapseTab: -1
    }
  }    

  componentDidMount() {
    this.verifyPermission(); 
    this.getGroups(); 
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

  getGroups = () => {
    axios.get(this.props.serviceIP + '/searchusergroups', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    }).then(res => {
      this.setState({
        groups: res.data
      });
    }).catch(function (error) {
      console.log(error);
    });
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

  updateSelectedClass = (value) => {
    this.setState({
      selectedClass: value
    })
  }

  elevateUser = (group) => {
    var data = {
      userID: this.state.selectedUser.value,
      accessLevel: group, 
      groupID: this.state.selectedClass.value
    }

    var headers = {
      'Authorization': 'Bearer ' + localStorage.getItem('jwt')
    }

    axios.post(this.props.serviceIP + '/elevateaccess', data, {headers:headers})
    .then(res => {
      this.toggleElevateModal(); 
      this.getGroups(); 
    }).catch(function (error) {
      console.log(error);
    });
  }

  renderUserTable = (group) => {
    let classes = []; 
    let students = []; 
    let classOptions = this.state.groups.map((group) => { return ({value: group.groupID, label: group.groupName}) });
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

    let classColors = this.getColors();

    if (group === "ta") {
      this.state.groups.map((group, i) => {classes.push(
        {
          groupID: group.groupID,
          groupName: group.groupName, 
          groupColor: classColors[i],
          group_users: group.group_users.filter((user) => {return user.accessLevel === 'ta'})
        }
      )});
    }
    else {
      this.state.groups.map((group, i) => {classes.push(
        {
          groupID: group.groupID,
          groupName: group.groupName, 
          groupColor: classColors[i],
          group_users: group.group_users.filter((user) => {return user.accessLevel === 'st'})
        }
      )});
      searchLength = 12; 
      addButton = null; 
    }

    if (this.state.currentGroup === "ta") {
      this.state.groups.map((group) => group.group_users.filter(
        (user) => user.accessLevel === "st" 
        ? students.push({
          userID: user.userID, username: user.username, 
          groupID: group.groupID, groupName: group.groupName
        }) 
        : null)
      ); 
    }

    let filteredClass = classes.filter(
      (group) => { 
          return (group.groupName.toLowerCase().indexOf(this.state.search.toLowerCase()) !== -1);
      }
    ); 

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
              placeholder="Search for a class" 
              value={this.state.search} 
              onChange={this.updateSearch.bind(this)}
            />
          </InputGroup>
        </Col>
        {addButton}
      </Row>
      <br />
        {filteredClass.map(
          (group, i) => { 
            return (
              <Card key={i} style={{ marginBottom: '1rem' }}>
                <CardHeader onClick={e => this.toggleTab(e)} data-event={i} style={{backgroundColor: group.groupColor}}>
                  {group.groupName}
                </CardHeader>
                
                <Collapse isOpen={this.state.collapseTab === i} style={{border: "none"}}>
                  <Class group={group} currentGroup={this.state.currentGroup} groupColor={group.groupColor} serviceIP={this.props.serviceIP}/>
                </Collapse>
              </Card>
            )
          }  
        )}
      <Modal isOpen={this.state.elevateModalOpen} toggle={() => this.toggleElevateModal()} backdrop={true}>
        <ModalHeader toggle={() => this.toggleElevateModal()}>Modify Permission</ModalHeader>
        <ModalBody>
          Class: 
          <Select
            name="class"
            options={classOptions}
            className="basic-single"
            classNamePrefix="select"
            isClearable={true}
            value={this.state.selectedClass}
            onChange={this.updateSelectedClass}
          />
          Select a student to promote them to TA privileges: 
          <Select
            isDisabled={this.state.selectedClass === null || this.state.selectedClass === '' ? true : false}
            name="nonTAList"
            options={this.state.selectedClass === null ? null 
            : students.filter((student) => student.groupID === this.state.selectedClass.value).map((user) => {return ({value: user.userID, label: user.username})}) }
            className="basic-single"
            classNamePrefix="select"
            isClearable={true}
            value={this.state.selectedUser}
            onChange={this.updateSelectedUser}
          />
          <br />
          <Button block onClick={() => this.elevateUser("ta")}>Elevate</Button>
        </ModalBody>
      </Modal>
      </>
    )
  }

  toggleTab(e) {
    let event = e.target.dataset.event; 

    //if the accordion clicked on is equal to the current accordion that's open then close the current accordion,
    //else open the accordion you just clicked on 
    this.setState({ collapseTab: this.state.collapseTab === Number(event) ? -1 : Number(event) }) 
  }

  getColors = () => {
    let possibleColors=['#a5d5f6', "cornflowerblue", '#57baca', '#48a5b7']

		let colorList = [];
		let index = 0;

		for(let i = 0; i < this.state.groups.length; i++){
			colorList.push(possibleColors[index]);
			
			index++;
			
			if(index >= possibleColors.length){
				index = 0;
			}
    }
    
    return colorList;
  }

  resetVal = (k) => {
    let group = ""; 
    if (k === "#students") {
      group = "st"; 
    }
    else if (k === "#tas") {
      group = "ta"; 
    } 

    this.setState({
      search: "", 
      currentGroup: group
    })
  }

  render() {
    return (
      <Container className="user-list">
        <Template permission={this.state.permission}/>
        <br></br><br></br>			
        <div>
        <h3>Class Roster</h3>
          <Tab.Container id="userList" defaultActiveKey="#students" onSelect={(k) => this.resetVal(k)}>
            <Row>
              <Col sm={4}>
                <ListGroup className="userListTabs">
                  <ListGroup.Item action href="#students">
                    Students
                  </ListGroup.Item>
                  <ListGroup.Item action href="#tas">
                    TAs
                  </ListGroup.Item>
                </ListGroup>
              </Col>
              <Col sm={8}>
                <Tab.Content>
                  <Tab.Pane eventKey="#students">
                    {this.renderUserTable("st")}
                  </Tab.Pane>
                  <Tab.Pane eventKey="#tas">
                    {this.renderUserTable("ta")}
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </div>
      </Container>
    )
  }
}

export default ClassRoster
