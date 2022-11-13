import Axios from 'axios';
import React, { Component } from 'react'
import { Row, Col } from 'reactstrap';
import '../../../stylesheets/superadmin.css'
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2'; 
import { trackPromise } from 'react-promise-tracker';
import Spinner from '../../Loading/Spinner'; 
import ThreeDots from '../../Loading/ThreeDots';

class PlatformStats extends Component {
	constructor(props){
		super(props);

		this.state = {
            cp: {},
            mb: {}, 
            vr: {}
        }
    }

    componentDidMount() {
        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        };

        trackPromise(
            axios.get(this.props.serviceIP + '/platformstats', header)
            .then(res => {

                this.setState({
                    cp: res.data.cp,
                    mb: res.data.mb,
                    vr: res.data.vr
                })

            }).catch(error => {
                console.log(error.response); 
            })
        );
    }

    renderPerformanceChart = () => {
        let performanceData = {
            labels: ["Mobile", "PC", "VR"],
            datasets: [
            {
                label: 'Average Score (%)',
                data: [
                    (this.state.mb.avg_score).toFixed(2), 
                    (this.state.cp.avg_score).toFixed(2), 
                    (this.state.vr.avg_score).toFixed(2)
                ],
                backgroundColor: ['#abc9cd', '#658e93', '#7abe80']
            }
            ]
        };
        
        return (
            <>
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
                                    fontColor: 'white'
                                }
                            }],
                            xAxes: [{
                                ticks: {
                                    fontColor: 'white'
                                }
                            }]
                        },
                        legend: {labels: { fontColor: 'white' } }
                    }     
                }
            />
                <p style={{margin: "0 0 2px 0", display: "flex", justifyContent: "flex-end", fontSize: "12px"}}>
                    Total Records Available: Mobile({this.state.mb.total_records_avail}){' '}
                    PC({this.state.cp.total_records_avail}) VR({this.state.vr.total_records_avail})
                </p>
            </>
        )
    }

    renderFrequencyChart = () => {
        let frequencyData = {
                labels: ['Mobile', 'PC', 'VR'],
                datasets: [
                    {
                        label: 'Platforms',
                        data: [
                            (this.state.mb.frequency * 100).toFixed(2), 
                            (this.state.cp.frequency * 100).toFixed(2), 
                            (this.state.vr.frequency * 100).toFixed(2)
                        ],
                        backgroundColor: ['#96384e', '#eda48e', '#eed284']
                    }
                ]
        };
    
        return (
          <Pie
            data={frequencyData}
            options={{
              legend: {
                  position: 'right',
                  labels: {
                      fontColor: 'white'
                  }
              }
            }
          }
          />
        )
    }

    renderPlatformDurations = () => {
        let platformDuration = []; 
        platformDuration = this.formatTime(); 

        return (
            <>
            <li style={{fontSize: "14px"}}>Mobile: {platformDuration[0]}</li>
            <li style={{fontSize: "14px"}}>PC: {platformDuration[1]}</li>
            <li style={{fontSize: "14px"}}>VR: {platformDuration[2]}</li>
            </>
        )

    }

    timeToString = (time) => {
        let str = ""; 
        let hoursMinutesSeconds = time.split(/[.:]/);
        let hours = parseInt(hoursMinutesSeconds[0]) > 0 ? parseInt(hoursMinutesSeconds[0]) + "hrs " : ""; 
        let minutes = parseInt(hoursMinutesSeconds[1]) > 0 ? parseInt(hoursMinutesSeconds[1]) + "min " : ""; 
        let seconds = parseInt(hoursMinutesSeconds[2]) > 0 ? parseInt(hoursMinutesSeconds[2]) + "s" : "";      

        str = hours + minutes + seconds; 
        return str; 
    }

    formatTime = () => {
        let durations = []; 
        let mbAvgDuration = this.timeToString(this.state.mb.avg_time_spent);
        let cpAvgDuration = this.timeToString(this.state.cp.avg_time_spent); 
        let vrAvgDuration = this.timeToString(this.state.vr.avg_time_spent); 

        durations.push(mbAvgDuration);
        durations.push(cpAvgDuration);
        durations.push(vrAvgDuration);

        return durations; 
    }

	render() { 
        return (
            <>
                <Col className="Platform Left Column" xs="4">
                    <Row>
                        <div className="suCardGreen">
                            Average Platform Duration
                            {this.state.mb.avg_time_spent !== undefined && this.state.cp.avg_time_spent !== undefined 
                            && this.state.vr.avg_time_spent !== undefined ?
                            this.renderPlatformDurations() : <ThreeDots />}
                        </div>
                    </Row>
                    <br />
                    <Row>
                        <div className="suCardBlue">
                            Average Platform Frequency 
                            {this.state.mb.frequency !== undefined && this.state.cp.frequency !== undefined 
                            && this.state.vr.frequency !== undefined ?
                            this.renderFrequencyChart() : <Spinner chart="frequency"/>}
                        </div>
                    </Row>
                </Col>

                <Col className="Platform Right Column">
                    <div className="suCardGreen">
                        Average Platform Performance
                        {this.state.mb.avg_score !== undefined && this.state.cp.avg_score !== undefined 
                        && this.state.vr.avg_score !== undefined ?
                        this.renderPerformanceChart() : <Spinner chart="performance"/>}
                    </div>
                </Col>
            </>
        );
    }
}

export default PlatformStats