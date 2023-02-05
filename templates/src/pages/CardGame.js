import React, { Component } from 'react';

import { Button } from 'reactstrap';
import MainTemplate from '../pages/MainTemplate';
import Template from '../pages/Template';
import Footer from '../components/Footer';

import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/font-awesome/css/font-awesome.min.css';
import '../lib/owlcarousel/assets/owl.carousel.min.css';
import '../lib/ionicons/css/ionicons.min.css';

// import banner from '../Images/ELLEDownloadsBanner.mp4';

import Unity, { UnityContext } from "react-unity-webgl";

const unityContext = new UnityContext({
    loaderUrl: "Unity-Game-WebGL-Builds/Card-Game/Build.loader.js",
    dataUrl: "Unity-Game-WebGL-Builds/Card-Game/Build.data",
    frameworkUrl: "Unity-Game-WebGL-Builds/Card-Game/Build.framework.js",
    codeUrl: "Unity-Game-WebGL-Builds/Card-Game/Build.wasm",
});

export default class CardGame extends Component {
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
                    <Unity unityContext={unityContext} style={{ width: "1152px", height: "648px" }}/>
                    <br />
                    <br />
                    <Button onClick={this.handleOnClickFullscreen}>Fullscreen</Button>
                    <p></p>
                    <br />
                </center>
                <h3 className="cardGameText" style={{color: "white"}} >ELLE Card Game</h3>
                <p className="cardGameText" style={{color: "white"}} >Senior Design Team:</p>
                <ul className="cardGameText" style={{color: "white"}} >
                        <li>Justin Moy</li>
                        <li>Connor Lysek</li>
                        <li>Keilvin Tran</li>
                        <li>Nathan Lim</li>
                        <li>Skylar Marosi</li>
                </ul>
                <p className="cardGameText" style={{color: "white"}}>If there are no available modules for you to select, try logging out and logging back in. Also, make sure you are on the secure version of the site - if you look at the URL bar, to the left you should see the word "Secure" or a closed lock. If you do not see that, click <a href="https://endlesslearner.com/mazegame">here</a> to be redirected to the secure version of this page.</p>
                <br />
                <p></p>
                <Footer></Footer>
            </div>
        );
	}
}
