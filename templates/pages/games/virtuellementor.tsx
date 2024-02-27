'use client';
/*************************
Converted from class-based to functional component in Spring 2023.
**************************/

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from 'reactstrap';
import { Unity, useUnityContext } from 'react-unity-webgl';

import '@/public/static/css/style.css';
import '@/lib/font-awesome/css/font-awesome.min.css';
import '@/lib/owlcarousel/assets/owl.carousel.min.css';
import '@/lib/ionicons/css/ionicons.min.css';

import { useRouter } from 'next/router';
import { ReactUnityEventParameter } from 'react-unity-webgl/distribution/types/react-unity-event-parameters';
import Layout from '@/app/layout';
import { useUser } from '@/hooks/useUser';

function VirtuELLEMentor() {
    const { user, loading: userLoading } = useUser();
    const [permission, setPermission] = useState(user?.permissionGroup);
    const router = useRouter();
    // Used to determine when the user is in the middle of a Card Game session (and NOT in any other screen e.g. the main menu)
    const [UNITY_userIsPlayingGame, setUNITY_userIsPlayingGame] = useState(false);
    const [UNITY_sessionID, setUNITY_sessionID] = useState('');
    const [UNITY_playerScore, setUNITY_playerScore] = useState(0);
    const [UNITY_pausedTime, setUNITY_pausedTime] = useState(0); // In-game time spent on pause menu, in seconds

    // Load Unity WebGL game
    const { unityProvider, requestFullscreen, isLoaded, sendMessage, loadingProgression, addEventListener, removeEventListener, unload } =
        useUnityContext({
            // If you change the file paths, you must also change the README in templates/public/Unity-Game-WebGL-Builds!
            loaderUrl: '/games/Card-Game/Build.loader.js',
            dataUrl: '/games/Card-Game/Build.data',
            frameworkUrl: '/games/Card-Game/Build.framework.js',
            codeUrl: '/games/Card-Game/Build.wasm'
        });

    // Event handlers for when Unity sends events to Event
    // Unity doesn't let us send booleans to React, so we have to convert them to booleans ourselves
    const UNITY_setUserIsPlayingGame = useCallback((state: ReactUnityEventParameter) => {
        let bool: boolean;
        if (typeof state === 'string') {
            bool = state === 'true' ? true : false;
        } else if (typeof state === 'number') {
            bool = state === 1 ? true : false;
        } else bool = false;

        setUNITY_userIsPlayingGame(bool);
    }, []);

    const UNITY_setSessionID = useCallback((sessionID: ReactUnityEventParameter) => {
        setUNITY_sessionID(sessionID as string);
    }, []);
    const UNITY_setPlayerScore = useCallback((score: ReactUnityEventParameter) => {
        setUNITY_playerScore(score as number);
    }, []);
    const UNITY_setPausedTime = useCallback((time: ReactUnityEventParameter) => {
        setUNITY_pausedTime(time as number);
    }, []);

    // Prevent user from accidentally clicking on a link and leaving the page while in the middle of a Card Game session
    const handleEarlyNavigation = useCallback(() => {
        // Only run it if the user is currently in the middle of a session
        if (isLoaded) {
            try {
                if (UNITY_userIsPlayingGame) {
                    // Get the player's current score, sessionID, and amount of paused time to prepare to end their session automatically
                    sendMessage('GameManager', 'WEBGL_ExtractGameInfo');
                }

                if (!window.confirm('Are you sure you want to leave?')) {
                    throw Error('User cancelled the navigation.');
                }
            } catch (e: any) {
                // Prevents the navigation from happening
                if (e.message === 'User cancelled the navigation.') return;
                else {
                    console.log(e);
                }
            }
        }
    }, [UNITY_userIsPlayingGame, isLoaded, sendMessage]);

    // Taken from https://react-unity-webgl.dev/docs/api/event-system
    useEffect(() => {
        addEventListener('setUserIsPlayingGame', UNITY_setUserIsPlayingGame);
        addEventListener('setSessionID', UNITY_setSessionID);
        addEventListener('setPlayerScore', UNITY_setPlayerScore);
        addEventListener('setPausedTime', UNITY_setPausedTime);
        router.events.on('routeChangeStart', handleEarlyNavigation);
        return () => {
            removeEventListener('setUserIsPlayingGame', UNITY_setUserIsPlayingGame);
            removeEventListener('setSessionID', UNITY_setSessionID);
            removeEventListener('setPlayerScore', UNITY_setPlayerScore);
            removeEventListener('setPausedTime', UNITY_setPausedTime);
            router.events.off('routeChangeStart', handleEarlyNavigation);
        };
    }, [
        addEventListener,
        removeEventListener,
        UNITY_setUserIsPlayingGame,
        UNITY_setSessionID,
        UNITY_setPlayerScore,
        UNITY_setPausedTime,
        router.events,
        handleEarlyNavigation
    ]);

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

    useEffect(() => {
        // Used to unload the Unity WebGL game (when user leaves the page)
        async function unloadUnityGame() {
            await unload();
        }

        // Warning Dialog box that pops up when user tries to close the browser/tab
        const openWarningDialog = (e: BeforeUnloadEvent) => {
            // Only run if the user is currently in the middle of a session
            if (UNITY_userIsPlayingGame) {
                // Get the player's current score, sessionID, and amount of paused time to prepare to end their session automatically
                sendMessage('GameManager', 'WEBGL_ExtractGameInfo');
            }

            // Ask user to confirm if they want to leave the page
            e.preventDefault();

            /* Debug statements
            console.log("userIsPlayingGame: " + UNITY_userIsPlayingGame.current);
            console.log("sessionID: " + UNITY_sessionID.current);
            console.log("playerScore: " + UNITY_playerScore.current);
            console.log("pausedTime: " + UNITY_pausedTime.current);
            */

            e.returnValue = '';
        };

        /* Problem: user is in the middle of a Card Game play session and closes the browser. The /session API endpoint was called to start the Session, but
         * the /endsession API endpoint was never called, forever putting that Session in limbo as no end time gets recorded for it.
         *
         * Solution: since the Unity game didn't get to end the session, call the /endsession endpoint using React
         */
        const endOngoingSession = () => {
            // Only run it if the user is currently in the middle of a session
            if (UNITY_userIsPlayingGame) {
                // Get current time
                let date = new Date();

                // Subtract in-game paused time
                let pausedTimeMilliSeconds = UNITY_pausedTime * 1000;
                let finalDate = new Date(date.getTime() - pausedTimeMilliSeconds);

                // 0-pad the minutes if it's less than 10 minutes (so it shows up like "09")
                let finalTimeMinutes = finalDate.getMinutes() < 10 ? '0' + finalDate.getMinutes() : finalDate.getMinutes();
                let finalTime = finalDate.getHours() + ':' + finalTimeMinutes;

                /* Debug statements
                console.log("Unity paused time: " + UNITY_pausedTime.current);
                console.log("Unity paused time (in milliseconds): " + pausedTimeMilliSeconds);

                console.log(currentTime + " - " + pausedTimeMilliSeconds + " milliseconds = " + finalTime);
                */

                // Have to use xhr because Axios's async property fails to do the API call when the browser closes
                let xhr = new XMLHttpRequest();
                xhr.open('POST', '/elleapi/endsession', false);
                xhr.setRequestHeader('Authorization', 'Bearer ' + user?.jwt);
                xhr.setRequestHeader('Content-Type', 'application/json');
                let data = JSON.stringify({
                    sessionID: UNITY_sessionID,
                    endTime: finalTime,
                    playerScore: UNITY_playerScore
                });
                xhr.send(data);
            }
        };

        window.addEventListener('beforeunload', openWarningDialog);
        window.addEventListener('unload', endOngoingSession);

        return () => {
            // Only run it AFTER the Unity game has loaded and WHEN the component is being unloaded
            if (isLoaded) {
                // Unload Unity WebGL instance to free memory
                unloadUnityGame();

                // End user's session
                endOngoingSession();
            }

            window.removeEventListener('beforeunload', openWarningDialog);
            window.removeEventListener('unload', endOngoingSession);
        };
    }, [UNITY_pausedTime, UNITY_playerScore, UNITY_sessionID, UNITY_userIsPlayingGame, isLoaded, sendMessage, unload, user?.jwt]);

    // Automatically log the user into the Unity Card Game
    if (isLoaded === true) {
        const jwt = user?.jwt;
        if (jwt) sendMessage('LoadingText', 'WebGLLoginAttempt', jwt);
    }

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
        <Layout requireUser>
            <div className='gamesBg mainDiv'>
                <div className='center-contents'>
                    <div className='webglLoadingStatusBox' style={{ visibility: isLoaded ? 'hidden' : 'visible' }}>
                        <p className='webglLoadingStatusText'>Loading {Math.round(loadingProgression * 100)}%</p>
                    </div>

                    <Unity
                        unityProvider={unityProvider}
                        devicePixelRatio={devicePixelRatio}
                        style={{
                            width: '1152px',
                            height: '648px',
                            visibility: isLoaded ? 'visible' : 'hidden'
                        }}
                    />
                    <br />
                    <br />
                    <Button onClick={handleOnClickFullscreen} style={{ visibility: isLoaded ? 'visible' : 'hidden' }}>
                        Fullscreen
                    </Button>
                </div>
                <br />
                <br />
            </div>
        </Layout>
    );
}

export default VirtuELLEMentor;
