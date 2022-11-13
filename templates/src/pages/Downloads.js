import React, { Component } from 'react';
import { Row, Col, Card } from 'reactstrap';
import MainTemplate from '../pages/MainTemplate'; 
import Template from '../pages/Template';

import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/font-awesome/css/font-awesome.min.css';
import '../lib/owlcarousel/assets/owl.carousel.min.css';
import '../lib/ionicons/css/ionicons.min.css';

import betterRacerPromo from '../Images/ELLEBetterRacerPromo.mp4';
import betterRacer from '../Images/ELLEBetterRacer.mp4';
import elleCardGamePromo from '../Images/ELLECardGamePromo.mp4';
import ellePC from '../Images/ELLEPC.mp4';
import elleVR from '../Images/ELLEVR.mp4';

import banner from '../Images/ELLEDownloadsBanner.mp4';

export default class Downloads extends Component {
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
		{localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={this.state.permission}/>}
		
		<a id="ELLEBetterRacer">
		<section style={{color: "white"}}>
		<div className="container">
				<div className="infoCard" style={{backgroundColor: "#7b56de"}}>
					<Row>
					<Col>
						<h3 className="cta-title">ELLE Better Racer</h3>
						<p className="cta-text">Senior Design Team:</p>
						<ul style={{color: '#ffffff'}}>
								<li>Jinyu Pei</li>
								<li>Zach Schickler</li>
								<li>Reinaldo Villasmil</li>
						</ul>
						<Row>
							<Col>
								<p className="cta-text">
									Available on: 
									<a href="https://apps.apple.com/us/app/elle-betterracer/id1526188435">
										<img 
											style={{width: "25px", height: "25px", margin: "5px 5px 10px 5px"}} 
											src={require('../Images/app-store.png')}
										/>
									</a>
									<a href="https://play.google.com/store/apps/details?id=com.androidelle.ellemobileracer">
										<img 
											style={{width: "25px", height: "25px", margin: "5px 5px 10px 5px"}} 
											src={require('../Images/google-play.png')}
										/>
									</a>
								</p>
							</Col>
							<Col>
								<p className="cta-text">
									Compatible with: 
									<img 
										style={{width: "25px", height: "25px", margin: "5px 5px 10px 5px"}} 
										src={require('../Images/apple.png')}
									/>
									<img 
										style={{width: "25px", height: "25px", margin: "5px 5px 10px 5px"}} 
										src={require('../Images/android.png')}
									/>
								</p>
							</Col>
						</Row>
						<video width="450" height="280" controls>
							<source src={betterRacer} type="video/mp4" />
						</video>
					</Col>
					<Col>
						<img style={{width: "375px", height: "225px", marginLeft: "80px"}} src={require('../Images/ELLEBetterRacerLogo.png')} />
					</Col>
					</Row>
				</div>
			</div>
			</section>
			</a>

			<a id="ELLECardGame">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "rgb(212 145 167)"}}>
					<Row>
						<Col>
							<img style={{width: "250px", height: "255px", marginLeft: "100px"}} src={require('../Images/ELLECardGameLogo.png')} />
							<video width="450" height="280" controls>
								<source src={ellePC} type="video/mp4" />
							</video>
						</Col>
						<Col>
							<h3 className="cta-title">ELLE Card Game</h3>
							<p className="cta-text">Original Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
									<li>Noah Corlew</li>
									<li>Kalvin Miller</li>
									<li>Michael Santiago</li>
							</ul>
							<p className="cta-text">Version 2 Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
									<li>Annabel Bland</li>
									<li>Tyler Morejon</li>
									<li>Nathan Otis</li>
									<li>Daniel Rodriguez</li>
									<li>Tanner Williams</li>
							</ul>
							<Row>
								<Col>
									<p className="cta-text">
										Download here:
										<a href="https://drive.google.com/file/d/1V1ZBStOaue4ZGBM9MDqhJBQZFs7IaPei/view" target="blank">
											<img 
												style={{width: "25px", height: "25px", margin: "5px 5px 10px 5px"}} 
												src={require('../Images/windows.png')}
											/>
										</a>
										<a href="https://drive.google.com/file/d/11Bx20KKgv0oNQ7XXj-Z6QGG4eyi4SBTt/view?usp=sharing" target="blnk">
											<img 
												style={{width: "25px", height: "25px", margin: "5px 5px 10px 5px"}} 
												src={require('../Images/apple.png')}
											/>
										</a>
									</p>
								</Col>
								<Col>
									<p className="cta-text">
										Download Instructions:
										<a href="https://vimeo.com/452605256" target="blank">
										<img 
											style={{width: "25px", height: "25px", margin: "5px 5px 10px 5px"}} 
											src={require('../Images/windows.png')}
										/>
										</a>
										<a href="https://drive.google.com/file/d/1jxcq8s3JdOlZIU9zFUr8npFRNfvVygY1/view?usp=sharing" target="blank">
										<img 
											style={{width: "25px", height: "25px", margin: "5px 5px 10px 5px"}} 
											src={require('../Images/apple.png')}
										/>
										</a>
									</p>
								</Col>
							</Row>
							
						</Col>
					</Row>
				</div>
			</div>
			</section>
			</a>

			<a id="ELLEVR">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#00a1cd"}}>
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
								<a href="">
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
		
		<footer id="footer">
			<div className="container">
				<div className="copyright">&copy; Copyright 2022 <strong>Reveal</strong>. All Rights Reserved</div>
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
