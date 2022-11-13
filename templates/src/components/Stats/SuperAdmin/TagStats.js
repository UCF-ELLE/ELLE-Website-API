import React, { Component } from 'react'
import { Card, Table, Button, Row, Col, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Pie } from 'react-chartjs-2'; 
import '../../../stylesheets/superadmin.css';
import axios from 'axios';
import { trackPromise } from 'react-promise-tracker';
import Wave from '../../Loading/Wave'; 

class TagStats extends Component {
	constructor(props){
		super(props);

		this.state = {
            tags: {},
            modalOpen: false 
        }
 
    }

    componentDidMount() {
        this.getTagStats(); 
    }

    getTagStats = () => {
        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        };

        trackPromise(
            axios.get(this.props.serviceIP + '/tagcount', header)
            .then(res => {
                this.setState({ tags: res.data }); 
            }).catch(error => {
                console.log("tag stats error: ", error); 
            })
        );
    }

    renderTagStats = () => {
        let numTerms = 0; 
        Object.values(this.state.tags).map((tag) => numTerms += tag); 

        return (
            <Card style={{overflow: "scroll", height: "23vh", backgroundColor: "transparent"}}>
                <Table hover className="statsTable" style={{color: "black"}}> 
                    <thead style={{color: "white"}}>
                        <tr>
                            <th>Tag</th>
                            <th># of Times Tagged</th>
                            <th>% Relative to Total</th>
                        </tr>
                    </thead>
                    <tbody> 
                        {Object.keys(this.state.tags).map((item, i) => {
                            return (
                                <tr key={i}>
                                    <td style={{fontSize: "14px"}}>
                                        {item}
                                    </td>
                                    <td style={{fontSize: "14px"}}>
                                        {this.state.tags[item]}
                                    </td>
                                    <td style={{fontSize: "14px"}}>
                                        {((this.state.tags[item]/numTerms) * 100).toFixed(2)}%
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>
            </Card>
        )
    }

    renderPieChart = () => {
        let chartColors = this.getColors(Object.keys(this.state.tags).length);

        let frequencyData = {
            labels: Object.keys(this.state.tags),
            datasets: [
                {
                    label: 'tags',
                    data: Object.values(this.state.tags),
                    backgroundColor: chartColors
                }
            ]
        };

        return (
            <>
            <Card style={{height: "20vh", backgroundColor: "transparent", border: "none"}}>
                <Pie
                    data={frequencyData}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        legend: {
                            display: false
                        }
                    }}
                />
            </Card>
            </>
        )
    }

    getColors = (len) => {
        let list = []; 
        let possibleColors = ['#abc9cd', '#658e93', '#7abe80', '#ecf8b1', '#c7eab4', '#7fcdbb', '#40b6c4', '#1e91c0', '#225ea8', '#263494', '#091d58']; 

        let index = 0; 
        for (let i = 0; i < len; i++) {
            list.push(possibleColors[index]); 

            index++; 
            if(index >= possibleColors.length)
                index = 0; 
        }

        return list; 
    }

    toggleModal = () => {
        this.setState({ modalOpen: !this.state.modalOpen }); 
    }

	render() { 
        let numTerms = 0; 
        Object.values(this.state.tags).map((tag) => numTerms += tag); 
        return (
            <>
                <div className="suCardBlue">
                    Tags
                    {Object.keys(this.state.tags).length !== 0 ? 
                    <>
                        {this.renderPieChart()}
                        <Row>
                            <Col xs="11" style={{padding: "0px"}}>
                                <text style={{fontSize: "12px"}}># of Terms with Tags: {numTerms}</text>
                            </Col>
                            <Col xs="1" style={{padding: "0px"}}>            
                                <Button style={{backgroundColor: "transparent", border: "none", padding: "0px"}} onClick={() => this.toggleModal()}>
                                    <img style={{width: "20px", height: "20px"}} src={require('../../../Images/moreReg.png')} />
                                </Button>
                            </Col>
                        </Row>
                    </>
                    : <Wave chart="tag"/>}
                </div>

                <Modal isOpen={this.state.modalOpen} toggle={this.toggleModal}>
                    <ModalHeader toggle={this.toggleModal}>Tag Stats</ModalHeader>
                    <ModalBody>
                        {this.renderPieChart()}
                        <Row style={{margin: "12px 0 0 0"}}>
                            <Col>
                                <p style={{fontSize: "12px"}}>
                                    # of Terms with Tags: {numTerms} 
                                </p>
                            </Col>
                            <Col>
                                <p style={{fontSize: "12px"}}>
                                    # of Tag Types: {Object.keys(this.state.tags).length}
                                </p>
                            </Col>
                        </Row>
                        {this.renderTagStats()}
                    </ModalBody>
                </Modal>
            </>
        );
    }
}

export default TagStats