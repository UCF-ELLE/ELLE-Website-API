import { Dispatch, SetStateAction, createContext, useEffect, useState } from 'react';
import { Blocker } from '../Navigation/NavigationBlock';
import Layout from './Layout';

export const GameContext = createContext<{ UNITY_userIsPlayingGame: boolean; setUNITY_userIsPlayingGame: Dispatch<SetStateAction<boolean>> }>({
    UNITY_userIsPlayingGame: false,
    setUNITY_userIsPlayingGame: () => {}
});

export default function GameLayout({ children }: { children: React.ReactNode }) {
    const [UNITY_userIsPlayingGame, setUNITY_userIsPlayingGame] = useState(false);

    useEffect(() => {
        console.log('LAYOUT', UNITY_userIsPlayingGame);
    }, [UNITY_userIsPlayingGame]);

    return (
        <Layout requireUser>
            <GameContext.Provider value={{ UNITY_userIsPlayingGame, setUNITY_userIsPlayingGame }}>
                {children}
                {UNITY_userIsPlayingGame ? <Blocker /> : null}
            </GameContext.Provider>
        </Layout>
    );
}
