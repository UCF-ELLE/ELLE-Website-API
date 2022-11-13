import React, { Component } from 'react';

import { Button } from 'reactstrap';
import MainTemplate from '../pages/MainTemplate'; 
import Template from '../pages/Template';

import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/font-awesome/css/font-awesome.min.css';
import '../lib/owlcarousel/assets/owl.carousel.min.css';
import '../lib/ionicons/css/ionicons.min.css';

// import banner from '../Images/ELLEDownloadsBanner.mp4';

import Unity, { UnityContext } from "react-unity-webgl";

const unityContext = new UnityContext({

  loaderUrl: 'Build/Build419.loader.js',
  dataUrl: 'Build/Build419.data',
  frameworkUrl: 'Build/Build419.framework.js',
  codeUrl: 'Build/Build419.wasm',
});

unityContext.on("GameLoaded", () => {
	sendLogin();
});
function sendLogin() {
	const jwt = localStorage.getItem('jwt');
	unityContext.send("ContinueButton", "loginAttempt", jwt);
  }
export default class MazeGameFinal extends Component {
	constructor(props) {
		super(props);

		this.state = {
			permission: this.props.user.permission,
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
	  
	handleOnClickFullscreen() {
		  unityContext.setFullscreen(true);
	}

	render() {
	return (  
	<div className="downloadsBg">
		
		{localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={this.state.permission}/>}
						<br />
						<center>
						{<Unity unityContext={unityContext} style={{
							height: "75%",
							width: "75%",
							border: "2px solid black",
							background: "grey",
						}}/>}
						<br />
						<br />
						<Button onClick={this.handleOnClickFullscreen}>Fullscreen</Button>
						<p></p>
						<br />
						</center>
						<h3 className="mazeGame" >ELLE aMAZEing Game</h3>
						<p className="mazeGame">Senior Design Team:</p>
						<ul className="mazeGame">
								<li>Annabel Bland</li>
								<li>Tyler Morejon</li>
								<li>Nathan Otis</li>
                                <li>Daniel Rodriguez</li>
                                <li>Tanner Williams</li>
						</ul>
						<p className="mazeGame">If there are no available modules for you to select, try logging out and logging back in. Also, make sure you are on the secure version of the site - if you look at the URL bar, to the left you should see the word "Secure" or a closed lock. If you do not see that, click <a href="https://endlesslearner.com/mazegame">here</a> to be redirected to the secure version of this page.</p>
						<br />
						<p></p>
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