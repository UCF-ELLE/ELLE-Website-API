import React, { useState, useCallback, useEffect } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import MainTemplate from '../pages/MainTemplate';
import Template from '../pages/Template';
import Footer from '../components/Footer';

import logo from '../Images/AnimELLE/logo0309.svg';
import instruct from '../Images/AnimELLE/instructions.png';
import tito from '../Images/AnimELLE/tito.png';
import a from '../Images/AnimELLE/akey.svg';
import e from '../Images/AnimELLE/ekey.svg';
import p from '../Images/AnimELLE/pkey.svg';
import q from '../Images/AnimELLE/qkey.svg';
import keys from '../Images/AnimELLE/keyboard.png';
import cursor from '../Images/AnimELLE/mouse.svg';
import space from '../Images/AnimELLE/space.svg';

import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/font-awesome/css/font-awesome.min.css';
import '../lib/owlcarousel/assets/owl.carousel.min.css';
import '../lib/ionicons/css/ionicons.min.css';

function AnimELLEGame(props) {
    const [permission, setPermission] = useState(props.user.permission);
    const [sessionID, setSessionID] = useState();
    const [playerScore, setPlayerScore] = useState();

    useEffect(() => {
        verifyPermission();
    }, []);

    const verifyPermission = () => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            props.history.push(props.location.pathname);
        }
        else {
            var jwtDecode = require('jwt-decode');
            var decoded = jwtDecode(jwt);
            setPermission(decoded.user_claims.permission);
        }
    }

    const { unityProvider, requestFullscreen, isLoaded, sendMessage, loadingProgression } = useUnityContext({
        loaderUrl: "Unity-Game-WebGL-Builds/AnimELLE-Crossing/Build.loader.js",
        dataUrl: "Unity-Game-WebGL-Builds/AnimELLE-Crossing/Build.data",
        frameworkUrl: "Unity-Game-WebGL-Builds/AnimELLE-Crossing/Build.framework.js",
        codeUrl: "Unity-Game-WebGL-Builds/AnimELLE-Crossing/Build.wasm",
    });

    // Automatically log the user into the Unity Card Game
    if (isLoaded === true) {
        const jwt = localStorage.getItem('jwt');
        sendMessage("GameManager", "loginAttempt", jwt);
    }

    //   useEffect(() => {
    //     window.addEventListener('beforeunload', beforeLeave)
    //     window.addEventListener('unload', onLeave)
    //     return () => {
    //       window.removeEventListener('beforeunload', beforeLeave)
    //       window.addEventListener('unload', onLeave)
    //     }
    //   }, [])

    //   const beforeLeave = e => {
    //     unityContext.send("GameController","LeavingPage", "LeavePageEvents");
    //     e.preventDefault()
    //     e.returnValue = ''
    //   }

    //   const onLeave = e => {
    //     //send session API here
    //     let header = {
    //       headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
    //     }
    //     //axios.post("http://147.182.221.58:5050/api/endsession", {sessionID: sessionID, playerScore: playerScore}, header)
    //     //.then(response => {console.log(response)})
    //     //.catch(er => {console.log(er)})
    //   }



    //fullscreen
    function handleClick() {
        console.log("pressing button");
        requestFullscreen(true);
    }


    // We'll use a state to store the device pixel ratio.
    const [devicePixelRatio, setDevicePixelRatio] = useState(
        window.devicePixelRatio
    );

    const handleChangePixelRatio = useCallback(
        function () {
            // A function which will update the device pixel ratio of the Unity
            // Application to match the device pixel ratio of the browser.
            const updateDevicePixelRatio = function () {
                setDevicePixelRatio(window.devicePixelRatio);
            };
            // A media matcher which watches for changes in the device pixel ratio.
            const mediaMatcher = window.matchMedia(
                `screen and (resolution: ${devicePixelRatio}dppx)`
            );
            // Adding an event listener to the media matcher which will update the
            // device pixel ratio of the Unity Application when the device pixel
            // ratio changes.
            mediaMatcher.addEventListener("change", updateDevicePixelRatio);
            return function () {
                // Removing the event listener when the component unmounts.
                mediaMatcher.removeEventListener("change", updateDevicePixelRatio);
            };
        },
        [devicePixelRatio]
    );


    return (
        <div class='animelle-game-container'>
            {localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={permission} />}
            <div className="webglLoadingStatusBox" style={{visibility: isLoaded ? "hidden" : "visible"}}>
                <p className="webglLoadingStatusText">Loading {Math.round(loadingProgression * 100)}%</p>
            </div>
            <div className='gameContainer'>
                <Unity unityProvider={unityProvider}
                    style={{
                        height: 900,
                        width: 900,
                        visibility: isLoaded ? "visible" : "hidden",
                        background: "transparent"
                    }} devicePixelRatio={devicePixelRatio}
                />
                <div className="btn">
                    <button type="button" class="btn btn-light" onClick={handleClick}>Fullscreen</button>
                </div>
            </div>

            <div className='divContainer'>
                <div className='instruct-filler'>
                    {/* <h4>Listen to Tito!</h4> <img src={tito} className='tito' alt="tito" /> */}
                </div>
                <div className='logoContainer'>
                    <div className='imgContainer'>
                        <img src={logo} className='logo' alt="game logo" />
                        <h3 className='credits'>Credits:</h3>
                    </div>
                    <div className="row">
                        <div className="column">
                            <p className='names'>Tam Nguyen </p>
                            <p className='names'>Justin Reeves</p>
                            <p className='names'>Natali Siam-Pollo</p>
                        </div>
                        <div className="column">
                            <p className='names'>Derek Dyer</p>
                            <p className='names'>Trevor Larson</p>
                        </div>
                    </div>  {/*<!--row--> */}
                </div> {/*<!--logo--> */}

                <div className='instruct-actual'>
                    <img src={instruct} className='instruct' alt="game logo" />
                    <div className="keyContainer">
                        <img src={keys} className='keys' alt="keys" />
                        <p className='instructions'>Moving the Player </p><br></br>
                    </div>
                    <div className="keyContainer">
                        <img src={cursor} className='keys' alt="keys" />
                        <p className='instructions'>Hovering Tooltips, Button Selection</p><br></br>
                    </div>
                    <div className="keyContainer">
                        <img src={e} className='keys' alt="keys" />
                        <p className='instructions'>For interacting with objects/NPCs with Emotes, Continue Dialogue</p><br></br>
                    </div>
                    <div className="keyContainer">
                        <img src={q} className='keys' alt="keys" />
                        <p className='instructions'>Opening Fast Travel Menu</p><br></br>
                    </div>
                    <div className="keyContainer">
                        <img src={p} className='keys' alt="keys" />
                        <p className='instructions'>Opening Pause Menu</p><br></br>
                    </div>
                    <div className="keyContainer">
                        <img src={a} className='keys' alt="keys" />
                        <p className='instructions'>Opening "Ask Tito" Menu</p><br></br>
                    </div>
                    <br></br>
                    <br></br>
                    {/* <p className='instructions'>-Scavenger Hunt:<br></br><br></br>"Spacebar" - For picking up Scavenger Hunt items, Continue Dialogue</p><br></br> */}

                    {/* CONTROLS FOR ANIMELLE CROSSING:
                        - General:
                        * Arrow Keys - Moving the Player
                        * Mouse - Hovering Tooltips, Button Selection
                        * "E" Key - For interacting with objects/NPCs with Emotes, Continue Dialogue
                        * "Q" - Opening Fast Travel Menu
                        * "P" - Opening Pause Menu
                        * "A" - Opening "Ask Tito" Menu


                        -Scavenger Hunt:
                        * W/A/S/D - Moving the Player
                        * Mouse -  Button Selection
                        * "E" Key - For interacting with NPCs with Emotes
                        * "Spacebar" - For picking up Scavenger Hunt items, Continue Dialogue 

                        - Matching Game, Fill-In-The-Blank, Multiple Choice
                        * Mouse -  Button Selection */
                    }
                </div>
            </div> {/*<!--divContainer--> */}
            <Footer></Footer>
        </div>
    );
}

export default AnimELLEGame;