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
    // If you change the file paths, you must also change the README in templates/public/Unity-Game-WebGL-Builds!
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
            <div className="gamesBg mainDiv">
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
 
                <br />
                <p></p>
                <Footer></Footer>
            </div>
        );
	}
}
