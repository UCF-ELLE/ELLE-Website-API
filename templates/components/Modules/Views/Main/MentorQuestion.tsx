import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Alert, Button, ButtonGroup, Modal, ModalHeader, ModalBody, ModalFooter, Collapse, Input, Form, FormGroup } from 'reactstrap';
import axios from 'axios';
import { MentorQuestion } from '@/types/api/mentors';
import { Module } from '@/types/api/modules';
import { useUser } from '@/hooks/useUser';

import submitImage from '@/public/static/images/submit.png';
import cancelImage from '@/public/static/images/cancel.png';
import toolsImage from '@/public/static/images/tools.png';
import deleteImage from '@/public/static/images/delete.png';
import Image from 'next/image';

export default function MentorQuestion({
    question,
    updateCurrentModule,
    curModule
}: {
    question: MentorQuestion;
    updateCurrentModule: (module: Module, task?: string) => void;
    curModule: Module;
}) {
    const [modal, setModal] = useState(false);
    const [myAnswers, setMyAnswers] = useState<{ answerChoice: string; multipleChoiceID: number }[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [editedQuestionText, setEditedQuestionText] = useState(question.questionText);
    const [newAnswer1, setNewAnswer1] = useState('');
    const [newAnswer2, setNewAnswer2] = useState('');
    const [newAnswer3, setNewAnswer3] = useState('');
    const [collapseAnswers, setCollapseAnswers] = useState(false);
    const [submittingAnswer, setSubmittingAnswer] = useState(false);
    const { user, loading } = useUser();
    const permissionLevel = user?.permissionGroup;

    //function that allows user to cancel AddAnswer form
    const cancelCreateAnswer = () => {
        setSubmittingAnswer(false);
    };

    //function that gets called when the edit button is pushed. Sets editmode to true
    const toggleEditMode = () => {
        setEditMode(true);
        setCollapseAnswers(true);
    };

    const updateAnswers = useCallback(() => {
        const data = {
            question_id: question.questionID
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post('/elleapi/getmultiplechoiceoptions', data, header)
            .then((res) => {
                let answers = res.data;
                setMyAnswers(answers);
            })
            .catch(function (error) {
                console.log('getMCoptions error: ', error);
            });
    }, [question.questionID, user?.jwt]);

    const submitQuestionEdit = () => {
        setEditMode(false);

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        for (let i = 0; i < myAnswers.length; i++) {
            if (myAnswers[i].answerChoice == '') {
                //delete option
                let header = {
                    data: {
                        mc_id: myAnswers[i].multipleChoiceID
                    },
                    headers: {
                        Authorization: 'Bearer ' + user?.jwt
                    }
                };

                axios
                    .delete('/elleapi/deletemultiplechoiceoptions', header)
                    .then((res) => {
                        updateAnswers();
                    })
                    .catch((error) => {
                        console.log('deleteMCPtion error: ', error.response);
                    });
            } else {
                //modify option
                let data = {
                    updated_option: myAnswers[i].answerChoice,
                    mc_id: myAnswers[i].multipleChoiceID
                };

                axios
                    .post('/elleapi/modifymultiplechoiceoptions', data, header)
                    .then((res) => {
                        if (i == myAnswers.length - 1) {
                            updateAnswers();
                        }
                    })
                    .catch((error) => {
                        console.log('editMCoption error: ', error.response);
                    });
            }
        }

        if (newAnswer1 != '') {
            let data = {
                option: newAnswer1,
                question_id: question.questionID
            };

            axios
                .post('/elleapi/createmultiplechoiceoptions', data, header)
                .then((res) => {
                    updateAnswers();
                    setNewAnswer1('');
                })
                .catch((error) => {
                    console.log('createMCoption error: ', error.response);
                });
        }
        if (newAnswer2 != '') {
            let data = {
                option: newAnswer2,
                question_id: question.questionID
            };

            axios
                .post('/elleapi/createmultiplechoiceoptions', data, header)
                .then((res) => {
                    updateAnswers();
                    setNewAnswer2('');
                })
                .catch((error) => {
                    console.log('createMCoption error: ', error.response);
                });
        }
        if (newAnswer3 != '') {
            let data = {
                option: newAnswer3,
                question_id: question.questionID
            };

            axios
                .post('/elleapi/createmultiplechoiceoptions', data, header)
                .then((res) => {
                    updateAnswers();
                    setNewAnswer3('');
                })
                .catch((error) => {
                    console.log('createMCoption error: ', error.response);
                });
        }

        let data = {
            question_id: question.questionID,
            question_text: editedQuestionText
        };

        axios
            .post('/elleapi/modifymentorquestions', data, header)
            .then((res) => {
                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('submitQuestionEdit error: ', error.response);
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
                question_id: question.questionID
            },
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .delete('/elleapi/deletementorquestions', header)
            .then((res) => {
                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('deleteQuestion in MentorQuestion.js error: ', error.message);
            });
    };

    //function that toggles whether or not answers a visible
    const toggleCollapsedAnswers = () => {
        setCollapseAnswers(!collapseAnswers);
    };

    const toggleModal = () => {
        setModal(!modal);
    };

    //function that cancels the edit and sets everything back to what it was initially
    const handleCancelEdit = () => {
        setEditedQuestionText(question.questionText);
        setModal(false);
        setCollapseAnswers(false);
        setEditMode(false);

        updateAnswers();
    };

    const changeAnswer = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newAnswers = [...myAnswers];
        let id = parseInt(e.target.id);
        newAnswers[id].answerChoice = e.target.value;
        setMyAnswers(newAnswers);
    };

    useEffect(() => {
        if (!loading && user) {
            if (question.type === 'MENTOR_MC') {
                updateAnswers();
            } else {
                setMyAnswers([]);
            }
        }
    }, [question.type, updateAnswers, user, loading]);

    return !editMode ? (
        <Fragment>
            <tr onClick={toggleCollapsedAnswers}>
                <td>{question.questionText}</td>

                {permissionLevel !== 'st' ? (
                    <td>
                        <ButtonGroup>
                            <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => toggleEditMode()}>
                                <Image src={toolsImage} alt='edit icon' style={{ width: '25px', height: '25px' }} />
                            </Button>
                            <Button style={{ backgroundColor: 'lightcoral' }} onClick={handleDelete}>
                                <Image src={deleteImage} alt='trash can icon' style={{ width: '25px', height: '25px' }} />
                            </Button>
                        </ButtonGroup>
                    </td>
                ) : null}

                <Modal isOpen={modal} toggle={toggleModal}>
                    <ModalHeader toggle={toggleModal}>Delete</ModalHeader>

                    <ModalBody>
                        <Alert color='primary'>
                            Deleting this question will remove it from all the users who are currently using this module as well.
                        </Alert>
                        <p style={{ paddingLeft: '20px' }}>Are you sure you want to delete this question?</p>
                    </ModalBody>

                    <ModalFooter>
                        <Button onClick={toggleModal}>Cancel</Button>
                        <Button color='danger' onClick={deleteQuestion}>
                            Delete
                        </Button>
                    </ModalFooter>
                </Modal>
            </tr>

            <tr>
                <td style={{ border: 'none', padding: 0 }} colSpan={8}>
                    <Collapse isOpen={collapseAnswers}>
                        <b>Answers: </b>
                        <br />
                        <br />
                        {question.type === 'MENTOR_MC' ? (
                            <div>
                                {myAnswers.map((answer, index) => {
                                    return (
                                        <p key={answer.multipleChoiceID + ' ' + index} id={answer.multipleChoiceID.toString()}>
                                            {' '}
                                            - {answer.answerChoice}
                                        </p>
                                    );
                                })}
                            </div>
                        ) : (
                            <p>Free response, no answers</p>
                        )}
                    </Collapse>
                </td>
            </tr>
        </Fragment>
    ) : (
        <Fragment>
            <tr>
                <td>
                    {editedQuestionText && (editedQuestionText.trim() === '' || editedQuestionText.length > 200) ? (
                        <Input
                            invalid
                            type='number'
                            name='editedQuestionText'
                            id='editedQuestionText'
                            placeholder='Required'
                            onChange={(e) => setEditedQuestionText(e.target.value)}
                            value={editedQuestionText}
                        />
                    ) : (
                        <Input
                            type='number'
                            name='editedQuestionText'
                            id='editedQuestionText'
                            onChange={(e) => setEditedQuestionText(e.target.value)}
                            value={editedQuestionText}
                        />
                    )}
                </td>

                <td>
                    <ButtonGroup>
                        {(editedQuestionText && (editedQuestionText?.trim() === '' || editedQuestionText.length > 200)) || // question invalid
                        (question.type === 'MENTOR_MC' && // question is MC //whatever is wrong the with MC options
                            (myAnswers[0].answerChoice.trim() == '' ||
                                myAnswers[1].answerChoice.trim() == '' ||
                                myAnswers[0].answerChoice.length > 30 ||
                                myAnswers[1].answerChoice.length > 30 || //check for these no matter # of MC options, there will always be 2
                                (myAnswers.length > 2 &&
                                    ((myAnswers[2].answerChoice.trim() == '' && myAnswers[2].answerChoice != '') ||
                                        myAnswers[2].answerChoice.length > 30)) || //at least a third answer
                                (myAnswers.length > 3 &&
                                    ((myAnswers[3].answerChoice.trim() == '' && myAnswers[3].answerChoice != '') ||
                                        myAnswers[3].answerChoice.length > 30)) || //at least a fourth answer
                                (myAnswers.length > 4 &&
                                    ((myAnswers[4].answerChoice.trim() == '' && myAnswers[4].answerChoice != '') ||
                                        myAnswers[4].answerChoice.length > 30)) || //at least a fifth answer. Note if there are 5 answers, the third and fourth answers will also be checked since 5 > 2 and 5 > 3
                                (newAnswer1.trim() == '' && newAnswer1 != '') ||
                                newAnswer1.length > 30 ||
                                (newAnswer2.trim() == '' && newAnswer2 != '') ||
                                newAnswer2.length > 30 ||
                                (newAnswer3.trim() == '' && newAnswer3 != '') ||
                                newAnswer3.length > 30)) ? ( //can check newAnswers no matter what as they are always nonnull and empty is not a fail case
                            <Button style={{ backgroundColor: 'lightcoral' }} disabled>
                                <Image src={submitImage} alt='Icon made by Becris from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                            </Button>
                        ) : (
                            <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => submitQuestionEdit()}>
                                <Image src={submitImage} alt='Icon made by Becris from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                            </Button>
                        )}
                        <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => handleCancelEdit()}>
                            <Image src={cancelImage} alt='Icon made by Freepik from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                        </Button>
                    </ButtonGroup>
                </td>
            </tr>
            {question.type === 'MENTOR_MC' ? (
                <tr>
                    <td style={{ border: 'none' }} colSpan={8}>
                        <div>
                            <b>Answers: </b>
                            <br />
                            <br />
                            <Form>
                                <FormGroup className='mb-2 mr-sm-2 mb-sm-0'>
                                    {myAnswers.map((answer, index) => {
                                        if (index == 2 || index == 3 || index == 4) {
                                            if ((answer.answerChoice.trim() == '' && answer.answerChoice != '') || answer.answerChoice.length > 30) {
                                                return (
                                                    <div key={index}>
                                                        <Input
                                                            invalid
                                                            type='number'
                                                            id={index.toString()}
                                                            name={'answer' + index}
                                                            value={answer.answerChoice}
                                                            onChange={(e) => changeAnswer(e)}
                                                            placeholder='Optional'
                                                        />
                                                        <br></br>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div key={index}>
                                                        <Input
                                                            type='number'
                                                            id={index.toString()}
                                                            name={'answer' + index}
                                                            value={answer.answerChoice}
                                                            onChange={(e) => changeAnswer(e)}
                                                            placeholder='Optional'
                                                        />
                                                        <br></br>
                                                    </div>
                                                );
                                            }
                                        } else {
                                            if (answer.answerChoice.trim() == '' || answer.answerChoice.length > 30) {
                                                return (
                                                    <div key={index}>
                                                        <Input
                                                            invalid
                                                            type='number'
                                                            id={index.toString()}
                                                            name={'answer' + index}
                                                            value={answer.answerChoice}
                                                            onChange={(e) => changeAnswer(e)}
                                                            placeholder='Required'
                                                        />
                                                        <br></br>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div key={index}>
                                                        <Input
                                                            type='number'
                                                            id={index.toString()}
                                                            name={'answer' + index}
                                                            value={answer.answerChoice}
                                                            onChange={(e) => changeAnswer(e)}
                                                        />
                                                        <br></br>
                                                    </div>
                                                );
                                            }
                                        }
                                    })}
                                    {myAnswers.length <= 2 ? (
                                        (newAnswer1.trim() == '' && newAnswer1 != '') || newAnswer1.length > 30 ? (
                                            <div>
                                                <Input
                                                    invalid
                                                    type='number'
                                                    id={'2'}
                                                    name={'newAnswer1'}
                                                    value={newAnswer1}
                                                    onChange={(e) => setNewAnswer1(e.target.value)}
                                                    placeholder='Optional'
                                                />
                                                <br></br>
                                            </div>
                                        ) : (
                                            <div>
                                                <Input
                                                    type='number'
                                                    id={'2'}
                                                    name={'newAnswer1'}
                                                    value={newAnswer1}
                                                    onChange={(e) => setNewAnswer1(e.target.value)}
                                                    placeholder='Optional'
                                                />
                                                <br></br>
                                            </div>
                                        )
                                    ) : (
                                        <div></div>
                                    )}
                                    {myAnswers.length <= 3 ? (
                                        (newAnswer2.trim() == '' && newAnswer2 != '') || newAnswer2.length > 30 ? (
                                            <div>
                                                <Input
                                                    invalid
                                                    type='number'
                                                    id={'3'}
                                                    name={'newAnswer2'}
                                                    value={newAnswer2}
                                                    onChange={(e) => setNewAnswer2(e.target.value)}
                                                    placeholder='Optional'
                                                />
                                                <br></br>
                                            </div>
                                        ) : (
                                            <div>
                                                <Input
                                                    type='number'
                                                    id={'3'}
                                                    name={'newAnswer2'}
                                                    value={newAnswer2}
                                                    onChange={(e) => setNewAnswer2(e.target.value)}
                                                    placeholder='Optional'
                                                />
                                                <br></br>
                                            </div>
                                        )
                                    ) : (
                                        <div></div>
                                    )}
                                    {myAnswers.length <= 4 ? (
                                        (newAnswer3.trim() == '' && newAnswer3 != '') || newAnswer3.length > 30 ? (
                                            <div>
                                                <Input
                                                    invalid
                                                    type='number'
                                                    id={'4'}
                                                    name={'newAnswer3'}
                                                    value={newAnswer3}
                                                    onChange={(e) => setNewAnswer3(e.target.value)}
                                                    placeholder='Optional'
                                                />
                                                <br></br>
                                            </div>
                                        ) : (
                                            <div>
                                                <Input
                                                    type='number'
                                                    id={'4'}
                                                    name={'newAnswer3'}
                                                    value={newAnswer3}
                                                    onChange={(e) => setNewAnswer3(e.target.value)}
                                                    placeholder='Optional'
                                                />
                                                <br></br>
                                            </div>
                                        )
                                    ) : (
                                        <div></div>
                                    )}
                                </FormGroup>
                                <br />
                            </Form>
                        </div>
                    </td>
                </tr>
            ) : (
                <tr></tr>
            )}
        </Fragment>
    );
}
