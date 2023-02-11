import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import MainTemplate from '../pages/MainTemplate';
import Template from '../pages/Template';
import Footer from '../components/Footer';

import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/font-awesome/css/font-awesome.min.css';
import '../lib/owlcarousel/assets/owl.carousel.min.css';
import '../lib/ionicons/css/ionicons.min.css';

export default class Home extends Component {
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
			<div>
				{localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={this.state.permission} />}

				<section id="intro">
					<div className="intro-content">
						<h2>The <span>ultimate</span> way<br />to learn a language.</h2>
						<div>
							<Link to='/games' className="btn-projects scrollto">Play ELLE</Link>
						</div>
					</div>
				</section>


				<section id="about" className="wow fadeInUp">
					<div className="container">
						<div className="row">
							<div className="col-lg-6 about-img">
								<img src={require('../Images/ELLE/ELLE_Login.jpg')} alt="" />
							</div>
							<div className="col-lg-6 content">
								<h2>Meet the Endless Learner.</h2>
								<ul>
									<li><i className="ion-android-checkmark-circle" /> Play an endless runner game where you choose the right translations to keep going!</li>
									<li><i className="ion-android-checkmark-circle" /> Create an account to view statistics, compare your scores, and make new language packs!</li>
									<li><i className="ion-android-checkmark-circle" /> Use ELLE to study for exams or conduct research of your own!</li>
									<li><i className="ion-android-checkmark-circle" /> Available in desktop, mobile, and virtual reality versions!</li>
								</ul>
							</div>
						</div>
					</div>
					<br />
				</section>


				<section id="services" className="wow fadeInUp">
					<div className="container">
						<div className="section-header">
							<h2>What's possible with ELLE</h2>
							<p><Link to='/register'>Sign up</Link> for ELLE now and get a unique profile and tools to make the most of your ELLE experience.</p>
						</div>
						<div className="row">
							<div className="col-lg-6">
								<div className="box wow fadeInLeft">
									<div className="icon"><i className="fa fa-list-ol" /></div>
									<h4 className="title">Study Vocabulary</h4>
									<p className="description">You can view a list of words from every language pack you have. You can view words,
										their translations, and their image and audio files.</p>
								</div>
							</div>
							<div className="col-lg-6">
								<div className="box wow fadeInRight">
									<div className="icon"><i className="fa fa-language" /></div>
									<h4 className="title">Create Language Decks</h4>
									<p className="description">Build a dictionary of words for any language. Play games with any decks that you create,
										or play games with decks made by other players.</p>
								</div>
							</div>
							<div className="col-lg-6">
								<div className="box wow fadeInLeft" data-wow-delay="0.2s">
									<div className="icon"><i className="fa fa-bar-chart" /></div>
									<h4 className="title">View Statistics</h4>
									<p className="description">Look at data from every session you've ever played. See how well you do on certain languages
										and what words you should work on the most.</p>
								</div>
							</div>
							<div className="col-lg-6">
								<div className="box wow fadeInRight" data-wow-delay="0.2s">
									<div className="icon"><i className="fa fa-user" /></div>
									<h4 className="title">Communicate with Instructors</h4>
									<p className="description">ELLE makes it easy for instructors to see how you are progressing through a language.
										They can use your scores and sessions and to help students learn.</p>
								</div>
							</div>
						</div>
					</div>
				</section>


				<section id="team" className="wow fadeInUp">
					<div className="container">
						<div className="section-header">
							<h2>Sponsors</h2>
						</div>
						<div className="row" style={{ textAlign: 'center' }}>
							<div className="col-lg-12">
								<h2><a href="https://gamesresearch.cah.ucf.edu/">
									UCF GaIM Research Group</a></h2>
								<p>Orlando Tech Center Bldg 500, Orlando, FL 32826</p>
								<p><br /></p>
							</div>
						</div>
						<div className="row" style={{ textAlign: 'center' }}>
							<div className="col-lg-4">
								<h4>Dr. Emily Johnson</h4>

								<p>Assistant Professor, English</p>
							</div>
							<div className="col-lg-4">
								<h4>Dr. Amy Giroux</h4>
								<p>Associate Director, Center for Humanities and Digital Research</p>
							</div>
							<div className="col-lg-4">
								<h4>Dr. Don Merritt</h4>
								<p>Director, Division of Digital Learning</p>
							</div>
						</div>
						<div className="row" style={{ textAlign: 'center' }}>
							<div className="col-lg-4">
								<h4>Dr. Sandra Sousa</h4>
								<p>Associate Professor, Portuguese</p>
							</div>
							<div className="col-lg-4">
								<h4>Dr. Gergana Vitanova</h4>
								<p>Professor, Modern Languages and Literatures</p>

							</div>
						</div>
					</div>
				</section>


				<div className="row" style={{ textAlign: 'center' }}>
					<div className="col-lg-12">
						<br /><br />
						<p>ELLE is a Senior Design project made at the University of Central
							Florida under the direction of Dr. Mark Heinrich.</p>
						<br />
					</div>
				</div>


				<Footer></Footer>

			</div>
		);
	}
};

