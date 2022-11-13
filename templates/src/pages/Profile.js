import React from 'react';
import { Container } from 'reactstrap';
import axios from 'axios';
import Template from './Template';
import { Pie, Bar, HorizontalBar } from 'react-chartjs-2'; 
import SuperAdminView from '../components/Profile/SuperAdminView';
import AdminView from '../components/Profile/AdminView';
import StudentView from '../components/Profile/StudentView';

export default class Profile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
        userID: this.props.user.userID,
        username: this.props.user.username,
        email: "",
        permission: this.props.user.permission,

        sessions: [],
        bestModule: "", 
        moduleAverageScores: [],
        mostFrequentPlatform: "", 
        platformFrequency: [], 
        mostUtilizedPlatform: "",
        platformUtilization: [],
        displayChart: 0, 
        emptySession: false,  
    };
    this.change = this.change.bind(this);
  }

  componentDidMount() {
    this.verifyPermission(); 
    this.getUserInfo(); 
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

  getUserInfo = () => {
    axios.get(this.props.serviceIP + '/user', {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    }).then(async res => {
        this.setState({
          userID: res.data.id,
          username: res.data.username,
          email: res.data.email === null ? "" : res.data.email
        });

        await axios.get(this.props.serviceIP + '/searchsessions', {params: {userID: res.data.id},
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        }).then(res => {
          //make a check for res.data if its empty 
          this.setState({
            sessions: res.data
          })

        }).catch(function (error) {
          console.log(error);
        });

    }).catch(function (error) {
      console.log(error);
    });
  }

  editEmail = (e) => {
    this.setState({ email: e.target.value }); 
  }

  convertTimetoDecimal = (time) => {
    let hoursMinutes = time.split(/[.:]/);
    let hours = parseInt(hoursMinutes[0], 10);
    let minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
    return hours + minutes / 60;
  }

  renderPerformanceChart = () => {
    let possibleColors=['#abc9cd', '#658e93', '#7abe80', '#45954c', '#ffbdbd']

    let chartColors = [];
    let colorIndex = 0;

    for (let i = 0; i < this.state.moduleAverageScores.length; i++){
      chartColors.push(possibleColors[colorIndex]);
      
      colorIndex++;
      
      if(colorIndex >= possibleColors.length){
        colorIndex = 0;
      }
    }

    let performanceData = {
      labels: this.state.moduleAverageScores.map((entry) => {return entry.name}),
      datasets: [
        {
          label: 'Average Score (%)',
          data: this.state.moduleAverageScores.map((entry) => {return entry.average.toFixed(2)}),
          backgroundColor: chartColors
        }
      ]
    };
    
    return (
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
    )
  }
  
  renderFrequencyChart = () => {
    let frequencyData = {
			labels: ['Mobile', 'PC', 'VR'],
			datasets: [
				{
					label: 'platforms',
					data: this.state.platformFrequency.map(platform => {return platform.size}),
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

  renderUtilizationChart = () => {
    let utilizationData = {
			labels: ['Mobile', 'PC', 'VR'],
			datasets: [
				{
          label: 'Avg # of hours',
					data: this.state.platformUtilization.map(platform => {return platform.duration.toFixed(2)}),
					backgroundColor: ['#30C3CD', '#E8804C', '#097275']
				}
			]
    };

    return (
      <HorizontalBar
        data={utilizationData}
        options={ { 
          scales: {
          yAxes: [{
            ticks: {
              fontColor: 'white'
            }
          }],
          xAxes: [{
            ticks: {
              beginAtZero: true, 
              min: 0,
              fontColor: 'white'
          }
          }]
          },
          legend: {labels: { fontColor: 'white' } }
        }
      }
      />
    )
  }

  toggleChartAnimation = (key) => {
    this.setState({ displayChart: Number(key) }) 
  }

  change(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  render() { 
    return (
      <Container>
      <Template permission={this.state.permission}/>
		  <br></br>
        {this.state.permission === "su" ? 
        <SuperAdminView 
          serviceIP={this.props.serviceIP} 
          username={this.state.username}
          email={this.state.email}
          permission={this.state.permission}
          editEmail={this.editEmail}
        /> : null}
        {this.state.permission === "pf" ? 
        <AdminView 
          serviceIP={this.props.serviceIP} 
          username={this.state.username}
          email={this.state.email}
          permission={this.state.permission}
          editEmail={this.editEmail}
        /> : null}
        {this.state.permission === "st" ? 
        <StudentView 
          serviceIP={this.props.serviceIP} 
          username={this.state.username}
          email={this.state.email}
          permission={this.state.permission}
          editEmail={this.editEmail}
        /> : null}
      <br/>
      </Container>
    );
  }
}
