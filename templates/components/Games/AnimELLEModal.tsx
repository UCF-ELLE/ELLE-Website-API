import React, {
    useEffect,
    useState,
    useCallback,
    useContext,
    useRef,
} from "react";
import {
    Button, Modal,
    ModalBody,
    ModalHeader
} from "reactstrap"

import { Unity, useUnityContext } from "react-unity-webgl";

import "@/public/static/css/style.css";
import "@/lib/font-awesome/css/font-awesome.min.css";
import "@/lib/owlcarousel/assets/owl.carousel.min.css";
import "@/lib/ionicons/css/ionicons.min.css";

import { ReactUnityEventParameter } from "react-unity-webgl/distribution/types/react-unity-event-parameters";
import { useUser } from "@/hooks/useAuth";

import { GameContext } from "@/components/Layouts/GameLayout";
import { relative } from "path";

function AnimELLEModal(props: {}) {
    const [mainModal, setMainModal] = React.useState(false);
    const [exitModal, setExitModal] = React.useState(false);

    const mainToggle = () => setMainModal(!mainModal);
    const exitToggle = () => setExitModal(!exitModal);
    const allToggle = () => {
        setExitModal(!exitModal);
        setMainModal(!mainModal);
    }

    const { user, loading: userLoading } = useUser();
    const [permission, setPermission] = useState(user?.permissionGroup);
    // Used to determine when the user is in the middle of a Card Game session (and NOT in any other screen e.g. the main menu)
    const { UNITY_userIsPlayingGame, setUNITY_userIsPlayingGame } =
        useContext(GameContext);
    const userPlayingGameRef = useRef(UNITY_userIsPlayingGame);
    const [UNITY_sessionID, setUNITY_sessionID] = useState("");
    const sessionIDRef = useRef(UNITY_sessionID);
    const [UNITY_playerScore, setUNITY_playerScore] = useState(0);
    const userScoreRef = useRef(UNITY_playerScore);
    const [unmountFlag, setUnmountFlag] = useState<boolean>(false);

    // Load Unity WebGL game
    const {
        unityProvider,
        isLoaded,
        sendMessage,
        loadingProgression,
        UNSAFE__unityInstance,
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

    async function detachGame() {
        if (UNITY_userIsPlayingGame) {
            // Get the player's current score, sessionID, and amount of paused time to prepare to end their session automatically
            sendMessage("GameManager", "LeavingPageEvents");
        }

        await UNSAFE__unityInstance?.Quit();

        setUnmountFlag(true);
    }

    function openHandler() {
        console.log(window.innerHeight);

        setUnmountFlag(false);
    }

    return (
        <div style={{
            display: 'block', width: 700, padding: 30
        }}>
            <Button style={{ textAlign: "center", backgroundColor: "#e7cfa5", color: "#a87935", borderColor: "#ad795a" }} size="lg"
                onClick={mainToggle}>Click Here to Play!</Button>
            <Modal isOpen={mainModal}
                toggle={mainToggle}
                modalTransition={{ timeout: 2000 }}
                fullscreen={true}
                zIndex={1050}
                scrollable={false}
                centered={false}
                style={{
                    height: '100vh', // Full height of the viewport
                    width: '100vw',  // Full width of the viewport
                    padding: 0,      // Remove any padding
                    top: 0,          // Ensure it starts at the top of the screen
                    left: 0,         // Ensure it starts at the left of the screen
                    margin: 0,        // No margin to avoid any default spacing
                }}
                onClosed={detachGame}
                onOpened={openHandler}
                unmountOnClose={unmountFlag}
            >
                <ModalHeader style={{ background: 'transparent', border: 'none', padding: '2vh 1vw', position: 'absolute', zIndex: 1050 }}>
                    <Button style={{ textAlign: "center", backgroundColor: "#e7cfa5", color: "#a87935", borderColor: "#ad795a" }} size="sm" onClick={exitToggle}>Close Game</Button>
                </ModalHeader>
                <ModalBody className="flex" style={{
                    padding: 0,      // Remove padding
                    margin: 0,       // Remove margin
                }}>
                    <Unity
                        unityProvider={unityProvider}
                        devicePixelRatio={devicePixelRatio}
                        style={{
                            height: '100%',  // Fill the entire modal body
                            width: '100%',   // Fill the entire modal body
                            position: 'relative', // Ensure it stays in the correct position
                            top: 0,          // Align to the top of the modal body
                            display: isLoaded ? 'block' : 'none', // Only display when loaded
                        }}
                    />
                    <div
                        className="webglLoadingStatusBox"
                        style={{ display: isLoaded ? "none" : "block" }}
                    >
                        <p className="webglLoadingStatusText">
                            Loading {Math.round(loadingProgression * 100)}%
                        </p>
                    </div>
                </ModalBody>
                <Modal isOpen={exitModal}
                    toggle={exitToggle}
                    modalTransition={{ timeout: 2000 }}
                    scrollable={false}
                    centered={true}
                >
                    <ModalHeader className="fs-4" style={{ backgroundColor: "#e7cfa5", color: "#a87935", borderColor: "#ad795a", borderStyle: "solid" }}>
                        Are you sure you&apos;d like to exit?
                    </ModalHeader>
                    <ModalBody className="rounded-bottom" style={{ backgroundColor: "#e7cfa5", color: "#a87935", borderColor: "#ad795a", borderStyle: "solid" }}>
                        <Button className="rounded shadow fs-5 border-2" style={{ backgroundColor: "#e7cfa5", color: "#a87935", borderColor: "#ad795a" }} onClick={allToggle}>Confirm</Button>
                        <Button className="rounded shadow ms-1 fs-5 border-2" style={{ backgroundColor: "#e7cfa5", color: "#a87935", borderColor: "#ad795a" }} onClick={exitToggle}>Cancel</Button>
                    </ModalBody>
                </Modal>
            </Modal>
        </div >
    );
}

export default AnimELLEModal;