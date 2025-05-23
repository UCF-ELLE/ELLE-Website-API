"use client";
/*************************
Converted from class-based to functional component in Spring 2023.
**************************/

import React, {
    useEffect,
    useState,
} from "react";
import "@/public/static/css/style.css";
import "@/lib/font-awesome/css/font-awesome.min.css";
import "@/lib/owlcarousel/assets/owl.carousel.min.css";
import "@/lib/ionicons/css/ionicons.min.css";

import Image from "next/image";

import logo from "@/public/static/images/AnimELLE/logo0309.svg";
import instruct from "@/public/static/images/AnimELLE/instructions.png";
import keys from "@/public/static/images/AnimELLE/keyboard.png";
import cursor from "@/public/static/images/AnimELLE/mouse.svg";
import e from "@/public/static/images/AnimELLE/ekey.svg";
import GameLayout, { GameContext } from "@/components/Layouts/GameLayout";

import AnimELLEModal from "@/components/Games/AnimELLEModal";

export default function AnimELLEGame() {
    // Used to determine when the user is in the middle of a Card Game session (and NOT in any other screen e.g. the main menu)
    const [creditsVisibility, setCreditsVisibility] = useState(true);

    // Upon opening the page, scroll to the top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [])

    return (
        <>
            <div className="animelle-game-container">
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <div className="center-contents">
                    <div className="gameContainer">
                        <AnimELLEModal></AnimELLEModal>
                    </div>
                </div>
                {creditsVisibility && (<div id="creditsContainer" className="divContainer">
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
                        <br/>
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
                        <br/>
                        <div className="row">
                            <div className="column">
                                <p className="names">Ashton Williams</p>
                                <p className="names">Dylan Benson</p>
                                <p className="names">Anna MacInnis</p>
                                <p className="names">Zachary Kappitt</p>
                            </div>
                            <div className="column">
                                <p className="names">Reef Holdinga</p>
                                <p className="names">Muhadeseh Ayoubi</p>
                                <p className="names">Keeghan Saches</p>
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
                </div>)}{" "}
                {/*<!--divContainer--> */}
            </div>
        </>
    );
}

AnimELLEGame.getLayout = (page: React.JSX.Element) => (
    <GameLayout>{page}</GameLayout>
);
