import React, { useState } from 'react';
import { Button, Tooltip, Modal, ModalHeader, ModalBody, Badge } from 'reactstrap'; 

const Manual = (props) => {   
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false); 
    const toggleTooltip = () => setTooltipOpen(!tooltipOpen);
    const toggleModal = () => setModalOpen(!modalOpen);

    return (
        <>
            <Button 
                size="sm"
                style={{border: "none", backgroundColor: "#5faeb4", marginRight: "10px"}}
                id="manualBtn"
                onClick={() => toggleModal()}
            >
                <img style={{width: "25px", height: "25px"}} src={require('../../Images/manual.png')}/>
            </Button>

            <Tooltip placement="left" isOpen={tooltipOpen} target="manualBtn" toggle={() => toggleTooltip()}>
                Manual
            </Tooltip>

            <Modal isOpen={modalOpen} toggle={() => toggleModal()}>
                <ModalHeader toggle={() => toggleModal()}>Manual</ModalHeader>
                <ModalBody>
                    <h6>
                        To maximize your students' in-game experience follow these instructions. 
                    </h6>
                    <text style={{fontWeight: "bold"}}>ELLE BetterRacer (Mobile): </text>
                    <p>
                        BetterRacer focuses on matching the foreign term with its correlated image. 
                        To make a module suitable for this game, remember it is essential to add an image for every term you make. 
                    </p>
                    <text>Forms to fill out: </text>
                    <p>
                        <Badge color="primary">Add Term</Badge> recommended field(s): image
                    </p>
                    <text style={{fontWeight: "bold"}}>ELLE Card Game (PC): </text>
                    <p>
                        This Card Game focuses on versatile questions that can have more than one answer associated with them. 
                        To help your students learn about a certain topic or category of terms, custom questions can come in handy. 
                        For example you can ask the question: "What is a color?", and the many answers associated with it can be 
                        ["red", "blue", "green"]. 
                        However this game can still function perfectly fine as a matching game by using the terms.           
                    </p>
                    <text>Forms to fill out: </text>
                    <p>
                        <Badge color="primary">Add Term</Badge> recommended field(s): image <br />
                        <Badge color="warning">Add Question</Badge> recommended field(s): image 
                    </p>
                    <text style={{fontWeight: "bold"}}>ELLE (VR): </text>
                    <p>
                        <text style={{textDecoration: "underline"}}>Spin N' SpELLE</text>
                        <p>
                            A tetris like game where the user has to fill in the partially filled words 
                            by placing the blocks containing the right letters.
                            This game focuses on using terms to help the students reinforce spelling and recognize foreign terms. 
                            To give your students the full experience it is essential to add any necessary accents, an image 
                            associated with the term, and to really enhance the experience add an audio file.  
                        </p>
                        <text>Forms to fill out: </text>
                        <p>
                            <Badge color="primary">Add Term</Badge> recommended field(s): image, audio
                        </p>
                        <text style={{textDecoration: "underline"}}>Highrise HELLEp</text> 
                        <p>
                            A firefighter game where the user has to put out fire on the window containing objects 
                            from a specific category.
                            This game will allow the user to identify words and what category they belong 
                            by their visual representation. 
                            To give your students the full experience it is essential to include a type and gender for the term, and
                            add as many relevant tags as possible for each term. 
                        </p>
                        <text>Forms to fill out: </text>
                        <p>
                            <Badge color="primary">Add Term</Badge> recommended field(s): type, gender, tags
                        </p>
                    </p>
                </ModalBody>
            </Modal>
        </>
    );
}

export default Manual