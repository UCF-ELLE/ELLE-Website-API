import React, { Component } from 'react'
import { Row, Col, Label, Card, Button } from 'reactstrap';
import Select from 'react-select';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { trackPromise } from 'react-promise-tracker';
import axios from 'axios';
import ThreeDots from '../Loading/ThreeDots'; 
import TermStats from './TermStats';
import TermBarChart from './TermBarChart';

class SpecificStudentStats extends Component {
	constructor(props){
        super(props);
        
        this.state = {
            termStats: null, 
            students: [],
            selectedStudent: '',
            threshold: 50
        }
    }

    componentDidMount() {
        this.getStudents(); 
    }

    getStudents = () => {
        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
            params: { groupID: this.props.groupID }
        }

        axios.get(this.props.serviceIP + '/usersingroup', header)
        .then(res => {
            let students = res.data.filter((entry) => entry.accessLevel === "st")
            .map((student) => {return {label: student.username, value: student.userID}}); 

            this.setState({ students: students }); 
        }).catch(error => {
            console.log(error.response); 
        })
    }

    change = (e) => {
        this.setState({ [e.target.name]: e.target.value }); 
    }

    getTermStats = () => {
        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
            params: { userID: this.state.selectedStudent.value, groupID: this.props.groupID }
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

    onSearch = () => {
        this.setState({termStats : null}); 
        this.getTermStats();
    }

    updateSelectedStudent = (value) => {
        this.setState({
          selectedStudent: value
        })
    }

    changeThreshold = (value) => {
        this.setState({
          threshold: value
        })
    }

	render() { 
        return (
            <div>
                <Row>
                    <Col xs="3" style={{paddingRight: "0px", margin: "8px"}}>
                        <Label>Student:</Label>
                    </Col>
                    <Col xs="6" style={{marginLeft:"-35px", padding: "0px"}}>
                        <Select
                            name="students"
                            options={this.state.students}
                            className="basic-single"
                            classNamePrefix="select"
                            isClearable={true}
                            value={this.state.selectedStudent}
                            onChange={this.updateSelectedStudent}
                        />
                    </Col>
                    <Col xs="3">
                        <Button onClick={this.onSearch}>Search</Button>
                    </Col>
                </Row>
                <br />
                <Card style={{border: "none"}}>
                    {this.state.termStats ? 
                    this.state.termStats.length !== 0 
                    ? 
                        <div>
                            <TermBarChart termStats={this.state.termStats} threshold={this.state.threshold}/>
                            <Slider
                                value={this.state.threshold}
                                orientation="horizontal"
                                style={{width: "90%", margin: "5px 30px"}}
                                onChange={this.changeThreshold}
                            />
                            <p style={{textAlign: "end", padding: "0px 20px", fontSize: "10px"}}>Threshold: {this.state.threshold}%</p>
                            <Card style={{height: "25vh", overflow: "scroll"}}>
                                <TermStats termStats={this.state.termStats} /> 
                            </Card>
                        </div>
                    : 
                        <p>No records found.</p> 
                    : <ThreeDots />}
                </Card>
            </div>
        );
    }
}

export default SpecificStudentStats