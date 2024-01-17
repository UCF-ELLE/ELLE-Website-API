import React, { useEffect, useState } from 'react';
import {
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Row,
    Col,
    Alert,
    Modal,
    ModalHeader,
    ModalBody,
} from 'reactstrap';
import axios from 'axios';

import Autocomplete from './Autocomplete';
import AnswerButtonList from './AnswerButtonList';
import AddAnswer from './AddAnswer';
import SearchAnswersByTag from './SearchAnswersByTag';

import MicRecorder from 'mic-recorder';
import { useUser } from '@/hooks/useUser';
import { Module, ModuleQuestionAnswer } from '@/types/api/modules';
import { Tag } from '../../../../to be removed/tags';
import { LoggedAnswer } from '@/types/api/logged_answer';

export default function AddQuestion({
    curModule,
    updateCurrentModule,
    deleteTag,
    addTag,
    allTags,
    getAllTags,
    allAnswers,
    currentClass,
    setOpenForm,
}: {
    curModule: Module;
    updateCurrentModule: (module: { module: Module }) => void;
    currentClass: { value: number; label: string };
    allAnswers: LoggedAnswer[];
    allTags: Tag[];
    getAllTags: () => void;
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    setOpenForm: (form: number) => void;
}) {
    const [questionText, setQuestionText] = useState('');
    const [front, setFront] = useState('');
    const [answers, setAnswers] = useState<ModuleQuestionAnswer[]>([]);
    const [newlyCreatedAnswers, setNewlyCreatedAnswers] = useState<
        ModuleQuestionAnswer[]
    >([]);
    const [newlyCreatedAnswersIDArray, setNewlyCreatedAnswersIDArray] =
        useState([]);
    const [selectedImgFile, setSelectedImgFile] = useState<File>(
        new File([], '')
    );
    const [selectedAudioFile, setSelectedAudioFile] = useState<File>(
        new File([], '')
    );
    const [type, setType] = useState([]);

    const [validAnswersState, setValidAnswersState] = useState<
        ModuleQuestionAnswer[]
    >([]);
    const [prevValidAnswers, setPrevValidAnswers] = useState([]);

    const [imgLabel, setImgLabel] = useState('Pick an image for the question');
    const [audioLabel, setAudioLabel] = useState(
        'Pick an audio for the question'
    );

    const [submittingAnswer, setSubmittingAnswer] = useState(false);
    const [userCreatedAnswer, setUserCreatedAnswer] = useState('');

    const [searchingByTag, setSearchingByTag] = useState(false);

    const [questionID, setQuestionID] = useState('');

    const [Mp3Recorder, setMp3Recorder] = useState(
        new MicRecorder({ bitRate: 128 })
    );

    const [isRecording, setIsRecording] = useState(false);
    const [blobURL, setBlobURL] = useState('');
    const [isBlocked, setIsBlocked] = useState(false);
    const [disable, setDisable] = useState(true);
    const [file, setFile] = useState<File>(new File([], ''));

    const [didUpload, setDidUpload] = useState(false);
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    useEffect(() => {
        setValidAnswers();
        try {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(
                () => {
                    console.log('Permission Granted');
                    setIsBlocked(false);
                },
                () => {
                    console.log('Permission Denied');
                    setIsBlocked(true);
                }
            );
        } catch (err) {
            console.log(
                "couldn't find mic.",
                'currently not working in production because getUserMedia CANNOT be run over unsecure netowrk...we need SSL.',
                err
            );
        }
    }, []);

    const start = () => {
        if (isBlocked) {
            console.log('Permission Denied');
        } else {
            Mp3Recorder.start()
                .then(() => {
                    setIsRecording(true);
                })
                .catch((e) => console.error(e));

            // this.state.disable = true
            setDisable(true);
        }
    };

    const stop = () => {
        Mp3Recorder.stop()
            .getAudio()
            .then(([buffer, blob]) => {
                const blobURL = URL.createObjectURL(blob);
                setBlobURL(blobURL);
                setIsRecording(false);

                const moduleIdentifier = document
                    .getElementById('module-name')
                    ?.textContent?.replace(/\s+/g, '-')
                    .toLowerCase();
                const phraseName = (
                    document.getElementById('questionText') as HTMLInputElement
                ).value
                    .replace(/\s+/g, '-')
                    .toLowerCase();

                setFile(
                    new File(
                        buffer,
                        `question_${moduleIdentifier}_${phraseName}.mp3`,
                        { type: blob.type, lastModified: Date.now() }
                    )
                );

                console.log(file);
            })
            .catch((e) => console.log(e));

        // this.state.disable = false
        setDisable(false);
    };

    const upload = () => {
        setSelectedAudioFile(file);
        setDidUpload(true);

        (document.getElementById('qstAudioFile') as HTMLInputElement).disabled =
            true;

        console.log(selectedAudioFile);
    };

    //function that sets the image file to the one selected
    const imgFileChangedHandler = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (event.target.files) {
            setSelectedImgFile(event.target.files[0]);
            setImgLabel(
                event.target.files[0] === undefined
                    ? 'Pick an image for the question'
                    : event.target.files[0].name
            );
        }
    };

    const audioFileChangedHandler = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (event.target.files) {
            setSelectedAudioFile(event.target.files[0]);
            setAudioLabel(
                event.target.files[0] === undefined
                    ? 'Pick an audio for the question'
                    : event.target.files[0].name
            );
        }
    };

    const submitQuestion = (e: React.FormEvent<HTMLFormElement>) => {
        if (questionText.length !== 0) {
            e.preventDefault();
            let data = new FormData();
            let header = {
                headers: { Authorization: 'Bearer ' + user?.jwt },
            };

            data.append('questionText', questionText);
            data.append('type', 'LONGFORM');
            data.append('moduleID', curModule.moduleID.toString());

            permissionLevel === 'ta'
                ? data.append('groupID', currentClass.value.toString())
                : null;

            if (selectedImgFile !== null || selectedImgFile !== undefined)
                data.append('image', selectedImgFile);

            if (selectedAudioFile !== null || selectedAudioFile !== undefined)
                data.append('audio', selectedAudioFile);

            data.append(
                'answers',
                JSON.stringify(
                    answers.map((answer) => {
                        return answer.termID;
                    })
                )
            );

            let NewlyCreatedAnswerJSONList = newlyCreatedAnswers.map(
                (answer) => {
                    return {
                        front: answer.front,
                        back: answer.back,
                        language: curModule.language,
                        tags: answer.tags,
                    };
                }
            );

            let stringyAnswerList = JSON.stringify(
                NewlyCreatedAnswerJSONList.map((entry) => {
                    return entry;
                })
            );

            data.append('arr_of_terms', stringyAnswerList);

            axios
                .post('/elleapi/question', data, header)
                .then((res) => {
                    resetFields();
                    updateCurrentModule({ module: curModule });
                })
                .catch((error) => {
                    console.log('submitQuestion error: ', error.response);
                });
        }
    };

    //TODO: handleAddAnswer and createAnswer kinda do the same thing. Maybe they should be one thing?
    //function that takes a string and adds the corresponding answer object to this.state.answers
    const handleAddAnswer = (event: { answer: string }) => {
        let list = answers;

        let answerObject = allAnswers.find((answer) => {
            if (answer.front === event.answer) {
                return true;
            } else {
                return false;
            }
        });

        if (answerObject === undefined) {
            answerObject = allAnswers.find((answer) => {
                if (answer.back === event.answer) {
                    return true;
                } else {
                    return false;
                }
            });
        }

        if (answerObject !== undefined) {
            list.push(answerObject);
        }

        setAnswers(list);

        setValidAnswers();
    };

    //sets this.state.validAnswers to be all of the answers not already added to this form
    const setValidAnswers = () => {
        let tempValidAnswers = allAnswers;

        let frontArray = answers.map((answer) => {
            return answer.front;
        });
        let backArray = answers.map((answer) => {
            return answer.back;
        });

        tempValidAnswers = tempValidAnswers.filter((answer) => {
            if (
                frontArray.indexOf(answer.front) === -1 &&
                backArray.indexOf(answer.back) === -1
            ) {
                return true;
            } else {
                return false;
            }
        });

        setValidAnswersState(tempValidAnswers);
    };

    //function that adds a new answer from user input to list of answers on this form
    const createAnswer = (answer) => {
        setSubmittingAnswer(true);
        setUserCreatedAnswer(answer);
    };

    const toggleSearchByTagForm = () => {
        setValidAnswers();
        getAllTags();
        setSearchingByTag(!searchingByTag);
    };

    //function that allows user to cancel AddAnswer form
    const cancelCreateAnswer = () => {
        setSubmittingAnswer(false);
    };

    //function that adds a newly created answer to the list of answers on this question
    const addNewAnswerToList = (answer: ModuleQuestionAnswer) => {
        let tempNewlyCreatedAnswers = newlyCreatedAnswers;
        tempNewlyCreatedAnswers.push(answer);
        setNewlyCreatedAnswers(tempNewlyCreatedAnswers);
        setSubmittingAnswer(false);
    };

    //function that removes a answer from the list of answers on this form
    const handleDeleteAnswer = (event) => {
        let tempAnswerButtonList = answers;

        let answerObject = answers.find((answer) => {
            if (answer.front === event.answer) {
                return true;
            } else {
                return false;
            }
        });

        if (answerObject !== undefined) {
            let answerIndex = tempAnswerButtonList.indexOf(answerObject);

            if (answerIndex !== -1) {
                tempAnswerButtonList.splice(answerIndex, 1);
            }
        }
        setAnswers(tempAnswerButtonList);
        setValidAnswers();
    };

    const handleDeleteNewAnswer = (event: { answer: string }) => {
        let tempAnswerButtonList = newlyCreatedAnswers;

        let answerObject = newlyCreatedAnswers.find((answer) => {
            if (answer.front === event.answer) {
                return true;
            } else {
                return false;
            }
        });

        if (answerObject !== undefined) {
            let answerIndex = tempAnswerButtonList.indexOf(answerObject);

            if (answerIndex !== -1) {
                tempAnswerButtonList.splice(answerIndex, 1);
            }
        }

        setNewlyCreatedAnswers(tempAnswerButtonList);
    };

    //clears the input fields of the addQuestion form
    //cannot however change questionID back to blank or else adding a newly created term as an answer would not work
    //questionID itself will be updated correctly when the addQuestion API request is called
    const resetFields = () => {
        setQuestionText('');
        setFront('');
        setAnswers([]);
        setNewlyCreatedAnswers([]);
        setNewlyCreatedAnswersIDArray([]);
        setSelectedImgFile(new File([], ''));
        setSelectedAudioFile(new File([], ''));
        setType([]);
        setImgLabel('Pick an image for the question');
        setAudioLabel('Pick an audio for the question');
        setSubmittingAnswer(false);
        setUserCreatedAnswer('');

        setValidAnswers();
    };

    return (
        <div>
            <Form onSubmit={(e) => submitQuestion(e)}>
                <input type="hidden" value="prayer" />

                <Alert
                    style={{
                        color: '#004085',
                        backgroundColor: 'lightskyblue',
                        border: 'none',
                    }}
                >
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for="questionText">Question:</Label>

                                <Input
                                    type="text"
                                    name="questionText"
                                    onChange={(e) =>
                                        setQuestionText(e.target.value)
                                    }
                                    value={questionText}
                                    id="questionText"
                                    placeholder="Question"
                                    autoComplete="off"
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Label for="answers">Answers:</Label>

                            <br />

                            <FormGroup width="200%">
                                <Autocomplete
                                    name={'answers'}
                                    id={'answers'}
                                    placeholder={'Answer'}
                                    handleAddAnswer={handleAddAnswer}
                                    createAnswer={createAnswer}
                                    renderButton={true}
                                    autoCompleteStyle={{
                                        borderWidth: '0px',
                                        borderStyle: 'none',
                                        width: '100%',
                                    }}
                                    needID={0}
                                    suggestions={validAnswersState
                                        .map((answer) => {
                                            return {
                                                termID: 0,
                                                tagName: answer.front,
                                            };
                                        })
                                        .concat(
                                            validAnswersState.map((answer) => {
                                                return {
                                                    termID: 0,
                                                    tagName: answer.back,
                                                };
                                            })
                                        )
                                        .filter((answer, i, validAnswers) => {
                                            if (
                                                validAnswers.indexOf(answer) !==
                                                i
                                            ) {
                                                return false;
                                            } else {
                                                return true;
                                            }
                                        })}
                                />
                            </FormGroup>
                        </Col>

                        <Col>
                            <br />
                            <Button onClick={toggleSearchByTagForm}>
                                Search By Tag
                            </Button>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Alert color="warning">
                                <Label> Answers: </Label>
                                <AnswerButtonList
                                    answers={answers.map((answer) => {
                                        return answer.front;
                                    })}
                                    handleDeleteAnswer={handleDeleteAnswer}
                                    deletable={true}
                                />

                                <AnswerButtonList
                                    answers={newlyCreatedAnswers.map(
                                        (answer) => {
                                            return answer.front;
                                        }
                                    )}
                                    handleDeleteAnswer={handleDeleteNewAnswer}
                                    deletable={true}
                                />
                            </Alert>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for="qstImgFile">Image:</Label>

                                <Input
                                    type="file"
                                    accept=".png, .jpg, .jpeg"
                                    id="qstImgFile"
                                    label={imgLabel}
                                    onChange={imgFileChangedHandler}
                                />
                            </FormGroup>
                        </Col>

                        <Col>
                            <FormGroup>
                                <Label for="qstAudioFile">Audio:</Label>

                                <br></br>
                                <div
                                    style={{
                                        paddingBottom: '5px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={start}
                                        disabled={isRecording}
                                        style={{
                                            border: 'none',
                                            margin: '5px',
                                        }}
                                    >
                                        Record
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stop}
                                        disabled={!isRecording}
                                        style={{
                                            border: 'none',
                                            margin: '5px',
                                        }}
                                    >
                                        Stop
                                    </button>

                                    <button
                                        type="button"
                                        onClick={upload}
                                        disabled={disable}
                                        style={{
                                            border: 'none',
                                            margin: '5px',
                                        }}
                                    >
                                        Upload
                                    </button>
                                </div>

                                {didUpload ? (
                                    <div
                                        style={{
                                            color: 'red',
                                            paddingBottom: '5px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            fontSize: '12px',
                                        }}
                                    >
                                        Successfully uploaded recorded audio
                                        file!
                                    </div>
                                ) : (
                                    ''
                                )}

                                <div
                                    style={{
                                        paddingBottom: '5px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <audio src={blobURL} controls={true} />
                                </div>

                                <Input
                                    type="file"
                                    accept=".ogg, .wav, .mp3"
                                    id="qstAudioFile"
                                    label={audioLabel}
                                    onChange={audioFileChangedHandler}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Button
                                style={{
                                    backgroundColor: '#004085',
                                    border: 'none',
                                }}
                                type="submit"
                                block
                            >
                                Create
                            </Button>
                            <Button
                                style={{
                                    backgroundColor: 'steelblue',
                                    border: 'none',
                                }}
                                onClick={() => setOpenForm(0)}
                                block
                            >
                                Cancel
                            </Button>
                        </Col>
                    </Row>
                </Alert>
            </Form>

            {/*TODO: make the screen focus on this after it gets opened*/}
            <Modal isOpen={submittingAnswer}>
                <ModalHeader>Add Answer:</ModalHeader>
                <ModalBody>
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

            <Modal isOpen={searchingByTag}>
                <ModalHeader toggle={toggleSearchByTagForm}>
                    Search By Tag
                </ModalHeader>
                <ModalBody style={{ padding: '0px' }}>
                    <SearchAnswersByTag
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        allAnswers={validAnswersState}
                        handleAddAnswer={handleAddAnswer}
                        toggleSearchByTagForm={toggleSearchByTagForm}
                    ></SearchAnswersByTag>
                </ModalBody>
            </Modal>
        </div>
    );
}
