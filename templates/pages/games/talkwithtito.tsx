"use client";
/*************************
Converted from class-based to functional component in Spring 2023.
**************************/

import React, {
    useEffect,
    useState,
    useCallback,
    useContext,
    useRef,
} from "react";
import { Button } from "reactstrap";
import { Unity, useUnityContext } from "react-unity-webgl";

import "@/public/static/css/style.css";
import "@/lib/font-awesome/css/font-awesome.min.css";
import "@/lib/owlcarousel/assets/owl.carousel.min.css";
import "@/lib/ionicons/css/ionicons.min.css";

import { useRouter } from "next/router";
import { ReactUnityEventParameter } from "react-unity-webgl/distribution/types/react-unity-event-parameters";
import Layout from "@/components/Layouts/Layout";
import { useUser } from "@/hooks/useAuth";
import Image from "next/image";

import logo from "@/public/static/images/AnimELLE/logo0309.svg";
import instruct from "@/public/static/images/AnimELLE/instructions.png";
import keys from "@/public/static/images/AnimELLE/keyboard.png";
import cursor from "@/public/static/images/AnimELLE/mouse.svg";
import e from "@/public/static/images/AnimELLE/ekey.svg";
import GameLayout, { GameContext } from "@/components/Layouts/GameLayout";

export default function AnimELLEGame() {
    const { user, loading: userLoading } = useUser();
    const [permission, setPermission] = useState(user?.permissionGroup);
    const router = useRouter();
    // Used to determine when the user is in the middle of a Card Game session (and NOT in any other screen e.g. the main menu)
    const { UNITY_userIsPlayingGame, setUNITY_userIsPlayingGame } =
        useContext(GameContext);
    const userPlayingGameRef = useRef(UNITY_userIsPlayingGame);
    const [UNITY_sessionID, setUNITY_sessionID] = useState("");
    const sessionIDRef = useRef(UNITY_sessionID);
    const [UNITY_playerScore, setUNITY_playerScore] = useState(0);
    const userScoreRef = useRef(UNITY_playerScore);

    // Load Unity WebGL game
    const {
        unityProvider,
        requestFullscreen,
        isLoaded,
        sendMessage,
        loadingProgression,
        addEventListener,
        removeEventListener,
        unload,
    } = useUnityContext({
        // If you change the file paths, you must also change the README in templates/public/Unity-Game-WebGL-Builds!
        loaderUrl: "/elle/games/AnimELLE-Crossing/Build.loader.js",
        dataUrl: "/elle/games/AnimELLE-Crossing/Build.data",
        frameworkUrl: "/elle/games/AnimELLE-Crossing/Build.framework.js",
        codeUrl: "/elle/games/AnimELLE-Crossing/Build.wasm",
    });

    // Event handlers for when Unity sends events to Event
    // Unity doesn't let us send booleans to React, so we have to convert them to booleans ourselves
    const UNITY_setUserIsPlayingGame = useCallback(
        (state: ReactUnityEventParameter) => {
            let bool: boolean;
            if (typeof state === "string") {
                bool = state === "true" ? true : false;
            } else if (typeof state === "number") {
                bool = state === 1 ? true : false;
            } else bool = false;

            setUNITY_userIsPlayingGame(bool);
        },
        [setUNITY_userIsPlayingGame]
    );

    useEffect(() => {
        userPlayingGameRef.current = UNITY_userIsPlayingGame;
        sessionIDRef.current = UNITY_sessionID;
        userScoreRef.current = UNITY_playerScore;
    }, [UNITY_playerScore, UNITY_sessionID, UNITY_userIsPlayingGame]);

    const UNITY_setSessionID = useCallback(
        (sessionID: ReactUnityEventParameter) => {
            setUNITY_sessionID(sessionID as string);
        },
        []
    );
    const UNITY_setPlayerScore = useCallback(
        (score: ReactUnityEventParameter) => {
            setUNITY_playerScore(score as number);
        },
        []
    );

    // Taken from https://react-unity-webgl.dev/docs/api/event-system
    useEffect(() => {
        addEventListener("setUserIsPlayingGame", UNITY_setUserIsPlayingGame);
        addEventListener("setSessionID", UNITY_setSessionID);
        addEventListener("setPlayerScore", UNITY_setPlayerScore);
        return () => {
            removeEventListener(
                "setUserIsPlayingGame",
                UNITY_setUserIsPlayingGame
            );
            removeEventListener("setSessionID", UNITY_setSessionID);
            removeEventListener("setPlayerScore", UNITY_setPlayerScore);
        };
    }, [
        addEventListener,
        removeEventListener,
        UNITY_setUserIsPlayingGame,
        UNITY_setSessionID,
        UNITY_setPlayerScore,
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

    // Warning Dialog box that pops up when user tries to close the browser/tab
    const openWarningDialog = useCallback(
        (e: BeforeUnloadEvent) => {
            // Only run if the user is currently in the middle of a session
            if (UNITY_userIsPlayingGame) {
                // Get the player's current score, sessionID, and amount of paused time to prepare to end their session automatically
                sendMessage("GameManager", "LeavingPageEvents");
            }

            e.preventDefault();
        },
        [UNITY_userIsPlayingGame, sendMessage]
    );

    const endOngoingSession = useCallback(async () => {
        // Only run it if the user is currently in the middle of a session
        if (sessionIDRef.current || UNITY_sessionID) {
            // Have to use xhr because Axios's async property fails to do the API call when the browser closes
            let xhr = new XMLHttpRequest();
            xhr.open("POST", "/elleapi/endsession", false);
            xhr.setRequestHeader("Authorization", "Bearer " + user?.jwt);
            xhr.setRequestHeader("Content-Type", "application/json");
            let data = JSON.stringify({
                sessionID: sessionIDRef.current || UNITY_sessionID,
                playerScore: userScoreRef.current || UNITY_playerScore,
            });
            xhr.send(data);
        }
    }, [UNITY_playerScore, UNITY_sessionID, user?.jwt]);

    async function unloadUnityGame() {
        await unload();
    }

    useEffect(() => {
        /* Problem: user is in the middle of a Card Game play session and closes the browser. The /session API endpoint was called to start the Session, but
         * the /endsession API endpoint was never called, forever putting that Session in limbo as no end time gets recorded for it.
         *
         * Solution: since the Unity game didn't get to end the session, call the /endsession endpoint using React
         */
        window.addEventListener("beforeunload", openWarningDialog);
        window.addEventListener("unload", endOngoingSession);
        // router.events.on('routeChangeStart', handleEarlyNavigation);
        return () => {
            if (isLoaded) {
                endOngoingSession();
                unloadUnityGame();
            }
            window.removeEventListener("beforeunload", openWarningDialog);
            window.removeEventListener("unload", endOngoingSession);
            // router.events.off('routeChangeStart', handleEarlyNavigation);
        };
    }, [isLoaded]);

    // Automatically log the user into ACWW
    useEffect(() => {
        if (isLoaded && !userLoading) {
            const jwt = user?.jwt;
            if (jwt) sendMessage("GameManager", "loginAttempt", jwt);

            const isChrome = /Chrome/i.test(navigator.userAgent);
            console.log("chrome?" + isChrome);
            const isAndroid = /Android/i.test(navigator.userAgent);
            console.log("android?" + isAndroid);
            //alert("dis android: " + isAndroid);
            const isIOS = /iPhone/i.test(navigator.userAgent);
            console.log("iOS?" + isIOS);
            //alert("dis IOS: " + isIOS);

            if (isAndroid || isIOS) {
                sendMessage("GameManager", "MobileCheck", 1);
            }
        }
    }, [isLoaded, userLoading, user?.jwt, sendMessage]);

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
            const mediaMatcher = window.matchMedia(
                `screen and (resolution: ${devicePixelRatio}dppx)`
            );
            // Adding an event listener to the media matcher which will update the
            // device pixel ratio of the Unity Application when the device pixel
            // ratio changes.
            mediaMatcher.addEventListener("change", updateDevicePixelRatio);
            return function () {
                // Removing the event listener when the component unmounts.
                mediaMatcher.removeEventListener(
                    "change",
                    updateDevicePixelRatio
                );
            };
        },
        [devicePixelRatio]
    );

    return (
        <div className="animelle-game-container">
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <div className="center-contents">
                <div
                    className="webglLoadingStatusBox"
                    style={{ visibility: isLoaded ? "hidden" : "visible" }}
                >
                    <p className="webglLoadingStatusText">
                        Loading {Math.round(loadingProgression * 100)}%
                    </p>
                </div>
                <div className="gameContainer">
                    <Unity
                        unityProvider={unityProvider}
                        devicePixelRatio={devicePixelRatio}
                        style={{
                            width: "90%",
                            height: "90%",
                            visibility: isLoaded ? "visible" : "hidden",
                        }}
                    />
                    <Button
                        className="fsbtn"
                        onClick={handleOnClickFullscreen}
                        style={{
                            visibility: isLoaded ? "visible" : "hidden",
                        }}
                    >
                        Fullscreen
                    </Button>
                </div>
            </div>
            <div className="divContainer">
                <div className="logoContainer">
                    <div className="imgContainer">
                        <Image src={logo} className="logo" alt="game logo" />
                        <h3 className="credits">Credits:</h3>
                    </div>
                    <div className="row">
                        <div className="column">
                            <p className="names">Tam Nguyen </p>
                            <p className="names">Justin Reeves</p>
                            <p className="names">Natali Siam-Pollo</p>
                        </div>
                        <div className="column">
                            <p className="names">Michael Alfieri</p>
                            <p className="names">Connor Price</p>
                        </div>
                    </div>{" "}
                    {/*<!--row--> */}
                    <div className="row">
                        <div className="column">
                            <p className="names">Derek Dyer</p>
                            <p className="names">Trevor Larson</p>
                        </div>
                        <div className="column">
                            <p className="names">Robert Bereiter</p>
                            <p className="names">Arwin Nimityongskul</p>
                        </div>
                    </div>{" "}
                    <div className="row">
                        <div>
                            <Image
                                src={instruct}
                                className="instruct"
                                alt="game logo"
                            />
                            <Image src={keys} className="keys" alt="keys" />
                            <div className="keyContainer">
                                <p className="instructions">
                                    Moving the Player (arrow keys work too!)
                                </p>
                            </div>
                            <Image src={cursor} className="keys" alt="keys" />
                            <div className="keyContainer">
                                <p className="instructions">
                                    Hovering Tooltips, Button Selection
                                </p>
                            </div>
                            <Image src={e} className="keys" alt="keys" />
                            <div className="keyContainer">
                                <p className="instructions">
                                    For interacting with objects/NPCs with Emotes,
                                    Continue Dialogue
                                </p>
                            </div>
                        </div>
                    </div>
                    {/*<!--row--> */}
                </div>{" "}
                {/*<!--logo--> */}
            </div>{" "}
            {/*<!--divContainer--> */}
        </div>

    );
}

AnimELLEGame.getLayout = (page: React.JSX.Element) => (
    <GameLayout>{page}</GameLayout>
);