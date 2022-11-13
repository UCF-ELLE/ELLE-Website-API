import React, { Component } from 'react'
import { Label, Input, Row, Col } from 'reactstrap';
import '../../stylesheets/superadmin.css'

class ClassDetails extends Component {
	constructor(props){
		super(props);

		this.state = {
            name: this.props.item.groupName,
            size: 0
        }

    }

    handleOnChange = (e) => {
        this.setState({ [e.target.name]: e.target.value }); 
        this.props.handleOnEditName(e);
    }

	render() { 
        return (
            <>
                <Row>
                    <Col style={{paddingLeft: "30px"}}>
                        <Label>Class Name: </Label>{' '}
                        <Input 
                            name="name"
                            disabled={this.props.editClass ? false : true}
                            style={{marginBottom: "10px", cursor: this.props.editClass ? "default" : "not-allowed"}}
                            value={this.state.name}
                            onChange={this.handleOnChange}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col style={{paddingLeft: "30px"}}>
                        <Label>Class Code: </Label>{' '}{this.props.item.groupCode}
                    </Col>
                    <Col>
                        <p style={{margin: "5px 0 0 0", fontSize: "12px"}}>Need a new class code? Click {' '}
                            <a 
                                style={{textDecoration: "underline", color: "blue", cursor: "default"}} 
                                onClick={() => this.props.generateNewCode()}
                            >
                            here
                            </a>.
                        </p>
                    </Col>
                </Row>
                <Row>
                    <Col style={{paddingLeft: "30px"}}>
                        <Label>Class Size: </Label>{' '}{this.props.item.group_users !== undefined ? this.props.item.group_users.length - 1 : null}
                    </Col>
                </Row>
            </>
        );
    }
}

export default ClassDetails