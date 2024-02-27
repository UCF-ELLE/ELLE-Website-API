/*************************
Converted from class-based to functional component in Spring 2023.
**************************/

import React from 'react';
import { Button } from 'reactstrap';
import { Unity, useUnityContext } from 'react-unity-webgl';

import '@/lib/font-awesome/css/font-awesome.min.css';
import '@/lib/owlcarousel/assets/owl.carousel.min.css';
import '@/lib/ionicons/css/ionicons.min.css';
import Layout from '@/app/layout';
import { useUser } from '@/hooks/useUser';

function MazeGame() {
    const { user } = useUser();

    const { unityProvider, requestFullscreen, isLoaded, sendMessage, loadingProgression } = useUnityContext({
        // If you change the file paths, you must also change the README in templates/public/Unity-Game-WebGL-Builds!
        loaderUrl: '/games/Maze-Game/Build.loader.js',
        dataUrl: '/games/Maze-Game/Build.data',
        frameworkUrl: '/games/Maze-Game/Build.framework.js',
        codeUrl: '/games/Maze-Game/Build.wasm'
    });

    // Automatically log the user into the Unity Maze Game
    if (isLoaded === true) {
        const jwt = user?.jwt;
        if (jwt) sendMessage('ContinueButton', 'loginAttempt', jwt);
    }

    const handleOnClickFullscreen = () => {
        requestFullscreen(true);
    };

    return (
        <Layout requireUser>
            <div className='downloadsBg mainDiv'>
                <div className='center-contents'>
                    <div className='webglLoadingStatusBox' style={{ visibility: isLoaded ? 'hidden' : 'visible' }}>
                        <p className='webglLoadingStatusText'>Loading {Math.round(loadingProgression * 100)}%</p>
                    </div>

                    <Unity
                        unityProvider={unityProvider}
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
                <p className='mazeGame' style={{ color: 'black' }}>
                    If there are no available modules for you to select, try logging out and logging back in.
                </p>
                <br />
            </div>
        </Layout>
    );
}

export default MazeGame;
