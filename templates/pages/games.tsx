import React from 'react';
import { Row, Col } from 'reactstrap';
import Select, { SingleValue } from 'react-select';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/app/layout';

import elleVR from '@/public/static/videos/ELLEVR.mp4';
import CardGameImage from '@/public/static/images/cardgame.png';
import AnimelleGameImage from '@/public/static/images/animellegame.png';
import MazeGameImage from '@/public/static/images/mazeGameplay.png';
import HellesKitchenImage from '@/public/static/images/helleskitchen.jpg';
import SpinNSpellImage from '@/public/static/images/spinnspellBlocks.png';
import HighRiseImage from '@/public/static/images/highrise.jpg';
import MillenIElleImage from '@/public/static/images/milleniimage.png';

import '@/public/static/css/style.css';
import '@/lib/font-awesome/css/font-awesome.min.css';
import '@/lib/owlcarousel/assets/owl.carousel.min.css';
import '@/lib/ionicons/css/ionicons.min.css';
import { useUser } from '@/hooks/useUser';

type GameOption = {
    value: string;
    label: string;
};

export default function Games() {
    const { user } = useUser();

    const handleGameChange = (selectedOption: SingleValue<GameOption>) => {
        if (!selectedOption) return;
        const value = selectedOption.value;
        const element = document.getElementById(value);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const options = [
        { value: 'VirtuELLEMentor', label: 'VirtuELLE Mentor' },
        { value: 'AnimELLE', label: 'AnimELLE Crossing' },
        { value: 'Maze', label: 'Maze Game' },
        { value: 'HELLEsKitchen', label: 'HELLEs Kitchen' },
        { value: 'SpinNSpELLE', label: 'Spin N SpELLE' },
        { value: 'HighriseHELLEp', label: 'HighRise HELLEp' },
        { value: 'Millenielle', label: 'Milleni Elle' }

        // add more games as needed
    ];

    return (
        <Layout>
            <div className='gamesBg'>
                <a id='top'></a>

                {/* Create the game selection dropdown menu */}
                <br />
                <Select className='dropdown button' options={options} onChange={(e) => handleGameChange(e)} placeholder='Select a Game' />

                <a id='VirtuELLEMentor'></a>
                <section style={{ color: 'white' }}>
                    <div className='container'>
                        <div className='infoCard' style={{ backgroundColor: '#3f6184' }}>
                            <Row>
                                <Col>
                                    <h3 className='cta-title'>VirtuELLE Mentor</h3>
                                    <p className='cta-text'>Original Senior Design Team:</p>
                                    <ul style={{ color: '#ffffff' }}>
                                        <Row>
                                            <Col>
                                                <li>Noah Corlew</li>
                                                <li>Kalvin Miller</li>
                                                <li>Michael Santiago</li>
                                            </Col>
                                        </Row>
                                    </ul>

                                    <p className='cta-text'>Version 2 Senior Design Team:</p>
                                    <ul style={{ color: '#ffffff' }}>
                                        <Row>
                                            <Col>
                                                <li>Annabel Bland</li>
                                                <li>Tyler Morejon</li>
                                                <li>Nathan Otis</li>
                                            </Col>
                                            <Col>
                                                <li>Daniel Rodriguez</li>
                                                <li>Tanner Williams</li>
                                            </Col>
                                        </Row>
                                    </ul>
                                    <p className='cta-text'>Version 3 Senior Design Team</p>
                                    <ul style={{ color: '#ffffff' }}>
                                        <Row>
                                            <Col>
                                                <li>Nathan Lim</li>
                                                <li>Justin Moy</li>
                                                <li>Connor Lysek</li>
                                            </Col>
                                            <Col>
                                                <li>Skylar Marosi</li>
                                                <li>Keilvin Tran</li>
                                            </Col>
                                        </Row>
                                    </ul>
                                    <br />
                                    <p className='cta-text'>
                                        {' '}
                                        Come learn a language, select your own mentor, and play to unlock unique prizes and customization!{' '}
                                    </p>
                                    <p className='cta-text'>
                                        <Link
                                            href={user?.jwt ? '/games/virtuellementor' : '/login'}
                                            className={`cardGameButton ${!user?.jwt ? 'disabled' : ''}`}
                                        >
                                            {user?.jwt ? 'Play Here!' : 'Log In to Play'}
                                        </Link>
                                    </p>
                                </Col>
                                <Col>
                                    <Image
                                        style={{
                                            width: 'auto',
                                            height: '280px',
                                            marginLeft: '70px',
                                            marginTop: '80px'
                                        }}
                                        alt='Card Game Image'
                                        src={CardGameImage}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </div>
                </section>

                <a id='AnimELLE'></a>
                <section style={{ color: 'white' }}>
                    <div className='container'>
                        <div className='infoCard' style={{ backgroundColor: '#5da8af' }}>
                            <Row>
                                <Col>
                                    <h3 className='cta-title'>AnimELLE Crossing</h3>
                                    <p className='cta-text'>Senior Design Team:</p>
                                    <ul style={{ color: '#ffffff' }}>
                                        <Row>
                                            <Col>
                                                <li>Natali Siam-Pollo</li>
                                                <li>Trevor Larson</li>
                                                <li>Justin Reeves</li>
                                            </Col>
                                            <Col>
                                                <li>Derek Dyer</li>
                                                <li>Tam Nguyen</li>
                                            </Col>
                                        </Row>
                                    </ul>
                                    <p className='cta-text'>
                                        AnimELLE Crossing is an educational game with the intent to help students with their language learning
                                        journey. Students will get to play multiple mini games that are encompassed within the AnimELLE Crossing
                                        world, interact with non-playable characters, and personalize different aspects of their gameplay.
                                    </p>
                                    <p className='cta-text'>
                                        <Link href={user ? '/games/animellegame' : '/login'} className={`animelleButton ${!user ? 'disabled' : ''}`}>
                                            {user ? 'Play Here!' : 'Log In to Play'}
                                        </Link>
                                    </p>
                                </Col>
                                <Col>
                                    <Image
                                        style={{
                                            width: '520px',
                                            height: '320px',
                                            marginLeft: '70px',
                                            marginTop: '40px'
                                        }}
                                        alt='AnimELLE Crossing Image'
                                        src={AnimelleGameImage}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </div>
                </section>

                <a id='Maze'></a>
                <section style={{ color: 'white' }}>
                    <div className='container'>
                        <div className='infoCard' style={{ backgroundColor: '#3f6184' }}>
                            <Row>
                                <Col>
                                    <h3 className='cta-title'>ELLE aMAZEing Game</h3>
                                    <p className='cta-text'>Senior Design Team:</p>
                                    <ul style={{ color: '#ffffff' }}>
                                        <Row>
                                            <Col>
                                                <li>Annabel Bland</li>
                                                <li>Tyler Morejon</li>
                                                <li>Nathan Otis</li>
                                            </Col>
                                            <Col>
                                                <li>Daniel Rodriguez</li>
                                                <li>Tanner Williams</li>
                                            </Col>
                                        </Row>
                                    </ul>
                                    <br />
                                    Follow the instructions to choose the correct path from a few options while learning Spanish in this immersive
                                    game!
                                    <p className='cta-text'>
                                        <br />
                                        <Link href={user ? '/games/mazegame' : '/login'} className={`mazeButton ${!user ? 'disabled' : ''}`}>
                                            {user ? 'Play Here!' : 'Log In to Play'}
                                        </Link>
                                    </p>
                                </Col>
                                <Col>
                                    <Image
                                        style={{
                                            width: '520px',
                                            height: '320px',
                                            marginLeft: '70px'
                                        }}
                                        alt='Maze Game Image'
                                        src={MazeGameImage}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </div>
                </section>

                <a id='HELLEsKitchen'></a>
                <section style={{ color: 'white' }}>
                    <div className='container'>
                        <div className='infoCard' style={{ backgroundColor: '#5da8af' }}>
                            <Row>
                                <Col>
                                    <h3 className='cta-title'>HELLE&apos;s Kitchen</h3>
                                    <p className='cta-text'>Senior Design Team:</p>
                                    <ul style={{ color: '#ffffff' }}>
                                        <Row>
                                            <Col>
                                                <li>Allexis Knight</li>
                                                <li>Arianna Walters</li>
                                                <li>Dylan Quigley</li>
                                            </Col>
                                            <Col>
                                                <li>Edgard Irineo</li>
                                                <li>Manatsa Chiomadzi</li>
                                            </Col>
                                        </Row>
                                    </ul>
                                    <br />
                                    Follow recipes in Spanish to search the kitchen for ingredients. Cook them up to discover the dish of the unit!
                                    <p className='cta-text'>
                                        <br />
                                        <a className='helleButton' href='https://ucfgrl.itch.io/elle-the-endless-learner-ellements-of-learning'>
                                            Available Here!
                                        </a>
                                    </p>
                                </Col>
                                <Col>
                                    <br />
                                    <Image
                                        style={{
                                            width: '514px',
                                            height: '289px',
                                            marginLeft: '100px'
                                        }}
                                        alt="HELLE's Kitchen Image"
                                        src={HellesKitchenImage}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </div>
                </section>

                <a id='SpinNSpELLE'></a>
                <section style={{ color: 'white' }}>
                    <div className='container'>
                        <div className='infoCard' style={{ backgroundColor: '#3f6184' }}>
                            <Row>
                                <Col>
                                    <h3 className='cta-title'>Spin N SpELLE</h3>
                                    <p className='cta-text'>Senior Design Team:</p>
                                    <ul style={{ color: '#ffffff' }}>
                                        <Row>
                                            <Col>
                                                <li>Kaarthik Alagappan</li>
                                                <li>Jonathan Jules</li>
                                                <li>Tiffany Lin</li>
                                            </Col>
                                            <Col>
                                                <li>Catalina Morales</li>
                                                <li>Samuel Tungol</li>
                                            </Col>
                                        </Row>
                                    </ul>
                                    <br />
                                    Spell out the translation of terms using alphabet blocks. Play in endless mode or try your luck at quiz mode!
                                    <p className='cta-text'>
                                        <br />
                                        <a className='spinButton' href='https://ucfgrl.itch.io/elle-the-endless-learner-ellements-of-learning'>
                                            Available Here!
                                        </a>
                                    </p>
                                </Col>
                                <Col>
                                    <Image
                                        style={{
                                            width: '350px',
                                            height: '255px',
                                            marginLeft: '100px'
                                        }}
                                        alt='Spin N SpELLE Image'
                                        src={SpinNSpellImage}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </div>
                </section>

                <a id='HighriseHELLEp'></a>
                <section style={{ color: 'white' }}>
                    <div className='container'>
                        <div className='infoCard' style={{ backgroundColor: '#5da8af' }}>
                            <Row>
                                <Col>
                                    <h3 className='cta-title'>Highrise HELLEp</h3>
                                    <p className='cta-text'>Senior Design Team:</p>
                                    <ul style={{ color: '#ffffff' }}>
                                        <Row>
                                            <Col>
                                                <li>Kaarthik Alagappan</li>
                                                <li>Jonathan Jules</li>
                                                <li>Tiffany Lin</li>
                                            </Col>
                                            <Col>
                                                <li>Catalina Morales</li>
                                                <li>Samuel Tungol</li>
                                            </Col>
                                        </Row>
                                    </ul>
                                    <br />
                                    Play as a firefighter in this action packed game. Connect terms to their correct categories to put out fires and
                                    save the day!
                                    <p className='cta-text'>
                                        <br />
                                        <a className='highriseButton' href='https://ucfgrl.itch.io/elle-the-endless-learner-ellements-of-learning'>
                                            Available Here!
                                        </a>
                                    </p>
                                </Col>
                                <Col>
                                    <Image
                                        style={{
                                            width: '470px',
                                            height: '255px',
                                            marginLeft: '100px'
                                        }}
                                        alt='Highrise HELLEp Image'
                                        src={HighRiseImage}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </div>
                </section>

                <a id='Millenielle'></a>
                <section style={{ color: 'white' }}>
                    <div className='container'>
                        <div className='infoCard' style={{ backgroundColor: '#3f6184' }}>
                            <Row>
                                <Col>
                                    <h3 className='cta-title'>MilleniElle</h3>
                                    <p className='cta-text'>Senior Design Team:</p>
                                    <ul style={{ color: '#ffffff' }}>
                                        <Row>
                                            <Col>
                                                <li>Allexis Knight</li>
                                                <li>Arianna Walters</li>
                                                <li>Dylan Quigley</li>
                                            </Col>
                                            <Col>
                                                <li>Edgard Irineo</li>
                                                <li>Manatsa Chiomadzi</li>
                                            </Col>
                                        </Row>
                                    </ul>
                                    <br />
                                    Milleni-ELLE is a Spanish language game emphasizing context and immersion. The player arrives in an airport
                                    (tutorial scene) where they learn the basic mechanics of the game and board a virtual bus. The bus will take them
                                    to a house to pack for their next trip or to the grocery store to practice food-based vocabulary.
                                    <p className='cta-text'>
                                        <br />
                                        <a className='milleniButton' href='https://ucfgrl.itch.io/elle-the-endless-learner-ellements-of-learning'>
                                            Available Here!
                                        </a>
                                    </p>
                                </Col>
                                <Col>
                                    <Image
                                        style={{
                                            width: '470px',
                                            height: '255px',
                                            marginLeft: '100px',
                                            marginTop: '60px'
                                        }}
                                        alt='MilleniElle Image'
                                        src={MillenIElleImage}
                                    />
                                </Col>
                            </Row>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}
