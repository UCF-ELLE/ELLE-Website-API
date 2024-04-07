import Image from 'next/image';
import React, { useState } from 'react';
import { Button, Tooltip, Modal, ModalHeader, ModalBody, Badge } from 'reactstrap';

import manualImage from '@/public/static/images/manual.png';

export default function Manual({ pasta }: { pasta?: boolean }) {
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
                <ModalBody>{pasta ? <PastaManualBody /> : <CommonManualBody />}</ModalBody>
            </Modal>
        </>
    );
}

// Note: This could be refitted to support a JSON input for the manual body
function CommonManualBody() {
    return (
        <>
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
                This Card Game focuses on versatile questions that can have more than one answer associated with them. To help your students learn
                about a certain topic or category of terms, custom questions can come in handy. For example you can ask the question: &quot;What is a
                color?&quot;, and the many answers associated with it can be [&quot;red&quot;, &quot;blue&quot;, &quot;green&quot;]. However this game
                can still function perfectly fine as a matching game by using the terms.
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
                    If you would only like certain terms to be used in the Jungle area, please add the &apos;jungle&apos; tag to all terms. Otherwise,
                    the game will randomly pull from all terms in the module
                </p>
                <p>
                    If you would like the Treasure activity, include at least three terms with numerals as the English term (&apos;1, 2, 3,
                    etc.&apos;). The game will use at most 10 terms at a time, and require words to be selected from least to greatest.
                </p>
                <p>
                    If you would like the Rock, Paper, Scissors activity, include terms translating &apos;Rock&apos;, &apos;Paper&apos;, and
                    &apos;Scissors&apos;.
                </p>
                While audio in general is optional, it is highly recommended to use whenever possible and is required for the Bingo Minigame. The
                Bingo minigame needs at least 9 terms and audio.
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
                    A tetris like game where the user has to fill in the partially filled words by placing the blocks containing the right letters.
                    This game focuses on using terms to help the students reinforce spelling and recognize foreign terms. To give your students the
                    full experience it is essential to add any necessary accents, an image associated with the term, and to really enhance the
                    experience add an audio file.
                </p>
                <text>Forms to fill out: </text>
                <p>
                    <Badge color='primary'>Add Term</Badge> recommended field(s): image, audio
                </p>
                <text style={{ textDecoration: 'underline' }}>Highrise HELLEp</text>
                <p>
                    A firefighter game where the user has to put out fire on the window containing objects from a specific category. This game will
                    allow the user to identify words and what category they belong by their visual representation. To give your students the full
                    experience it is essential to include a type and gender for the term, and add as many relevant tags as possible for each term.
                </p>
                <text>Forms to fill out: </text>
                <p>
                    <Badge color='primary'>Add Term</Badge> recommended field(s): type, gender, tags
                </p>
            </p>
            <text style={{ fontWeight: 'bold' }}>ELLE BetterRacer (Mobile) [NOT CURRENTLY SUPPORTED]: </text>
            <p>
                BetterRacer focuses on matching the foreign term with its correlated image. To make a module suitable for this game, remember it is
                essential to add an image for every term you make.
            </p>
            <text>Forms to fill out: </text>
            <p>
                <Badge color='primary'>Add Term</Badge> recommended field(s): image
            </p>
        </>
    );
}

function PastaManualBody() {
    return (
        <>
            <h6>To maximize your students&apos; in-game experience follow these instructions.</h6>
            <text style={{ fontWeight: 'bold' }}>Pasta Game (PC): </text>
            <p style={{ marginBottom: 8 }}>
                The Pasta Game focuses on understanding the structure of language, particularly in terms of morphology and syntax. Players will be
                prompted to break down utterances—whether they&apos;re words, sentences, or phrases—into their constituent parts, guided by specific
                question frames. This game offers extensive customization, with question frames accommodating two multiple choice questions, a
                &quot;split question&quot; requiring users to divide the utterance, and an &quot;identify question&quot; asking them to recognize
                parts previously identified. The sequence of questions is as follows:
            </p>
            <ol>
                <li>
                    <b>Multiple Choice Question 1</b>
                </li>
                <li>
                    <b>Split Question</b>: Players divide the utterance into its constituent parts, such as morphemes or roots.
                </li>
                <li>
                    <b>Identify Question</b>: Players identify the parts of the utterance that were previously split. This question can be used to
                    test recognition of the split parts.
                </li>
                <li>
                    <b>Multiple Choice Question 2</b>
                </li>
            </ol>
            <hr />
            <h6 style={{ marginBottom: 8 }}>
                <b>Forms</b>
            </h6>
            <div>
                <Badge color='primary'>Add Question Frame</Badge>
                <p>
                    Required Fields:
                    <ul>
                        <li>
                            <b>Display Name In-Game</b>: This name appears in the Split and Identify questions to clarify the category of the
                            utterance for players. For example, if the Display Name is <b>sentence</b> and the category is
                            &quot;compoundsentences&quot;, the split question could read: &quot;Split the <b>sentence</b> by its morphemes.&quot;
                        </li>
                        <li>
                            <b>Category</b>: Links pastas to the question frame. Each pasta in this category must provide answers (mc, split,
                            identify) for this question frame.
                        </li>
                        <li>
                            <b>Split Leadup</b>: Alters the phrasing of the split question in-game. If set as <b>morphemes</b> the question becomes
                            &quot;Split the sentence by its <b>morphemes</b>&quot;.
                        </li>
                    </ul>
                    Optional Fields:
                    <ul>
                        <li>
                            <b>Identify Question</b>: Modifies the prompt for the optional Identify Question in-game. If set to <b>the roots</b> the
                            Identify question will ask players to &quot;Identify <b>the roots</b> of this sentence.&quot;
                        </li>
                        <li>
                            <b>Multiple Choice Question</b>: Up to two multiple choice questions can be added. The first one will be presented first
                            for each pasta associated with the question frame. Each multiple choice question includes the question text and two to
                            four answer options.
                        </li>
                    </ul>
                </p>

                <Badge color='warning'>Add Pasta</Badge>
                <p>
                    Required Fields:
                    <ul>
                        <li>
                            <b>Utterance</b>: This is the word, phrase, or question to be analyzed. The utterance will be divided when the split
                            question is asked.
                        </li>
                        <li>
                            <b>Category</b>: Select the relevant question frame category for this pasta. This determines which answers need to be
                            added.
                        </li>
                        <li>
                            <b>Split Answer</b>: This field, visible after selecting a category, features the question frame question above it. It
                            consists of each character (ignoring whitespace and special characters) with red triangles between them. Clicking a red
                            triangle toggles it to a green circle, representing the correct split.
                        </li>
                        <li>
                            <b>Identify Answer</b>: Shown only if the question frame supports an Identify Question.
                        </li>
                        <li>
                            <b>Multiple Choice Answer(s)</b>: Displayed if the question frame supports one or two Multiple Choice Questions.
                        </li>
                    </ul>
                </p>
            </div>
        </>
    );
}
