/*************************
Converted from class-based to functional component in Spring 2023.
**************************/

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from 'reactstrap';
import { Unity, useUnityContext } from "react-unity-webgl";
import { Prompt } from 'react-router-dom';
import MainTemplate from '../pages/MainTemplate';
import Template from '../pages/Template';
import Footer from '../components/Footer';

import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/font-awesome/css/font-awesome.min.css';
import '../lib/owlcarousel/assets/owl.carousel.min.css';
import '../lib/ionicons/css/ionicons.min.css';

function CardGame(props) {
	const [permission, setPermission] = useState(props.user.permission);
    // Used to determine when the user is in the middle of a Card Game session (and NOT in any other screen e.g. the main menu)
    const UNITY_userIsPlayingGame = useRef(0);   // 0 = false, 1 = true | it's stinky I know, but Unity doesn't let us send booleans to React
    const UNITY_sessionID = useRef();
    const UNITY_playerScore = useRef();
    const UNITY_pausedTime = useRef();          // In-game time spent on pause menu, in seconds

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

    // Load Unity WebGL game
    const { unityProvider, requestFullscreen, isLoaded, sendMessage, loadingProgression, addEventListener, removeEventListener, unload } = useUnityContext({
        // If you change the file paths, you must also change the README in templates/public/Unity-Game-WebGL-Builds!
        loaderUrl: "Unity-Game-WebGL-Builds/Card-Game/Build.loader.js",
        dataUrl: "Unity-Game-WebGL-Builds/Card-Game/Build.data",
        frameworkUrl: "Unity-Game-WebGL-Builds/Card-Game/Build.framework.js",
        codeUrl: "Unity-Game-WebGL-Builds/Card-Game/Build.wasm",
    });

    // Event handlers for when Unity sends events to Event
    const UNITY_setUserIsPlayingGame = useCallback((state) => {
        UNITY_userIsPlayingGame.current = state;
    }, []);
    const UNITY_setSessionID = useCallback((sessionID) => {
        UNITY_sessionID.current = sessionID;
    }, []);
    const UNITY_setPlayerScore = useCallback((score) => {
        UNITY_playerScore.current = score;
    }, []);
    const UNITY_setPausedTime = useCallback((time) => {
        UNITY_pausedTime.current = time;
    }, []);
    
    // Taken from https://react-unity-webgl.dev/docs/api/event-system
    useEffect(() => {
        addEventListener("setUserIsPlayingGame", UNITY_setUserIsPlayingGame);
        addEventListener("setSessionID", UNITY_setSessionID);
        addEventListener("setPlayerScore", UNITY_setPlayerScore);
        addEventListener("setPausedTime", UNITY_setPausedTime);
        return () => {
            removeEventListener("setUserIsPlayingGame", UNITY_setUserIsPlayingGame);
            removeEventListener("setSessionID", UNITY_setSessionID);
            removeEventListener("setPlayerScore", UNITY_setPlayerScore);
            removeEventListener("setPausedTime", UNITY_setPausedTime);
        };
    }, [addEventListener, removeEventListener, UNITY_setUserIsPlayingGame, UNITY_setSessionID, UNITY_setPlayerScore, UNITY_setPausedTime]);
    
    // This runs only ONCE, when the component renders for the first time
    useEffect(() => {
        verifyPermission();
    });

    useEffect(() => {

        // Used to unload the Unity WebGL game (when user leaves the page)
        async function unloadUnityGame() {
            await unload();
        }

        // Warning Dialog box that pops up when user tries to close the browser/tab
        const openWarningDialog = (e) => {
            // Only run if the user is currently in the middle of a session
            if (UNITY_userIsPlayingGame.current) {
                // Get the player's current score, sessionID, and amount of paused time to prepare to end their session automatically
                sendMessage("GameManager", "WEBGL_ExtractGameInfo");
            }

            // Ask user to confirm if they want to leave the page
            e.preventDefault();

            /* Debug statements
            console.log("userIsPlayingGame: " + UNITY_userIsPlayingGame.current);
            console.log("sessionID: " + UNITY_sessionID.current);
            console.log("playerScore: " + UNITY_playerScore.current);
            console.log("pausedTime: " + UNITY_pausedTime.current);
            */

            e.returnValue = "";
        }

        /* Problem: user is in the middle of a Card Game play session and closes the browser. The /session API endpoint was called to start the Session, but 
        * the /endsession API endpoint was never called, forever putting that Session in limbo as no end time gets recorded for it.
        *
        * Solution: since the Unity game didn't get to end the session, call the /endsession endpoint using React
        */
        const endOngoingSession = () => {
            // Only run it if the user is currently in the middle of a session
            if (UNITY_userIsPlayingGame.current) {
                
                // Get current time
                let date = new Date();

                // Subtract in-game paused time
                let pausedTimeMilliSeconds = UNITY_pausedTime.current * 1000;
                let finalDate = new Date(date.getTime() - pausedTimeMilliSeconds);

                // 0-pad the minutes if it's less than 10 minutes (so it shows up like "09")
                let finalTimeMinutes = finalDate.getMinutes() < 10 ? "0" + finalDate.getMinutes() : finalDate.getMinutes();
                let finalTime = finalDate.getHours() + ":" + finalTimeMinutes;

                /* Debug statements
                console.log("Unity paused time: " + UNITY_pausedTime.current);
                console.log("Unity paused time (in milliseconds): " + pausedTimeMilliSeconds);

                console.log(currentTime + " - " + pausedTimeMilliSeconds + " milliseconds = " + finalTime);
                */

                // Have to use xhr because Axios's async property fails to do the API call when the browser closes
                let xhr = new XMLHttpRequest();
                xhr.open('POST', props.serviceIP + "/endsession", false);
                xhr.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("jwt"));
                xhr.setRequestHeader("Content-Type", "application/json");
                let data = JSON.stringify({
                    sessionID : UNITY_sessionID.current,
                    endTime : finalTime,
                    playerScore : UNITY_playerScore.current
                });
                xhr.send(data);
            }
        }

        window.addEventListener("beforeunload", openWarningDialog);
        window.addEventListener("unload", endOngoingSession);

        return () => {
            // Only run it AFTER the Unity game has loaded and WHEN the component is being unloaded
            if (isLoaded) {
                // Unload Unity WebGL instance to free memory
                unloadUnityGame();
                
                // End user's session
                endOngoingSession();
            }

            window.removeEventListener("beforeunload", openWarningDialog);
            window.removeEventListener("unload", endOngoingSession);
        }
    }, [isLoaded]);

    // Automatically log the user into the Unity Card Game
    if (isLoaded === true) {
        const jwt = localStorage.getItem('jwt');
        sendMessage("LoginButton", "WebGLLoginAttempt", jwt);
    }

    // Fullscreen button
	const handleOnClickFullscreen = () =>  {
        requestFullscreen(true);
	}

    // Sometimes the Unity window looks blurry on Retina screens. This fixes that.
    // Taken from https://react-unity-webgl.dev/docs/advanced-examples/dynamic-device-pixel-ratio
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
        <div>
            {localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={permission}/>}
            
            { /* Prevent user from accidentally clicking on a link and leaving the page */ }
            <Prompt
                when={isLoaded}
                message= {() => {
                    // This code runs when the user tries to leave the page (by clicking a link)
                    // Only run it if the user is currently in the middle of a session
                    if (UNITY_userIsPlayingGame.current) {
                        // Get the player's current score, sessionID, and amount of paused time to prepare to end their session automatically
                        sendMessage("GameManager", "WEBGL_ExtractGameInfo");
                    }

                    return "Are you sure you want to leave?";
                }}
            />
            <div className="center-contents">
                <div className="webglLoadingStatusBox" style={{visibility: isLoaded ? "hidden" : "visible"}}>
                    <p className="webglLoadingStatusText">Loading {Math.round(loadingProgression * 100)}%</p>
                </div>
                
                <Unity
                    unityProvider={unityProvider}
                    devicePixelRatio={devicePixelRatio}
                    style={{
                        width: "1152px",
                        height: "648px",
                        visibility: isLoaded ? "visible" : "hidden"
                    }}
                />
                <br />
                <br />
                <Button onClick={handleOnClickFullscreen} style={{visibility: isLoaded ? "visible" : "hidden"}}>Fullscreen</Button>
            </div>
            <br />
            <br />
            <Footer></Footer>
        </div>
    );
}

export default CardGame;