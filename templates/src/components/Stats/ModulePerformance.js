import React, { Component } from 'react'
import { Row, Col, Table, Card, Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { trackPromise } from 'react-promise-tracker';
import Spinner from '../Loading/Spinner';
import ThreeDots from '../Loading/ThreeDots'; 
import { Bar } from 'react-chartjs-2'; 
import axios from 'axios';   

class ModulePerformance extends Component {
	constructor(props){
		super(props);

		this.state = {
            modules: null,
            modalOpen: false,
            termStats: null
        }
 
    }

    componentDidMount() {
        this.getModuleStats();
    }

    getModuleStats = () => {
        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        };

        trackPromise(
            axios.get(this.props.serviceIP + '/allmodulestats', header)
            .then(res => {
                this.setState({ modules: res.data }); 
            }).catch(error => {
                console.log("module stats error: ", error.message); 
            })
        );
    }

    renderModulesTable = () => {
        return (
            this.state.modules.length !== 0 ?
                <Table className="statsTable"> 
                    <thead>
                        <tr>
                            <th>Module ID</th>
                            <th>Module Name</th>
                            <th>Average Score</th>
                            <th>Average Duration</th>
                            <th></th>
                        </tr>   
                    </thead>
                    <tbody> 
                        {this.state.modules.map((module, i) => {
                            let avgScore = module.averageScore * 100; 
                            return (
                                <tr key={i} style={{color: this.getRangeColor(avgScore)}}>
                                    <td>{module.moduleID}</td>
                                    <td>{module.name}</td>
                                    <td>{avgScore.toFixed(2)}%</td>
                                    <td>{module.averageSessionLength}</td>
                                    <td>
                                        <Button 
                                            style={{backgroundColor: "transparent", border: "none", padding: "0px"}}
                                            onClick={() => this.toggleModal(module.moduleID)}
                                        >
                                            <img 
                                                src={require('../../Images/moreReg.png')}
                                                alt="Icon made by xnimrodx from www.flaticon.com" 
                                                name="more"
                                                style={{width: '20px', height: '20px'}}
                                            />
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </Table>
            : <p style={{margin: "10px 15px"}}>There are currently no records.</p>
        )
    }

    getRangeColor = (value) => {
        let color = ""
        if (value >= 90) {
            color = "limegreen"
        }
        else if (value >= 80) {
            color = "lawngreen"
        }
        else if (value >= 70) {
            color = "yellow"
        }   
        else if (value >= 60) { 
            color = "orange"
        }
        else {
            color = "red"
        }

        return color; 
    }

    toggleModal = (id) => {
        this.setState({ modalOpen: !this.state.modalOpen });

        if (this.state.modalOpen === false)
            this.getTermStats(id); 
        else {
            this.setState({ termStats: null })
        }
    }

    getTermStats = (id) => {
        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
            params: { moduleID: id }
        }

        trackPromise(
            axios.get(this.props.serviceIP + '/termsperformance', header)
            .then(res => {
                if (res.data.Message)
                    this.setState({ termStats: [] })
                else 
                    this.setState({ termStats: res.data })
            }).catch(error => {
                console.log(error.response); 
        }));
    }

    renderChart = () => {
        let terms = Object.entries(this.state.termStats).map(([i, term]) => {
            return( {front: term.front, percentage: term.correctness*100} )
        }); 

        let chartColors = this.getColors(terms.length); 

        let performanceData = {
            labels: terms.map(term => term.front),
            datasets: [
            {
                label: 'Correctness (%)',
                data: terms.map(term => term.percentage.toFixed(2)),
                backgroundColor: chartColors
            }
            ]
        };

        return (
            this.state.termStats.length !== 0 ?
            <Bar 
                data={performanceData}
                options={
                    { 
                        scales: {
                            yAxes: [{
                                ticks: {                  
                                    beginAtZero: true, 
                                    min: 0,
                                    max: 100,
                                    fontColor: 'black'
                                }
                            }],
                            xAxes: [{
                                ticks: {
                                    fontColor: 'black'
                                }
                            }]
                        },
                        legend: {labels: { fontColor: 'black' } }
                    }     
                }
            />
            : <p>No records found.</p>
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

	render() { 
        return (
            <Row>
                <Col>
                    <Card style={{backgroundColor: "#04354b", color: "aqua", overflow: "scroll", height: "45vh", borderTopLeftRadius: "0px"}}>
                        {this.state.modules
                        ? this.renderModulesTable() 
                        : <Spinner chart="performance"/>}
                    </Card>

                    <Modal isOpen={this.state.modalOpen} toggle={this.toggleModal}>
                        <ModalHeader toggle={this.toggleModal}>Terms Performance</ModalHeader>
                        <ModalBody>
                            {this.state.termStats ? this.renderChart() : <ThreeDots />}
                        </ModalBody>
                    </Modal>
                </Col>
            </Row>
        );
    }
}

export default ModulePerformance