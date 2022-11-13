import React, { Component } from 'react'
import { Card, CardHeader, Collapse, Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import ClassPerformance from './ClassPerformance';
import SpecificStudentStats from './SpecificStudentStats';

class TermPerformance extends Component {
	constructor(props){
		super(props);

		this.state = {
            collapseTab: -1,
            modalOpen: false,
            currentGroup: ""
        }
 
    }

    toggleTab(e) {
        let event = e.target.dataset.event; 
    
        //if the accordion clicked on is equal to the current accordion that's open then close the current accordion,
        //else open the accordion you just clicked on 
        this.setState({ collapseTab: this.state.collapseTab === Number(event) ? -1 : Number(event) }) 
    }

    toggleModal = (id) => {
        this.setState({ modalOpen: !this.state.modalOpen, currentGroup: id });
    }

	render() { 
        return (
            <Card style={{backgroundColor: "#04354b", color: "aqua", overflow: "scroll", height: "45vh", borderTopLeftRadius: "0px"}}>
                {this.props.classes.map((group, i) => {
                    return (
                        <Card key={i} style={{border: "none", color: "black", borderRadius: "0px"}}>
                            <CardHeader style={{backgroundColor: "#74b7bd", color: "white", borderRadius: "0px", padding: "5px 20px"}} 
                                onClick={e => this.toggleTab(e)} data-event={i}>
                                {group.groupName}
                                {this.state.collapseTab === i && this.props.permission === "pf"?
                                <Button 
                                    style={{float: "right", padding: "2px 4px", fontSize: "small"}}
                                    onClick={() => this.toggleModal(group.groupID)}
                                >
                                    Lookup Student
                                </Button> 
                                : null}
                            </CardHeader>
                            
                            <Collapse isOpen={this.state.collapseTab === i} style={{border: "none"}}>
                                <ClassPerformance serviceIP={this.props.serviceIP} groupID={group.groupID}/>
                            </Collapse>
                        </Card>
                    )
                })}

                <Modal isOpen={this.state.modalOpen} toggle={this.toggleModal}>
                    <ModalHeader toggle={this.toggleModal}>Lookup Student</ModalHeader>
                    <ModalBody>
                        <SpecificStudentStats serviceIP={this.props.serviceIP} groupID={this.state.currentGroup}/>
                    </ModalBody>
                </Modal>
            </Card>
        );
    }
}

export default TermPerformance