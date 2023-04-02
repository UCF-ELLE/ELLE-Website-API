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

	handleGameChange = (selectedOption) => {
		const value = selectedOption.value;
		const element = document.getElementById(value);
		if (element) {
		  element.scrollIntoView({ behavior: 'smooth' });
		}
	  };
	
	 options = [
		{ value: 'Maze', label: 'Maze Game' },
		{ value: 'CardGame', label: 'ELLE Card Game' },
		{ value: "AnimELLE", label: 'AnimELLE Crossing' },
		{ value: "ELLEVR", label: 'VR Games' },
		{ value: "SpinNSpELLE", label: 'SpinNSpELLE' },
		{ value: "HELLEsKitchen", label: 'HELLEsKitchen' },
		// add more games as needed
	  ];

	render() {
	return (  
		
	<div className="gamesBg">
		<a id="top"></a>
		
		{localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={this.state.permission}/>}

		{/* Create the game selection dropdown menu */}
		<br />
		<Select className="dropdown button" options={this.options} onChange={this.handleGameChange} placeholder="Select a Game" />

		<a id="Maze">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#5da8af"}}>
					<Row>
						<Col>
							<h3 className="cta-title">ELLE aMAZEing Game</h3>
							<p className="cta-text">Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
							<Row>
									<Col>
										<li>Annabel Bland</li>
										<li>Tyler Morejon</li>
										<li>Nathan Otis</li>
									</Col>
									<Col>
										<li>Daniel Rodriguez</li>
										<li>Tanner Williams</li>
									</Col>
							</Row>
							</ul>
							<br />
							Follow the instructions to choose the correct path from a few options while learning Spanish in this immersive game!
							<p className="cta-text">
								<br />
								<Link to='/mazegame' className="mazeButton">Play Here!</Link>
								<strong style={{color: '#cc0000'}}>&nbsp;&nbsp;Note: You must be logged in to play! </strong>
							</p>
							
						</Col>
						<Col>
							<img style={{width: "520px", height: "320px", marginLeft: "70px"}} src={require('../Images/mazeGameplay.png')} />
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>

		<a id="CardGame">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#3f6184"}}>
					<Row>
						<Col>
							<h3 className="cta-title">ELLE Card Game</h3>
							<p className="cta-text">Original Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
							<Row>
									<Col>
										<li>Noah Corlew</li>
										<li>Kalvin Miller</li>
										<li>Michael Santiago</li>
									</Col>
							</Row>
							</ul>
							
							<p className="cta-text">Version 2 Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
							<Row>
									<Col>
										<li>Annabel Bland</li>
										<li>Tyler Morejon</li>
										<li>Nathan Otis</li>
									</Col>
									<Col>
										<li>Daniel Rodriguez</li>
										<li>Tanner Williams</li>
									</Col>
							</Row>
							</ul>
							<p className="cta-text">Version 3 Senior Design Team</p>
							<ul style={{color: '#ffffff'}}>
							<Row>
									<Col>
										<li>Nathan Lim</li>
										<li>Justin Moy</li>
										<li>Connor Lysek</li>
									</Col>
									<Col>
										<li>Skylar Marosi</li>
										<li>Keilvin Tran</li>
									</Col>
							</Row>
							</ul>
							<br />
							<p className="cta-text"> Come learn a language, select your own mentor, and play to unlock unique prizes and customization! </p>
							<p className="cta-text">
                            <Link to='/cardgame' className="cardGameButton">Play Here!</Link>
							<strong style={{color: '#cc0000'}}>&nbsp;&nbsp;Note: You must be logged in to play! </strong>
							</p>
							
						</Col>
						<Col>
							<img style={{width: "450px", height: "355px", marginLeft: "20px"}} src={require('../Images/ELLECardGameLogo.png')} />
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>

		<a id="AnimELLE">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#5da8af"}}>
					<Row>
						<Col>
							<h3 className="cta-title">AnimELLE Crossing</h3>
							<p className="cta-text">Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
								<Row>
									<Col>
										<li>Natali Siam-Pollo</li>
										<li>Trevor Larson</li>
										<li>Justin Reeves</li>
									</Col>
									<Col>
										<li>Derek Dyer</li>
										<li>Tam Nguyen</li>
									</Col>
								</Row>
							</ul>
							<p className="cta-text">
								Insert a really cool description. 
								
							</p>
							<p className ="cta-text">
								<br />
								<br />
								<br />
								<br />
								<br />
								<br />
								<br />
								<br />
							<Link to='/animellegame' className="mazeButton">Play Here!</Link>

							</p>
							
						</Col>
						<Col>
						<img style={{width: "405px", height: "486px", marginLeft: "10px"}} src={require('../Images/ELLEIsabelle.png')} />
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>

		<a id="ELLEVR">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#3f6184"}}>
					<Row>
						<Col>
							<h3 className="cta-title">ELLEments Of Learning (VR Games)</h3>
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
								Games available below!
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

		<a id="SpinNSpELLE">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#5da8af"}}>
					<Row>
						<Col>
							<h3 className="cta-title">Spin N SpELLE</h3>
							<br />
							Spell out the translation of terms using alphabet blocks. Play in either quiz mode or try your luck at endless mode!
							<p className="cta-text">
							<br /> <br /> <br />
								<a class="spinButton" href='https://ucfgrl.itch.io/elle-the-endless-learner-ellements-of-learning'>Available Here!</a>
								
							</p>
							
						</Col>
						<Col>
						<img style={{width: "350px", height: "255px", marginLeft: "100px"}} src={require('../Images/spinnspellBlocks.png')} />
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
							<br />
							Play as a firefighter in this action packed game. Connect terms to their correct categorys to put out fires and save the day!
							<p className="cta-text">
							<br /> <br /> <br /> <a class="highriseButton" href='https://ucfgrl.itch.io/elle-the-endless-learner-ellements-of-learning'>Available Here!</a>
								
								
							</p>
							
						</Col>
						<Col>
						<img style={{width: "470px", height: "255px", marginLeft: "100px"}} src={require('../Images/highrise.jpg')} />
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>

		<a id="HELLEsKitchen">
			<section style={{color: "white"}}>
			<div className="container">
				<div className="infoCard" style={{backgroundColor: "#5da8af"}}>
					<Row>
						<Col>
							<h3 className="cta-title">HELLE's Kitchen</h3>
							<p className="cta-text">Senior Design Team:</p>
							<ul style={{color: '#ffffff'}}>
								<Row>
									<Col>
										<li>Allexis Knight</li>
										<li>Arianna Walters</li>
										<li>Dylan Quigley</li>
									</Col>
									<Col>
										<li>Edgard Irineo</li>
										<li>Manatsa Chiomadzi</li>
									</Col>
								</Row>
							</ul>
							<br />
							Follow recipes in Spanish to search the kitchen for ingredients. Cook them up to discover the dish of the unit!
							<p className="cta-text">
							<br /> 
								<a class="spinButton" href='https://ucfgrl.itch.io/elle-the-endless-learner-ellements-of-learning'>Available Here!</a>
								
							</p>
							
						</Col>
						<Col>
						<br /><img style={{width: "514px", height: "289px", marginLeft: "100px"}} src={require('../Images/helleskitchen.jpg')} />
						</Col>
					</Row>
				</div>
		</div>
		</section>
		</a>
		
		
		<footer id="footer">
			<div className="container">

				<div className="copyright"><a href="#top">Back to top</a> <br /> &copy; Copyright held by UCF. All Rights Reserved</div>
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
