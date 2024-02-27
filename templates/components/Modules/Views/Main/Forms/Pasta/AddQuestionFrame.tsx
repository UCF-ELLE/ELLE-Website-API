import React, { useState } from 'react';
import { Alert, Badge, Button, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';

import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';
import { QuestionFrame } from '@/types/api/pastagame';
import { Tag } from '@/types/api/terms';
import { IdentityQuestionForm, MultipleChoiceQuestionForm } from './MiniForms';
import axios from 'axios';

export default function AddQuestionFrame({
    curModule,
    questionFrames,
    updateCurrentModule,
    setOpenForm
}: {
    curModule: Module;
    questionFrames: QuestionFrame[];
    updateCurrentModule: (module: Module, task?: string) => void;
    setOpenForm: (form: number) => void;
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    const [displayName, setDisplayName] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [splitQuestionVar, setSplitQuestionVar] = useState<string>('');
    const [identityQuestionOut, setIdentityQuestionOut] = useState<boolean>(false);
    const [identifyQuestionVar, setIdentifyQuestionVar] = useState<string>('');
    const [questionOneOut, setQuestionOneOut] = useState<boolean>(false);
    const [mc1QuestionText, setMc1QuestionText] = useState<string>('');
    const [mc1Options, setMc1Options] = useState<string[]>(['', '']);
    const [questionTwoOut, setQuestionTwoOut] = useState<boolean>(false);
    const [mc2QuestionText, setMc2QuestionText] = useState<string>('');
    const [mc2Options, setMc2Options] = useState<string[]>(['', '']);
    const [error, setError] = useState<boolean>(false);
    const [errMsg, setErrMsg] = useState<string>('');

    //function that submits the data

    const requiredFieldsButtonValidate = () => {
        if (displayName === '' || category === '' || splitQuestionVar === '') {
            return true;
        }
        return false;
    };

    const validateForm = () => {
        // Make sure that the display name, category, and split leadup are filled out
        let noError = false;
        if (requiredFieldsButtonValidate()) {
            setError(true);
            setErrMsg('Please fill out the display name, category, and split question variable.');
            noError = true;
        }
        if (questionFrames.filter((frame) => frame.category === category).length > 0) {
            setError(true);
            setErrMsg('A question frame with the same category already exists.');
            noError = true;
        }
        if (identityQuestionOut && identifyQuestionVar === '') {
            setError(true);
            setErrMsg('Please fill out the identity question or delete it.');
            noError = true;
        }
        if (questionOneOut && (mc1QuestionText === '' || mc1Options.includes(''))) {
            setError(true);
            setErrMsg('Please fill out all fields for the multiple choice questions or delete them.');
            noError = true;
        }
        if (questionTwoOut && (mc2QuestionText === '' || mc2Options.includes(''))) {
            setError(true);
            setErrMsg('Please fill out all fields for the multiple choice questions or delete them.');
            noError = true;
        }
        return noError;
    };

    const submitQuestionFrame = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const invalid = validateForm();
        if (invalid) return;

        const data = new FormData();
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        data.append('displayName', displayName);
        data.append('moduleID', curModule.moduleID.toString());
        data.append('category', category);
        data.append('splitQuestionVar', splitQuestionVar);

        if (identityQuestionOut) {
            data.append('identityLeadup', identifyQuestionVar);
        }

        if (questionOneOut) {
            data.append('mc1QuestionText', mc1QuestionText);
            data.append('mc1Options', JSON.stringify(mc1Options));
        }

        if (questionTwoOut) {
            data.append('mc2QuestionText', mc2QuestionText);
            data.append('mc2Options', JSON.stringify(mc2Options));
        }

        axios
            .post('/elleapi/pastagame/frame', data, header)
            .then((res) => {
                updateCurrentModule(curModule);
                resetFields();
            })
            .catch((error) => {
                console.log('create question frame error: ', error.response);
                if (error.response) {
                    setError(true);
                    setErrMsg(error.response.data);
                }
            });
    };

    const resetFields = () => {
        setDisplayName('');
        setCategory('');
        setSplitQuestionVar('');
        setError(false);
        setErrMsg('');
    };

    const toggleIdentityQuestion = () => {
        if (identityQuestionOut) {
            setIdentifyQuestionVar('');
        }
        setIdentityQuestionOut(!identityQuestionOut);
    };

    const createMultipleChoiceQuestion = () => {
        // Set questionOneOut to true if it is false, otherwise, set questionTwoOut to true. Otherwise, clear questionOne's fields and set it to false.
        if (!questionOneOut) {
            setQuestionOneOut(true);
        } else if (!questionTwoOut) {
            setQuestionTwoOut(true);
        }
    };

    const toggleMultipleChoiceQuestion = (question: Number) => {
        if (question === 1) {
            if (questionOneOut) {
                setMc1QuestionText('');
                setMc1Options(['', '']);
            }
            setQuestionOneOut(!questionOneOut);
        } else {
            if (questionTwoOut) {
                setMc2QuestionText('');
                setMc2Options(['', '']);
            }
            setQuestionTwoOut(!questionTwoOut);
        }
    };

    return (
        <div>
            <Form onSubmit={(e) => submitQuestionFrame(e)}>
                <input type='hidden' value='prayer' />
                {error ? <Alert color='danger'>{errMsg}</Alert> : null}
                <Alert
                    style={{
                        color: '#004085',
                        backgroundColor: 'lightskyblue',
                        border: 'none'
                    }}
                >
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='displayName'>Display Name:</Label>

                                <Input
                                    type='text'
                                    name='displayName'
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    value={displayName}
                                    id='displayName'
                                    placeholder='Question Set'
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='selectCategory'>Category:</Label>

                                <Input
                                    type='text'
                                    name='category'
                                    onChange={(e) => setCategory(e.target.value)}
                                    value={category}
                                    id='category'
                                    placeholder='word'
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>

                        <Col>
                            <FormGroup>
                                <Label for='splitLeadup'>Split Leadup:</Label>

                                <Input
                                    type='text'
                                    name='splitLeadup'
                                    onChange={(e) => setSplitQuestionVar(e.target.value)}
                                    value={splitQuestionVar}
                                    id='splitLeadup'
                                    placeholder='morphemes'
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <p className='mb-3'>Example Split Question Text:</p>
                        </Col>
                        <Col>
                            Split the <Badge>{category !== '' ? category : 'word'}</Badge> by its{' '}
                            <Badge>{splitQuestionVar !== '' ? splitQuestionVar : 'morphemes'}</Badge>.
                        </Col>
                    </Row>
                    <IdentityQuestionForm
                        isOpen={identityQuestionOut}
                        leadup={identifyQuestionVar}
                        setLeadup={setIdentifyQuestionVar}
                        deleteIdentityQuestion={toggleIdentityQuestion}
                        category={category}
                    />
                    <MultipleChoiceQuestionForm
                        isOpen={questionOneOut}
                        questionText={mc1QuestionText}
                        setQuestionText={setMc1QuestionText}
                        answers={mc1Options}
                        setAnswers={setMc1Options}
                        deleteMultipleChoiceQuestion={() => toggleMultipleChoiceQuestion(1)}
                    />
                    <MultipleChoiceQuestionForm
                        isOpen={questionTwoOut}
                        questionText={mc2QuestionText}
                        setQuestionText={setMc2QuestionText}
                        answers={mc2Options}
                        setAnswers={setMc2Options}
                        deleteMultipleChoiceQuestion={() => toggleMultipleChoiceQuestion(2)}
                    />
                    <Row className='mb-3'>
                        <Col
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 12
                            }}
                        >
                            {!identityQuestionOut ? (
                                <Button
                                    style={{
                                        backgroundColor: 'steelblue',
                                        border: 'none'
                                    }}
                                    onClick={() => toggleIdentityQuestion()}
                                >
                                    Create Identity Question
                                </Button>
                            ) : null}
                            {!questionOneOut || !questionTwoOut ? (
                                <Button
                                    style={{
                                        backgroundColor: 'steelblue',
                                        border: 'none'
                                    }}
                                    onClick={() => createMultipleChoiceQuestion()}
                                >
                                    Create Multiple Choice Question
                                </Button>
                            ) : null}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Button
                                style={{
                                    backgroundColor: 'rgb(0, 64, 133)',
                                    border: 'none'
                                }}
                                type='submit'
                                block
                                disabled={requiredFieldsButtonValidate()}
                            >
                                Create
                            </Button>
                            <Button
                                style={{
                                    backgroundColor: 'steelblue',
                                    border: 'none'
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
        </div>
    );
}
