'use client';
/*************************
Created functional component in Summer 2025
**************************/

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import { Button } from 'reactstrap';

import '@/lib/font-awesome/css/font-awesome.min.css';
import '@/lib/ionicons/css/ionicons.min.css';
import '@/lib/owlcarousel/assets/owl.carousel.min.css';
import '@/public/static/css/style.css';

import GameLayout, { GameContext } from '@/components/Layouts/GameLayout';
import { useUser } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { ReactUnityEventParameter } from 'react-unity-webgl/distribution/types/react-unity-event-parameters';

export default function BELLEtro() {
    const { user, loading: userLoading } = useUser();
    const [permission, setPermission] = useState(user?.permissionGroup);
    // Used to determine when the user is in the middle of a Pasta Game session (and NOT in any other screen e.g. the main menu)
    // Do note, the references are used to store the most recent values of the states, as the states themselves are reset when changing the page
    const { UNITY_userIsPlayingGame, setUNITY_userIsPlayingGame } = useContext(GameContext);
    const userPlayingGameRef = useRef(UNITY_userIsPlayingGame);
    const [UNITY_sessionID, setUNITY_sessionID] = useState('');
    const sessionIDRef = useRef(UNITY_sessionID);
    const [UNITY_currentAnte, setUNITY_currentAnte] = useState(0);
    const userScoreRef = useRef(UNITY_currentAnte);
    const [UNITY_mostFrequentHand, setUNITY_mostFrequentHand] = useState(0);
    const mostFrequentHandRef = useRef(UNITY_mostFrequentHand);

    // Load Unity WebGL game
    const { unityProvider, requestFullscreen, isLoaded, sendMessage, loadingProgression, addEventListener, removeEventListener, unload } =
        useUnityContext({
            // If you change the file paths, you must also change the README in templates/public/Unity-Game-WebGL-Builds!
            loaderUrl: '/elle/games/BELLEtro-Game/Build.loader.js',
            dataUrl: '/elle/games/BELLEtro-Game/Build.data',
            frameworkUrl: '/elle/games/BELLEtro-Game/Build.framework.js',
            codeUrl: '/elle/games/BELLEtro-Game/Build.wasm'
        });

    // Event handlers for when Unity sends events to Event
    // Unity doesn't let us send booleans to React, so we have to convert them to booleans ourselves
    const UNITY_setUserIsPlayingGame = useCallback(
        (state: ReactUnityEventParameter) => {
            let bool: boolean;
            if (typeof state === 'string') {
                bool = state === 'true' ? true : false;
            } else if (typeof state === 'number') {
                bool = state === 1 ? true : false;
            } else bool = false;

            setUNITY_userIsPlayingGame(bool);
        },
        [setUNITY_userIsPlayingGame]
    );

    useEffect(() => {
        userPlayingGameRef.current = UNITY_userIsPlayingGame;
        sessionIDRef.current = UNITY_sessionID;
        userScoreRef.current = UNITY_currentAnte;   //  Uses the ante the player left on as the score
        mostFrequentHandRef.current = UNITY_mostFrequentHand;
    }, [UNITY_currentAnte, UNITY_sessionID, UNITY_userIsPlayingGame, UNITY_mostFrequentHand]);

    const UNITY_setSessionID = useCallback((sessionID: ReactUnityEventParameter) => {
        setUNITY_sessionID(sessionID as string);
    }, []);
    const UNITY_setCurrentAnte = useCallback((score: ReactUnityEventParameter) => {
        setUNITY_currentAnte(score as number);
    }, []);
    const UNITY_setMostFrequentHand = useCallback((mostFrequentHand: ReactUnityEventParameter) => {
        setUNITY_mostFrequentHand(mostFrequentHand as number);
    }, []);

    // Taken from https://react-unity-webgl.dev/docs/api/event-system
    useEffect(() => {
        addEventListener('setUserIsPlayingGame', UNITY_setUserIsPlayingGame);
        addEventListener('setSessionID', UNITY_setSessionID);
        addEventListener('setCurrentAnte', UNITY_setCurrentAnte);
        addEventListener('setMostFrequentHand', UNITY_setMostFrequentHand);
        return () => {
            console.log('Removing event listeners...');
            removeEventListener('setUserIsPlayingGame', UNITY_setUserIsPlayingGame);
            removeEventListener('setSessionID', UNITY_setSessionID);
            removeEventListener('setCurrentAnte', UNITY_setCurrentAnte);
            removeEventListener('setMostFrequentHand', UNITY_setMostFrequentHand);
        };
    }, [addEventListener, removeEventListener, UNITY_setUserIsPlayingGame, UNITY_setSessionID, UNITY_setCurrentAnte, UNITY_setMostFrequentHand]);

    // This runs only ONCE, when the component renders for the first time
    useEffect(() => {
        if (!userLoading && user) {
            setPermission(user?.permissionGroup);
        }
        setDevicePixelRatio(window.devicePixelRatio);
    }, [user, userLoading]);

    // Sometimes the Unity window looks blurry on Retina screens. This fixes that.
    // Taken from https://react-unity-webgl.dev/docs/advanced-examples/dynamic-device-pixel-ratio
    const [devicePixelRatio, setDevicePixelRatio] = useState<number>();

    // Warning Dialog box that pops up when user tries to close the browser/tab
    const openWarningDialog = useCallback(
        (e: BeforeUnloadEvent) => {
            // Only run if the user is currently in the middle of a session
            if (userPlayingGameRef.current || UNITY_userIsPlayingGame) {
                // Get the player's current score, sessionID, and amount of paused time to prepare to end their session automatically
                sendMessage('BackendHook', 'WEBGL_ExtractGameInfo');
            }

            // Ask user to confirm if they want to leave the page
            e.preventDefault();
        },
        [UNITY_userIsPlayingGame, sendMessage]
    );

    const endOngoingSession = useCallback(async () => {
        // Only run it if the user is currently in the middle of a session
        if (sessionIDRef.current || UNITY_sessionID) {
            // Get current time
            console.log('Ending user session...');
            let finalDate = new Date();

            // 0-pad the minutes if it's less than 10 minutes (so it shows up like "09")
            let finalTimeMinutes = finalDate.getMinutes() < 10 ? '0' + finalDate.getMinutes() : finalDate.getMinutes();
            let finalTime = finalDate.getHours() + ':' + finalTimeMinutes;

            // Have to use xhr because Axios's async property fails to do the API call when the browser closes
            let xhr = new XMLHttpRequest();
            //  For actual server use
            xhr.open('POST', '/elleapi/endsession', false);
            //xhr.open('POST', 'https://chdr.cs.ucf.edu/elleapi/endsession', false);
            xhr.setRequestHeader('Authorization', 'Bearer ' + user?.jwt);
            xhr.setRequestHeader('Content-Type', 'application/json');
            let data = JSON.stringify({
                sessionID: sessionIDRef.current || UNITY_sessionID,
                endTime: finalTime,
                playerScore: userScoreRef.current || UNITY_currentAnte
            });
            xhr.send(data);
        }
    }, [UNITY_currentAnte, UNITY_sessionID, user]);

    const sendQuestionInfo = useCallback(async () => {
        // Only run it if the user is currently in the middle of a session
        if (sessionIDRef.current || UNITY_sessionID) {
            // Get current time
            console.log('Sent most frequently played hand after tab close');

            let handID = mostFrequentHandRef.current || UNITY_mostFrequentHand;
            handID = handID + 2114;

            // Have to use xhr because Axios's async property fails to do the API call when the browser closes
            let xhr = new XMLHttpRequest();
            //  For actual server use
            xhr.open('POST', '/elleapi/loggedanswer', false);
            //xhr.open('POST', 'https://chdr.cs.ucf.edu/elleapi/endsession', false);
            xhr.setRequestHeader('Authorization', 'Bearer ' + user?.jwt);
            xhr.setRequestHeader('Content-Type', 'application/json');
            let data = JSON.stringify({
                questionID: userScoreRef.current || UNITY_currentAnte,
                termID: handID,
                sessionID: sessionIDRef.current || UNITY_sessionID,
                correct: 1
            });
            xhr.send(data);
        }
    }, [UNITY_mostFrequentHand, UNITY_currentAnte, UNITY_sessionID, user]);

    const unloadUnityGame = useCallback(async () => {
        await unload();
    }, [unload]);

    useEffect(() => {
        /* Problem: user is in the middle of a Card Game play session and closes the browser. The /session API endpoint was called to start the Session, but
         * the /endsession API endpoint was never called, forever putting that Session in limbo as no end time gets recorded for it.
         *
         * Solution: since the Unity game didn't get to end the session, call the /endsession endpoint using React
         */
        window.addEventListener('beforeunload', openWarningDialog);
        window.addEventListener('unload', sendQuestionInfo);
        window.addEventListener('unload', endOngoingSession);
        // router.events.on('routeChangeStart', handleEarlyNavigation);
        return () => {
            if (isLoaded) {
                sendQuestionInfo();
                endOngoingSession();
                unloadUnityGame();
            }
            window.removeEventListener('beforeunload', openWarningDialog);
            window.addEventListener('unload', sendQuestionInfo);
            window.removeEventListener('unload', endOngoingSession);
            // router.events.off('routeChangeStart', handleEarlyNavigation);
        };
    }, [isLoaded, openWarningDialog, sendQuestionInfo, endOngoingSession, unloadUnityGame]);

    // Automatically log the user into the Unity Card Game
    useEffect(() => {
        if (isLoaded && !userLoading) {
            const jwt = user?.jwt;
            const userID = user?.userID;
            console.log('Sending JWT and userID to Unity Card Game...');
            sendMessage('LoadingText', 'WebGLLoginAttempt', JSON.stringify({ jwt, userID }));
        }
    }, [isLoaded, sendMessage, user?.jwt, user?.userID, userLoading]);

    // Fullscreen button
    const handleOnClickFullscreen = () => {
        requestFullscreen(true);
    };

    const handleChangePixelRatio = useCallback(
        function () {
            // A function which will update the device pixel ratio of the Unity
            // Application to match the device pixel ratio of the browser.
            const updateDevicePixelRatio = function () {
                setDevicePixelRatio(window.devicePixelRatio);
            };
            // A media matcher which watches for changes in the device pixel ratio.
            const mediaMatcher = window.matchMedia(`screen and (resolution: ${devicePixelRatio}dppx)`);
            // Adding an event listener to the media matcher which will update the
            // device pixel ratio of the Unity Application when the device pixel
            // ratio changes.
            mediaMatcher.addEventListener('change', updateDevicePixelRatio);
            return function () {
                // Removing the event listener when the component unmounts.
                mediaMatcher.removeEventListener('change', updateDevicePixelRatio);
            };
        },
        [devicePixelRatio]
    );

    return (
        <div className='gamesBg mainDiv'>
            <div className='center-contents'>
                <div className='webglLoadingStatusBox' style={{ visibility: isLoaded ? 'hidden' : 'visible' }}>
                    <p className='webglLoadingStatusText'>Loading {Math.round(loadingProgression * 100)}%</p>
                </div>

                <Unity
                    unityProvider={unityProvider}
                    devicePixelRatio={devicePixelRatio}
                    style={{
                        width: '1600px',
                        height: '900px',
                        visibility: isLoaded ? 'visible' : 'hidden',
                    }}
                />
                <br />
                <br />
                <Button onClick={handleOnClickFullscreen} style={{ visibility: isLoaded ? 'visible' : 'hidden' }}>
                    Fullscreen
                </Button>
                <br />
                <br />
                <br />
                <div className='center-contents'>
                	<p><u>bELLEtro Video Tutorial</u></p>
                	<iframe
  						width="560"
  						height="315"
  						src="https://www.youtube.com/embed/PQaprWOV1_g?si=jZxR2udcLZlnv3ei"
  						title="YouTube video player"
  						frameBorder="0"
  						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
  						referrerPolicy="strict-origin-when-cross-origin"
					/>
                </div>
            </div>
            <br />
            <br />
        </div>
    );
}

BELLEtro.getLayout = (page: React.JSX.Element) => <GameLayout>{page}</GameLayout>;
