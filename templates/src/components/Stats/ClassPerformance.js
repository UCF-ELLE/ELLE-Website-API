import React, { Component } from 'react'
import { Card, Row, Col } from 'reactstrap';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import axios from 'axios';   
import TermStats from './TermStats';
import TermBarChart from './TermBarChart';

class ClassPerformance extends Component {
	constructor(props){
		super(props);

		this.state = {
            termStats: [],
            threshold: 50
        }
 
    }

    componentDidMount() {
        this.getTermsPerformance();
    }

    getTermsPerformance = () => {
        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
            params: { groupID: this.props.groupID }
        }

        axios.get(this.props.serviceIP + '/termsperformance', header)
        .then(res => {
            this.setState({ termStats: res.data })
        }).catch(error => {
            console.log(error.response); 
        })
    }

    renderCharts = () => {
        return (
            <Row style={{margin: "0px"}}>
                <Col xs="7" style={{padding: "0px"}}>
                    <Card style={{height: "35vh", borderRadius: "0px", border: "none", overflow: "scroll"}}>
                        <TermStats termStats={this.state.termStats} />
                    </Card>
                </Col>
                <Col xs="5" style={{padding: "0px"}}>
                    <Card style={{height: "35vh", borderRadius: "0px", borderRightStyle: "hidden"}}>
                        <TermBarChart termStats={this.state.termStats} threshold={this.state.threshold} />
                        <Slider
                            value={this.state.threshold}
                            orientation="horizontal"
                            style={{width: "80%", margin: "5px 30px"}}
                            onChange={this.changeThreshold}
                        />
                        <p style={{textAlign: "end", padding: "0px 30px", fontSize: "10px"}}>Threshold: {this.state.threshold}%</p>
                    </Card>
                </Col>
            </Row>
        )
    }

    changeThreshold = (value) => {
        this.setState({
          threshold: value
        })
    }

	render() { 
        return (
            this.state.termStats.Message ? <p style={{margin: "10px 15px"}}>No records found.</p> : this.renderCharts()
        );
    }
}

export default ClassPerformance