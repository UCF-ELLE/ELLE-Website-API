import React, { Component } from 'react'
import { Row, Col, Modal, ModalHeader, ModalBody, ModalFooter, Badge, Button, Card, CardBody, ListGroup, ListGroupItem,
    Form, FormGroup, Label, Input } from 'reactstrap';
import {Tabs, Tab} from 'react-bootstrap';
import axios from 'axios';
import ClassDetails from './ClassDetails';
import Password from './Password';
import ModulePerformance from '../Stats/ModulePerformance';
import TermPerformance from '../Stats/TermPerformance';

export default class AdminView extends Component {
	constructor(props){
		super(props);

		this.state = {
            classes: [],
            currentClassDetails: {},
            className: "", 
            classCode: "", 
            editClass: false,
            classDetailModalOpen: false,
        }
 
    }

    componentDidMount() {
        this.getClasses(); 
    }

    change(e) {
        this.setState({
          [e.target.name]: e.target.value
        })
    }

    toggleTooltipOpen = () => {
        this.setState({ tooltipOpen: !this.state.tooltipOpen })
    }

    getClasses = () => {
        axios.get(this.props.serviceIP + '/searchusergroups', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        }).then(res => {
          this.setState({ classes: res.data })
        }).catch(error => {
          console.log(error.response); 
        })
    }

    revealClassDetails = () => {
        return (
          <Modal isOpen={this.state.classDetailModalOpen} toggle={this.toggleClassDetailModal}>
            <ModalHeader toggle={this.toggleClassDetailModal}>Class Details</ModalHeader>
            <ModalBody>
              <ClassDetails 
                item={this.state.currentClassDetails} 
                editClass={this.state.editClass} 
                handleOnEditName={this.handleOnEditName}
                generateNewCode={this.generateNewCode}
              />  
            </ModalBody>
            <ModalFooter>
              {this.state.editClass ? 
              <Button color="primary" onClick={() => this.updateClassName()}>Save</Button>
              : <Button color="primary" onClick={() => this.toggleEditClass()}>Edit</Button>}
              {' '}
              <Button color="secondary" onClick={() => this.deleteClass()}>Delete</Button>
            </ModalFooter>
          </Modal>
        )
    }

    toggleClassDetailModal = (item) => {
        this.setState({ 
          classDetailModalOpen: !this.state.classDetailModalOpen, 
          currentClassDetails: item,
          editClass: false 
        })
    }
    
    toggleEditClass = () => {
        this.setState({ editClass: !this.state.editClass }); 
    }
    
    handleOnEditName = (e) => {
        let temp = this.state.currentClassDetails;
    
        let newClassDetails = {
          accessLevel: temp.accessLevel,
          groupCode: temp.groupCode,
          groupID: temp.groupID,
          groupName: e.target.value,
          group_users: temp.group_users
        }
    
        this.setState({ currentClassDetails: newClassDetails }); 
    }
    
    updateClassName = () => {
        this.toggleEditClass()
    
        let header = {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
        }
    
        let config = {
          groupID: this.state.currentClassDetails.groupID,
          groupName: this.state.currentClassDetails.groupName
        }
    
        axios.put(this.props.serviceIP + '/group', config, header)
        .then(res => {
          this.getClasses(); 
        }).catch(error => {
          console.log("updateClassName error: ", error); 
        })
    }
    
    generateNewCode = () => {
        let header = {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
          params: {groupID: this.state.currentClassDetails.groupID}
        }
    
        axios.get(this.props.serviceIP + '/generategroupcode', header)
        .then(res => {    
          let temp = this.state.currentClassDetails;
    
          let newClassDetails = {
            accessLevel: temp.accessLevel,
            groupCode: res.data.groupCode,
            groupID: temp.groupID,
            groupName: temp.groupName,
            group_users: temp.group_users
          }
    
          this.setState({ currentClassDetails: newClassDetails }); 
        }).catch(error => {
          console.log("ERROR in generating new group code: ", error);
        })
    }

    createClass = (e) => {
        e.preventDefault(); 

        var data = {
          groupName: this.state.className
        }
    
        var headers = {
          'Authorization': 'Bearer ' + localStorage.getItem('jwt')
        }
    
        axios.post(this.props.serviceIP + '/group', data, {headers:headers}
        ).then(res => {
          this.getClasses(); 
    
          this.setState({ className: "" }); 
        }).catch(error => {
          console.log(error.response); 
        })
    }
    
    deleteClass = () => {
        let header = {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt')},
          data: {groupID: this.state.currentClassDetails.groupID}
        }
    
        axios.delete(this.props.serviceIP + '/group', header)
        .then(res => {
          this.toggleClassDetailModal(); 
          this.getClasses(); 
        }).catch(error => {
          console.log("delete class code error: ", error); 
        })
    }

	render() { 
        return (
            <>
                <h3><Badge style={{backgroundColor: "cadetblue"}}>Your Profile</Badge></h3> 
                <Row>
                    <Col xs="3">
                    <Card style={{backgroundColor: "lightblue", height: "65vh"}}>
                    <CardBody>
                    <h6>Username:</h6>
                    <Card>
                        <Row>
                            <Col xs="9" style={{paddingLeft: "35px", paddingTop: "5px"}}>
                                {this.props.username}
                            </Col>
                            <Col xs="3">
                              <Password serviceIP={this.props.serviceIP} userType="pf" email={this.props.email} editEmail={this.props.editEmail}/>
                            </Col>
                        </Row>
                    </Card>

                    <br />
                    
                    <h6>Classes:</h6>
                    <Card style={{overflow:"scroll", height: "20vh"}}>
                        <ListGroup flush>
                        {this.state.classes.length === 0 
                        ? <ListGroupItem> You currently are not part of any classes. </ListGroupItem>
                        : this.state.classes.map((item, i) => {
                            return(
                                <ListGroupItem key={i}> 
                                    {item.groupName} 
                                    <Button 
                                        style={{float: "right", backgroundColor: "white", border: "none", padding: "0"}}
                                        onClick={() => this.toggleClassDetailModal(item)}
                                    >
                                        <img 
                                        src={require('../../Images/more.png')} 
                                        alt="Icon made by xnimrodx from www.flaticon.com" 
                                        name="more"
                                        style={{width: '24px', height: '24px'}}
                                        />
                                    </Button>
                                </ListGroupItem>
                            )})
                        }
                        </ListGroup>
                    </Card>

                    {this.state.classDetailModalOpen ? this.revealClassDetails(this.state.currentClassDetails) : null}

                    <Form onSubmit={e => this.createClass(e)}>
                        <h5 style={{marginTop: "8px"}}>Create a New Class</h5>
                        <FormGroup>
                            <Label for="className">Class Name: </Label>
                            <Input 
                                type="text"
                                name="className"
                                id="className"
                                onChange={e => this.change(e)}
                                value={this.state.className} 
                            />
                        </FormGroup>
                        <Button block type="submit">Create</Button>
                    </Form>

                    </CardBody>
                    </Card>
                    </Col>

                    <Col xs="9">
                    <Card style={{backgroundColor: "cadetblue", height: "65vh"}}>
                        <CardBody style={{color: "#04354b"}}>
                            <h1>
                                Welcome back {this.props.username}!
                            </h1>
                            <Row>
                                <Col>
                                    <Tabs defaultActiveKey={0} id="uncontrolled-tab-example" className="profileTabs">
                                        <Tab eventKey={0} title="Module Performance">
                                            <ModulePerformance serviceIP={this.props.serviceIP}/>
                                        </Tab>
                                        <Tab eventKey={1} title="Term Performance">
                                            <TermPerformance 
                                              serviceIP={this.props.serviceIP} 
                                              permission={this.props.permission}
                                              classes={this.state.classes}
                                            />
                                        </Tab>
                                    </Tabs>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                    </Col>
                </Row>
            </>
        );
    }
}