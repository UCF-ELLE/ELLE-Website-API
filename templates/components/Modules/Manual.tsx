import Image from 'next/image';
import React, { useState } from 'react';
import { Button, Tooltip, Modal, ModalHeader, ModalBody, Badge } from 'reactstrap';

import manualImage from '@/public/static/images/manual.png';

export default function Manual() {
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const toggleTooltip = () => setTooltipOpen(!tooltipOpen);
    const toggleModal = () => setModalOpen(!modalOpen);

    return (
        <>
            <Button
                size='sm'
                style={{
                    border: 'none',
                    backgroundColor: '#5faeb4',
                    marginRight: '10px'
                }}
                id='manualBtn'
                onClick={() => toggleModal()}
            >
                <Image style={{ width: '25px', height: '25px' }} alt={'manual image'} src={manualImage} />
            </Button>

            <Tooltip placement='left' isOpen={tooltipOpen} target='manualBtn' toggle={() => toggleTooltip()}>
                Manual
            </Tooltip>

            <Modal isOpen={modalOpen} toggle={() => toggleModal()}>
                <ModalHeader toggle={() => toggleModal()}>Manual</ModalHeader>
                <ModalBody>
                    <h6>
                        <strong>
                            Please Note: <br />{' '}
                        </strong>
                        The accepted <em>image</em> files are PNG, JPG, and JPEG, and accepted <em>audio</em> files are OGG, WAV and MP3.
                    </h6>
                    <h6>
                        <br />
                        To maximize your students&apos; in-game experience follow these instructions.
                    </h6>
                    <text style={{ fontWeight: 'bold' }}>ELLE Card Game (PC): </text>
                    <p>
                        This Card Game focuses on versatile questions that can have more than one answer associated with them. To help your students
                        learn about a certain topic or category of terms, custom questions can come in handy. For example you can ask the question:
                        &quot;What is a color?&quot;, and the many answers associated with it can be [&quot;red&quot;, &quot;blue&quot;,
                        &quot;green&quot;]. However this game can still function perfectly fine as a matching game by using the terms.
                    </p>
                    <text>Forms to fill out: </text>
                    <p>
                        <Badge color='primary'>Add Term</Badge> recommended field(s): image <br />
                        <Badge color='warning'>Add Question</Badge> recommended field(s): image
                    </p>
                    <text style={{ fontWeight: 'bold' }}>AnimELLE Crossing: WiELLED Words (PC): </text>
                    <p>
                        If you would like to set the dialogue for an NPCs, please use these tags:
                        <p></p>
                        <p>&apos;NPC_1&apos; and &apos;NPC_2&apos;: Dialogue for Village NPCs</p>
                        <p>&apos;NPC_Bingo&apos;: Dialogue asking if the player would like to play Bingo</p>
                        <p>&apos;NPC_Treasure&apos;: Dialogue explaining the treasure chest activity</p>
                        <p>&apos;Ticket_Ask&apos;: Dialogue asking the player to buy a ticket</p>
                        <p>&apos;Ticket_Success&apos;: Dialogue for successfully purchasing a ticket</p>
                        <p>
                            If you would only like certain terms to be used in the Jungle area, please add the &apos;jungle&apos; tag to all terms.
                            Otherwise, the game will randomly pull from all terms in the module
                        </p>
                        <p>
                            If you would like the Treasure activity, include at least three terms with numerals as the English term (&apos;1, 2, 3,
                            etc.&apos;). The game will use at most 10 terms at a time, and require words to be selected from least to greatest.
                        </p>
                        <p>
                            If you would like the Rock, Paper, Scissors activity, include terms translating &apos;Rock&apos;, &apos;Paper&apos;, and
                            &apos;Scissors&apos;.
                        </p>
                        While audio in general is optional, it is highly recommended to use whenever possible and is required for the Bingo Minigame.
                        The Bingo minigame needs at least 9 terms and audio.
                        <p>For all of the aforementioned things, Terms must be used. For Fill in the blank, Questions must be used.</p>
                    </p>
                    <text>Forms to fill out: </text>
                    <p>
                        <Badge color='primary'>Add Term</Badge> recommended field(s): image <br />
                        <Badge color='warning'>Add Question</Badge> recommended field(s): image
                    </p>
                    <text style={{ fontWeight: 'bold' }}>ELLE (VR): </text>
                    <p>
                        <text style={{ textDecoration: 'underline' }}>Spin N&apos; SpELLE</text>
                        <p>
                            A tetris like game where the user has to fill in the partially filled words by placing the blocks containing the right
                            letters. This game focuses on using terms to help the students reinforce spelling and recognize foreign terms. To give
                            your students the full experience it is essential to add any necessary accents, an image associated with the term, and to
                            really enhance the experience add an audio file.
                        </p>
                        <text>Forms to fill out: </text>
                        <p>
                            <Badge color='primary'>Add Term</Badge> recommended field(s): image, audio
                        </p>
                        <text style={{ textDecoration: 'underline' }}>Highrise HELLEp</text>
                        <p>
                            A firefighter game where the user has to put out fire on the window containing objects from a specific category. This game
                            will allow the user to identify words and what category they belong by their visual representation. To give your students
                            the full experience it is essential to include a type and gender for the term, and add as many relevant tags as possible
                            for each term.
                        </p>
                        <text>Forms to fill out: </text>
                        <p>
                            <Badge color='primary'>Add Term</Badge> recommended field(s): type, gender, tags
                        </p>
                    </p>
                    <text style={{ fontWeight: 'bold' }}>ELLE BetterRacer (Mobile) [NOT CURRENTLY SUPPORTED]: </text>
                    <p>
                        BetterRacer focuses on matching the foreign term with its correlated image. To make a module suitable for this game, remember
                        it is essential to add an image for every term you make.
                    </p>
                    <text>Forms to fill out: </text>
                    <p>
                        <Badge color='primary'>Add Term</Badge> recommended field(s): image
                    </p>
                </ModalBody>
            </Modal>
        </>
    );
}
