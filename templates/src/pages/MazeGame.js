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
    loaderUrl: 'Unity-Game-WebGL-Builds/Maze-Game/Build.loader.js',
    dataUrl: 'Unity-Game-WebGL-Builds/Maze-Game/Build.data',
    frameworkUrl: 'Unity-Game-WebGL-Builds/Maze-Game/Build.framework.js',
    codeUrl: 'Unity-Game-WebGL-Builds/Maze-Game/Build.wasm',
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
            <div className="downloadsBg mainDiv">
                
                {localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={this.state.permission}/>}
                <br />
                <center>
                <Unity unityContext={unityContext} style={{
                    height: "75%",
                    width: "75%",
                    border: "2px solid black",
                    background: "grey",
                }}/>
                <br />
                <br />
                <Button onClick={this.handleOnClickFullscreen}>Fullscreen</Button>
                <p></p>
                <br />
                </center>
                <p className="mazeGame"><font color="black">If there are no available modules for you to select, try logging out and logging back in.</font></p>
                <br />
                <p></p>
                <Footer></Footer>
            </div>
        );
	}
}