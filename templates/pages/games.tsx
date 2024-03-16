import React, { useMemo } from 'react';
import { Row, Col } from 'reactstrap';
import Select, { SingleValue } from 'react-select';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/app/layout';

import CardGameImage from '@/public/static/images/cardgame.png';
import AnimelleGameImage from '@/public/static/images/animellegame.png';
import MazeGameImage from '@/public/static/images/mazeGameplay.png';
import HellesKitchenImage from '@/public/static/images/helleskitchen.jpg';
import SpinNSpellImage from '@/public/static/images/spinnspellBlocks.png';
import HighRiseImage from '@/public/static/images/highrise.jpg';
import MillenIElleImage from '@/public/static/images/milleniimage.png';

import GameSectionJSON from '@/public/static/json/gameSections.json';

import '@/public/static/css/style.css';
import '@/lib/font-awesome/css/font-awesome.min.css';
import '@/lib/owlcarousel/assets/owl.carousel.min.css';
import '@/lib/ionicons/css/ionicons.min.css';
import { useUser } from '@/hooks/useUser';
import GameSection from '@/components/Games/GameSection';

type GameOption = {
    value: string;
    label: string;
};

export default function Games() {
    const handleGameChange = (selectedOption: SingleValue<GameOption>) => {
        if (!selectedOption) return;
        const value = selectedOption.value;
        const element = document.getElementById(value);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const anchorToImage = (anchor: string) => {
        switch (anchor) {
            case 'VirtuELLEMentor':
                return CardGameImage;
            case 'AnimELLE':
                return AnimelleGameImage;
            case 'Maze':
                return MazeGameImage;
            case 'HELLEsKitchen':
                return HellesKitchenImage;
            case 'SpinNSpELLE':
                return SpinNSpellImage;
            case 'HighriseHELLEp':
                return HighRiseImage;
            case 'Millenielle':
                return MillenIElleImage;
            default:
                return CardGameImage;
        }
    };

    // Modify the JSON to add more games. The JSON is located at public/static/json/gameSections.json
    const GameSectionProps = useMemo(() => {
        return GameSectionJSON.map((game, idx) => {
            return {
                ...game,
                color: idx % 2 === 0 ? '#3f6184' : '#5da8af',
                buttonColor: idx % 2 === 0 ? '#5da8af' : '#3f6184',
                image: anchorToImage(game.anchor)
            };
        });
    }, []);

    const options = useMemo(() => GameSectionProps.map((game) => ({ value: game.anchor, label: game.title })), [GameSectionProps]);

    return (
        <Layout>
            <div className='gamesBg'>
                <a id='top'></a>

                {/* Create the game selection dropdown menu */}
                <br />
                <Select className='dropdown button' options={options} onChange={(e) => handleGameChange(e)} placeholder='Select a Game' />

                {GameSectionProps.map((game, idx) => (
                    <GameSection key={game.anchor} {...game} />
                ))}
            </div>
        </Layout>
    );
}
