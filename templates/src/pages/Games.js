import React, { Component } from 'react';
import { Row, Col, Card } from 'reactstrap';
import MainTemplate from '../pages/MainTemplate'; 
import Template from '../pages/Template';
import Select from 'react-select'
import {Link} from 'react-router-dom';

import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/font-awesome/css/font-awesome.min.css';
import '../lib/owlcarousel/assets/owl.carousel.min.css';
import '../lib/ionicons/css/ionicons.min.css';

import elleVR from '../Images/ELLEVR.mp4';


export default class Games extends Component {
	constructor(props) {
		super(props);

		this.state = {
			permission: this.props.user.permission
		}
	}  

	componentDidMount() {
		this.verifyPermission(); 
	}

	verifyPermission = () => {
		const jwt = localStorage.getItem('jwt');
		if (!jwt) {
		  this.props.history.push(this.props.location.pathname);
		}
		else {
		  var jwtDecode = require('jwt-decode');
	
		  var decoded = jwtDecode(jwt);
		  
		  this.setState({ permission: decoded.user_claims.permission }); 
		}
	}   

	render() {
	return (  
		
	<div className="downloadsBg">
		<a id="top"></a>
		
		{localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={this.state.permission}/>}

		<div class="dropdown show" style={{width: "40px", height: "25px", marginLeft: "1150px"}}>
			<a class="btn btn-secondary dropdown-toggle" href="#" role="button" id="actions" data-toggle
			="dropdown" aria-haspopup="true" aria-expanded="false"> Select a Game 
			</a>

			<div class="dropdown-menu" aria-labelledby="actions">
				<a class="dropdown-item" href="#">Add</a>
				<a class="dropdown-item" href="#">Edit</a>
				<a class="dropdown-item" href="#">Delete</a>
			</div>
		</div>

			<a id="ELLEVR">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#5da8af"}}>
					<Row>
						<Col>
							<h3 className="cta-title">ELLEments Of Learning</h3>
							<p className="cta-text">Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
								<Row>
									<Col>
										<li>Kaarthik Alagappan</li>
										<li>Jonathan Jules</li>
										<li>Tiffany Lin</li>
									</Col>
									<Col>
										<li>Catalina Morales</li>
										<li>Samuel Tungol</li>
									</Col>
								</Row>
							</ul>
							<p className="cta-text">
								Available on: 
								<a href="https://www.wikipedia.org/">
									<img 
										style={{width: "40px", height: "25px", margin: "5px 5px 10px 5px"}} 
										src={require('../Images/steam.png')}
									/>
								</a>
							</p>
							<video width="450" height="280" controls>
								<source src={elleVR} type="video/mp4" />
							</video>
						</Col>
						<Col>
							<img style={{width: "350px", height: "255px", marginLeft: "100px"}} src={require('../Images/ELLEmentsOfLearningLogo.png')} />
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>

		<a id="AnimELLE">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#3f6184"}}>
					<Row>
						<Col>
							<h3 className="cta-title">AnimELLE Crossing</h3>
							<p className="cta-text">Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
								<Row>
									<Col>
										
									</Col>
									<Col>
										
									</Col>
								</Row>
							</ul>
							<p className="cta-text">
								Available on: 
								
							</p>
							
						</Col>
						<Col>
							
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>

		<a id="SpicenSpELLE">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#5da8af"}}>
					<Row>
						<Col>
							<h3 className="cta-title">Spice N SpELLE</h3>
							<p className="cta-text">Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
								<Row>
									<Col>
										
									</Col>
									<Col>
										
									</Col>
								</Row>
							</ul>
							<p className="cta-text">
								Available on: 
								
							</p>
							
						</Col>
						<Col>
							
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>

		<a id="HighriseHELLEp">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#3f6184"}}>
					<Row>
						<Col>
							<h3 className="cta-title">Highrise HELLEp</h3>
							<p className="cta-text">Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
								<Row>
									<Col>
										
									</Col>
									<Col>
										
									</Col>
								</Row>
							</ul>
							<p className="cta-text">
								Available on: 
								
							</p>
							
						</Col>
						<Col>
							
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>

		<a id="Maze">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#5da8af"}}>
					<Row>
						<Col>
							<h3 className="cta-title">Maze Game</h3>
							<p className="cta-text">Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
								<Row>
									<Col>
										
									</Col>
									<Col>
										
									</Col>
								</Row>
							</ul>
							<p className="cta-text">
								<Link to='MazeGame'>Play Here!</Link>
								
							</p>
							
						</Col>
						<Col>
							
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>
		
		<footer id="footer">
			<div className="container">

				<div className="copyright"><a href="#top">Back to top</a> <br /> &copy; Copyright 2022 <strong>Reveal</strong>. All Rights Reserved</div>
				<div className="credits">
				{/*
				All the links in the footer should remain intact.
				You can delete the links only if you purchased the pro version.
				Licensing information: https://bootstrapmade.com/license/
				Purchase the pro version with working PHP/AJAX contact form: https://bootstrapmade.com/buy/?theme=Reveal
				*/}
				Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a>
				</div>
			</div>
		</footer>
	</div>
  );
	}
}
