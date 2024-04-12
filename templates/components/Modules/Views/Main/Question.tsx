import React, { Fragment, useState } from 'react';
import { Alert, Button, ButtonGroup, Modal, ModalHeader, ModalBody, ModalFooter, Collapse, Input, Tooltip } from 'reactstrap';
import axios from 'axios';

import AnswerButtonList from './AnswerButtonList';
import Autocomplete from './Autocomplete';
import AddAnswer from './AddAnswer';
import { Module, ModuleQuestion, ModuleQuestionAnswer } from '@/types/api/modules';
import { Tag } from '@/types/api/terms';
import { LoggedAnswer } from '@/types/api/logged_answer';
import { useUser } from '@/hooks/useUser';

import imageImage from '@/public/static/images/image.png';
import headphonesImage from '@/public/static/images/headphones.png';
import uploadImageImage from '@/public/static/images/uploadImage.png';
import uploadAudioImage from '@/public/static/images/uploadAudio.png';
import toolImage from '@/public/static/images/tools.png';
import trashImage from '@/public/static/images/delete.png';
import submitImage from '@/public/static/images/submit.png';
import cancelImage from '@/public/static/images/cancel.png';
import Image from 'next/image';

export default function Question({
    question,
    curModule,
    updateCurrentModule,
    deleteTag,
    addTag,
    allTags,
    allAnswers,
    currentClass
}: {
    question: ModuleQuestion;
    curModule: Module;
    updateCurrentModule: (module: Module, task?: string) => void;
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
    allAnswers: ModuleQuestionAnswer[];
    currentClass: { value: number; label: string };
}) {
    const [modal, setModal] = useState(false);
    const [imgTooltipOpen, setImgTooltipOpen] = useState(false);
    const [audioTooltipOpen, setAudioTooltipOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedQuestionText, setEditedQuestionText] = useState(question.questionText);
    const [collapseAnswers, setCollapseAnswers] = useState(false);
    const [selectedImgFile, setSelectedImgFile] = useState(question.imageLocation);
    const [selectedAudioFile, setSelectedAudioFile] = useState(question.audioLocation);
    const [changedImage, setChangedImage] = useState(false);
    const [changedAudio, setChangedAudio] = useState(false);
    const [answers, setAnswers] = useState(
        question.answers?.map((answer) => {
            return answer.front || '';
        }) || []
    );
    const [originalAnswers, setOriginalAnswers] = useState(
        question.answers?.map((answer) => {
            return answer.front;
        }) || []
    );
    const [ids, setIDs] = useState(
        question.answers?.map((answer) => {
            return answer.termID;
        }) || []
    );
    const [newlyCreatedAnswers, setNewlyCreatedAnswers] = useState<ModuleQuestionAnswer[]>([]);
    const [submittingAnswer, setSubmittingAnswer] = useState(false);
    const [userCreatedAnswer, setUserCreatedAnswer] = useState('');
    let imgInput: HTMLInputElement | null;
    let audioInput: HTMLInputElement | null;

    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    //TODO: handleAddAnswer and createAnswer kinda do the same thing. Maybe they should be one thing?
    //function that adds a answer to list of answers on this question(only available when editmode is true)
    const handleAddAnswer = (event: { answer: string; answerID: number }) => {
        let ansList = answers;
        let idList = ids;

        ansList.push(event.answer);
        idList.push(event.answerID);

        setAnswers(ansList);
        setIDs(idList);
    };

    //function that adds a new answer from user input to list of answers on this question(only when editmode is true)
    const createAnswer = (answer: string) => {
        setSubmittingAnswer(true);
        setUserCreatedAnswer(answer);
    };

    //function that adds a newly created answer to the list of answers on this question
    const addNewAnswerToList = (answer: ModuleQuestionAnswer) => {
        let tempNewlyCreatedAnswers = newlyCreatedAnswers;
        tempNewlyCreatedAnswers.push(answer);

        let allAnswers = answers;
        answer.front && allAnswers.push(answer.front);
        setNewlyCreatedAnswers(tempNewlyCreatedAnswers);
        setAnswers(allAnswers);
        setSubmittingAnswer(false);
    };

    //function that allows user to cancel AddAnswer form
    const cancelCreateAnswer = () => {
        setSubmittingAnswer(false);
    };

    const handleDeleteAnswer = (event: { answer: string }) => {
        let tempAnswerButtonList = answers;
        let idList = ids;

        let answerObject = answers.find((answer) => (answer === event.answer ? true : false));

        if (!answerObject) return;

        let answerIndex = tempAnswerButtonList.indexOf(answerObject);

        if (answerIndex !== -1) {
            tempAnswerButtonList.splice(answerIndex, 1);
            idList.splice(answerIndex, 1);
        }

        setAnswers(tempAnswerButtonList);
        setIDs(idList);
    };

    //function that gets called when the edit button is pushed. Sets editmode to true
    const toggleEditMode = () => {
        // this.setState({
        //   editMode: true,
        //   collapseAnswers: true,
        //   answers: this.props.question.answers.map((answer) => {return answer.front}),
        //   ids: this.props.question.answers.map((answer) => {return answer.termID})
        // });
        setEditMode(true);
        setCollapseAnswers(true);
        setAnswers(
            question.answers?.map((answer) => {
                return answer.front || '';
            }) || []
        );
        setIDs(
            question.answers?.map((answer) => {
                return answer.termID;
            }) || []
        );
    };

    //function that inputs image when user uploads a new image to the question
    const imgFileSelectedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedImgFile(event.target.files[0].toString());
            setChangedImage(true);
        }
    };

    const audioFileSelectedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedAudioFile(event.target.files[0].toString());
            setChangedAudio(true);
        }
    };

    //function that submits all of the edited data put on a question
    const submitEdit = () => {
        setEditMode(false);

        let NewlyCreatedAnswerJSONList = newlyCreatedAnswers.map((answer) => {
            return {
                front: answer.front,
                back: answer.back,
                language: curModule.language,
                tags: answer.tags
            };
        });

        let stringyAnswerList = JSON.stringify(
            NewlyCreatedAnswerJSONList.map((entry) => {
                return entry;
            })
        );

        let stringifyIDList = JSON.stringify(
            ids.map((entry) => {
                return entry;
            })
        );

        const data = new FormData();
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        data.append('image', changedImage && selectedImgFile !== undefined ? selectedImgFile : new Blob());
        data.append('audio', changedAudio && selectedAudioFile !== undefined ? selectedAudioFile : new Blob());

        editedQuestionText && data.append('questionText', editedQuestionText);
        data.append('questionID', question.questionID.toString()); //not editable
        data.append('new_answers', stringifyIDList);
        data.append('arr_of_terms', stringyAnswerList);
        data.append('type', 'LONGFORM');

        permissionLevel === 'ta' ? data.append('groupID', currentClass.value.toString()) : null;

        axios
            .post('/elleapi/modifyquestion', data, header)
            .then((res) => {
                setChangedImage(false);
                setChangedAudio(false);

                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('submitEdit in question.js error: ', error);
            });
    };

    //toggling delete modal, is not related to delete question API
    const handleDelete = () => {
        toggleModal();
    };

    //function for deleting a question from the database
    const deleteQuestion = (e: React.MouseEvent<HTMLButtonElement>) => {
        toggleModal();

        let header = {
            data: {
                questionID: question.questionID,
                groupID: permissionLevel === 'ta' ? currentClass.value : null
            },
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .delete('/elleapi/deletequestion', header)
            .then((res) => {
                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('deleteQuestion in Question.js error: ', error.message);
            });
    };

    //function that toggles whether or not answers a visible
    const toggleCollapsedAnswers = () => {
        setCollapseAnswers(!collapseAnswers);
    };

    const toggleModal = () => {
        setModal(!modal);
    };

    const toggleImgTooltipOpen = () => {
        setImgTooltipOpen(!imgTooltipOpen);
    };

    const toggleAudioTooltipOpen = () => {
        setAudioTooltipOpen(!audioTooltipOpen);
    };

    //function that cancels the edit and sets everything back to what it was initially
    const handleCancelEdit = () => {
        setModal(false);
        setEditMode(false);
        setEditedQuestionText(question.questionText);
        setCollapseAnswers(false);
        setSelectedImgFile(question.imageLocation);
        setSelectedAudioFile(question.audioLocation);
        setChangedImage(false);
        setChangedAudio(false);
        setAnswers(originalAnswers as string[]);
        setIDs(
            question.answers?.map((answer) => {
                return answer.termID;
            }) || []
        );
        setNewlyCreatedAnswers([]);
        setUserCreatedAnswer('');
    };

    let imgLink = '/elleapi/' + selectedImgFile;
    let audioLink = '/elleapi/' + selectedAudioFile;

    let disableImgButton = !selectedImgFile;
    let disableAudioButton = !selectedAudioFile;

    let imgButtonClass = disableImgButton ? 'disabled-btn' : 'enabled-btn';
    let audioButtonClass = disableAudioButton ? 'disabled-btn' : 'enabled-btn';

    return !editMode ? (
        <Fragment>
            <tr onClick={toggleCollapsedAnswers}>
                <td>{question.questionText}</td>
                <td style={{ textAlign: 'center' }}>
                    {/* Add disabled attribute to disable button if no image file found */}
                    <Button className={`image-btn ${imgButtonClass}`} href={imgLink} download disabled={disableImgButton}>
                        <Image src={imageImage} alt='frame icon' style={{ width: '25px', height: '25px' }} />
                    </Button>
                </td>
                <td style={{ textAlign: 'center' }}>
                    {/* Add disabled attribute to disable button if no audio file found */}
                    <Button className={`audio-btn ${audioButtonClass}`} href={audioLink} download disabled={disableAudioButton}>
                        <Image src={headphonesImage} alt='headphones icon' style={{ width: '25px', height: '25px' }} />
                    </Button>
                </td>

                {permissionLevel !== 'st' ? (
                    <td>
                        <ButtonGroup>
                            <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => toggleEditMode()}>
                                <Image src={toolImage} alt='edit icon' style={{ width: '25px', height: '25px' }} />
                            </Button>
                            <Button style={{ backgroundColor: 'lightcoral' }} onClick={handleDelete}>
                                <Image src={trashImage} alt='trash can icon' style={{ width: '25px', height: '25px' }} />
                            </Button>
                        </ButtonGroup>
                    </td>
                ) : null}

                <Modal isOpen={modal} toggle={toggleModal}>
                    <ModalHeader toggle={toggleModal}>Delete</ModalHeader>

                    <ModalBody>
                        <Alert color='primary'>
                            Deleting this custom question will remove it from all the users who are currently using this module as well.
                        </Alert>
                        <p style={{ paddingLeft: '20px' }}>Are you sure you want to delete the question: {editedQuestionText}?</p>
                    </ModalBody>

                    <ModalFooter>
                        <Button onClick={toggleModal}>Cancel</Button>
                        <Button color='danger' onClick={deleteQuestion}>
                            Delete
                        </Button>
                    </ModalFooter>
                </Modal>
            </tr>

            {question.answers && (
                <tr>
                    <td style={{ border: 'none', padding: 0 }} colSpan={8}>
                        <Collapse isOpen={collapseAnswers}>
                            Answers:
                            <AnswerButtonList
                                answers={question.answers.map((answer) => {
                                    return answer.front || '';
                                })}
                                handleDeleteAnswer={handleDeleteAnswer}
                                deletable={false}
                            />
                        </Collapse>
                    </td>
                </tr>
            )}
        </Fragment>
    ) : (
        <Fragment>
            <tr>
                <td>
                    <Input
                        type='number'
                        name='editedQuestionText'
                        onChange={(e) => setEditedQuestionText(e.target.value)}
                        value={editedQuestionText}
                    />
                </td>

                <td>
                    <input
                        style={{ display: 'none' }}
                        type='file'
                        onChange={imgFileSelectedHandler}
                        accept='.png, .jpg, .jpeg'
                        ref={(ref) => (imgInput = ref)}
                    />
                    <Button
                        style={{
                            backgroundColor: 'lightseagreen',
                            width: '100%'
                        }}
                        id='uploadImage'
                        onClick={() => imgInput?.click()}
                    >
                        <Image
                            src={uploadImageImage}
                            alt='Icon made by Pixel perfect from www.flaticon.com'
                            style={{ width: '25px', height: '25px' }}
                        />
                    </Button>
                    <Tooltip placement='top' isOpen={imgTooltipOpen} target='uploadImage' toggle={toggleImgTooltipOpen}>
                        Upload Image
                    </Tooltip>
                </td>

                <td>
                    <input
                        style={{ display: 'none' }}
                        type='file'
                        onChange={audioFileSelectedHandler}
                        accept='.ogg, .wav, .mp3'
                        ref={(ref) => (audioInput = ref)}
                    />
                    <Button
                        style={{
                            backgroundColor: 'lightseagreen',
                            width: '100%'
                        }}
                        id='uploadAudio'
                        onClick={() => audioInput?.click()}
                    >
                        <Image src={uploadAudioImage} alt='Icon made by Srip from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                    </Button>
                    <Tooltip placement='top' isOpen={audioTooltipOpen} target='uploadAudio' toggle={toggleAudioTooltipOpen}>
                        Upload Audio
                    </Tooltip>
                </td>

                <td>
                    <ButtonGroup>
                        <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => submitEdit()}>
                            <Image src={submitImage} alt='Icon made by Becris from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                        </Button>
                        <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => handleCancelEdit()}>
                            <Image src={cancelImage} alt='Icon made by Freepik from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                        </Button>
                    </ButtonGroup>
                </td>
            </tr>

            <tr>
                <td style={{ border: 'none' }} colSpan={8}>
                    Answers:
                    <AnswerButtonList answers={answers} handleDeleteAnswer={handleDeleteAnswer} deletable={true} />
                    Add Answer:
                    <Autocomplete
                        name={'answers'}
                        id={'answers'}
                        placeholder={'Answer'}
                        handleAddAnswer={handleAddAnswer}
                        createAnswer={createAnswer}
                        renderButton={true}
                        needID={1}
                        suggestions={allAnswers.map((answer) => answer.front || '')}
                        termIDs={allAnswers.map((answer) => {
                            return answer.termID;
                        })}
                    />
                </td>
            </tr>

            <Modal isOpen={submittingAnswer}>
                <ModalHeader toggle={cancelCreateAnswer}>Add Answer:</ModalHeader>
                <ModalBody style={{ padding: '0px' }}>
                    <AddAnswer
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        initialFront={userCreatedAnswer}
                        cancelCreateAnswer={cancelCreateAnswer}
                        addNewAnswerToList={addNewAnswerToList}
                    />
                </ModalBody>
            </Modal>
        </Fragment>
    );
}
