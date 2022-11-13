import React, { Component } from 'react'
import { Col, Table, Card, Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Pie, Bar } from 'react-chartjs-2'; 
import '../../../stylesheets/superadmin.css'
import { trackPromise } from 'react-promise-tracker';
import Wave from '../../Loading/Wave'; 
import axios from 'axios';   
import languageCodes from '../../../languageCodes3.json';

class ModuleStats extends Component {
	constructor(props){
		super(props);

		this.state = {
            modules: [],
            languages: {},
            termStats: []
        }
 
    }

    componentDidMount() {
        this.getModuleStats();
        this.getLanguageStats(); 
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
                console.log("module stats error: ", error); 
            })
        );
    }

    getLanguageStats = () => {
        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        };

        trackPromise(
            axios.get(this.props.serviceIP + '/languagestats', header)
            .then(res => {
                this.setState({ languages: res.data }); 
            }).catch(error => {
                console.log("language stats error: ", error); 
            })
        );
    }

    renderModulesChart = () => {
        return (
            <Card style={{overflow: "scroll", height: "25vh", backgroundColor: "transparent", border: "none"}}>
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
                            return (
                                <tr key={i}>
                                    <td>{module.moduleID}</td>
                                    <td>{module.name}</td>
                                    <td>{(module.averageScore * 100).toFixed(2)}%</td>
                                    <td>{module.averageSessionLength}</td>
                                    <td>
                                        <Button 
                                            style={{backgroundColor: "transparent", border: "none", padding: "0px"}}
                                            onClick={() => this.toggleModal(module.moduleID)}
                                        >
                                            <img 
                                                src={require('../../../Images/moreReg.png')}
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
            </Card>
        )
    }

    toggleModal = (id) => {
        this.setState({ modalOpen: !this.state.modalOpen });

        if (this.state.modalOpen === false)
            this.getTermStats(id); 
    }

    getTermStats = (id) => {
        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
            params: { moduleID: id }
        }

        axios.get(this.props.serviceIP + '/termsperformance', header)
        .then(res => {
            if (res.data.Message)
                this.setState({ termStats: [] })
            else 
                this.setState({ termStats: res.data })
        }).catch(error => {
            console.log(error.response); 
        })
    }

    renderBarChart = () => {
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

    renderLanguageChart = () => {
        let languageData = {
            labels: Object.keys(this.state.languages).map(item => languageCodes[item]),
            datasets: [
                {
                    label: 'Platforms',
                    data: Object.keys(this.state.languages).map(item => (this.state.languages[item] * 100).toFixed(2)),
                    backgroundColor: ['#96384e', '#eda48e', '#eed284', '#CD5C5C', '#F08080', '#E9967A', '#FA8072', '#20B2AA', '#2F4F4F', '#008080', '#008B8B', '#4682B4', '#6495ED', '#00BFFF', '#1E90FF', '#8B008B', '#9400D3', '#9932CC', '#BA55D3', '#C71585', '#DB7093', '#FF1493', '#FF69B4']
                }
            ]
        };

        return (
            <Card style={{overflow: "scroll", backgroundColor: "transparent", border: "none"}}>
                <Pie
                    data={languageData}
                    options={{
                        cutoutPercentage: 50,
                        legend: {
                            position: 'right',
                            align: "start",
                            labels: {
                                fontColor: 'white',
                                boxWidth: 10
                            },
                            display: true
                        }
                    }}
                />
            </Card>
        )
    }

	render() { 
        return (
            <>
                <Col className="Module Left Columns" xs="7">
                    <div className="suCardGreen">
                        Module Performance
                        {this.state.modules.length !== 0 ?
                        this.renderModulesChart() : <Wave chart="modules"/>}
                    </div>
                    <Modal isOpen={this.state.modalOpen} toggle={this.toggleModal}>
                        <ModalHeader toggle={this.toggleModal}>Terms Performance</ModalHeader>
                        <ModalBody>
                            {this.renderBarChart()}
                        </ModalBody>
                    </Modal>
                </Col>
                <Col className="Module Right Columns" xs="5" style={{paddingLeft: "0px"}}>
                    <div className="suCardBlue">
                        Module Languages
                        {Object.keys(this.state.languages).length !== 0 ?
                        this.renderLanguageChart() : <Wave chart="language"/>}
                    </div>
                </Col>
            </>
        );
    }
}

export default ModuleStats