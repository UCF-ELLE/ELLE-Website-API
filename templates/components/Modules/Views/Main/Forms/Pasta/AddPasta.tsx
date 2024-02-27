import React, { createRef, useState } from 'react';
import { Alert, Badge, Button, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';

import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';
import { QuestionFrame } from '@/types/api/pastagame';
import { Typeahead, TypeaheadRef } from 'react-bootstrap-typeahead';
import { SplitComponent } from './SplitComponent';
import axios from 'axios';

export default function AddPasta({
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

    const [utterance, setUtterance] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [selectedQuestionFrame, setSelectedQuestionFrame] = useState<QuestionFrame>();
    const [splitQuestionAnswer, setSplitQuestionAnswer] = useState<number[]>([]);
    const [identifyQuestionAnswer, setIdentityQuestionAnswer] = useState<Number[]>([]);
    const [mc1Answer, setMC1Answer] = useState<Number>(-1);
    const [mc2Answer, setMC2Answer] = useState<Number>(-1);
    const [error, setError] = useState<boolean>(false);
    const [errMsg, setErrMsg] = useState<string>('');

    const ref = createRef<TypeaheadRef>();

    //function that submits the data

    const validateButton = () => {
        return (
            utterance &&
            category &&
            splitQuestionAnswer.length > 0 &&
            selectedQuestionFrame &&
            (selectedQuestionFrame.identifyQuestionVar ? identifyQuestionAnswer.length > 0 : true) &&
            (selectedQuestionFrame.mc1Options ? mc1Answer !== -1 : selectedQuestionFrame.mc2Options ? mc2Answer !== -1 : true)
        );
    };

    const validateForm = () => {
        let noError = false;
        if (!validateButton()) {
            setError(true);
            setErrMsg('Please fill out all fields.');
            noError = true;
        }
        return noError;
    };

    const submitPasta = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const invalid = validateForm();
        if (invalid) return;

        const data = new FormData();
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        data.append('moduleID', curModule.moduleID.toString());
        data.append('utterance', utterance);
        data.append('category', category);
        data.append('splitAnswer', JSON.stringify(splitQuestionAnswer));
        if (selectedQuestionFrame?.identifyQuestionVar) {
            data.append('identifyAnswer', JSON.stringify(identifyQuestionAnswer));
        }
        if (selectedQuestionFrame?.mc1Options) {
            data.append('mc1Answer', mc1Answer.toString());
        }
        if (selectedQuestionFrame?.mc2Options) {
            data.append('mc2Answer', mc2Answer.toString());
        }

        axios
            .post('/elleapi/pastagame/pasta', data, header)
            .then((res) => {
                updateCurrentModule(curModule);
                resetFields();
            })
            .catch((error) => {
                console.log('create pasta error: ', error.response);
                if (error.response.data?.message) {
                    setError(true);
                    setErrMsg(error.response.data.message);
                }
            });
    };

    const resetFields = () => {
        setCategory('');
        setUtterance('');
        setSplitQuestionAnswer([]);
        setIdentityQuestionAnswer([]);
        setMC1Answer(-1);
        setMC2Answer(-1);
    };

    const selectCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Select the category from the list of question frames
        const category = e.target.value;
        setCategory(category);
        const frame = questionFrames.filter((frame) => frame.category === category)[0];
        setSelectedQuestionFrame(frame);
    };

    const selectUtterance = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUtterance(e.target.value);
        setSplitQuestionAnswer([]);
        setIdentityQuestionAnswer([]);
        if (ref.current) ref.current.clear();
    };

    const selectSplitAnswer = (indexes: number[]) => {
        setSplitQuestionAnswer(indexes);
        setIdentityQuestionAnswer([]);
        if (ref.current) ref.current.clear();
    };

    const createIdentityAnswerList = () => {
        const list = splitQuestionAnswer.map((val, index) => {
            return {
                label: utterance.substring(index === 0 ? 0 : splitQuestionAnswer[index - 1], val),
                value: index
            };
        });
        list.push({
            label: utterance.substring(splitQuestionAnswer[splitQuestionAnswer.length - 1]),
            value: splitQuestionAnswer.length
        });
        return list;
    };

    const createFields = () => {
        return (
            <div>
                {selectedQuestionFrame?.identifyQuestionVar && splitQuestionAnswer.length > 0 ? (
                    <FormGroup>
                        <Label for='selectIdentityAnswer'>
                            Identify <Badge>{selectedQuestionFrame.identifyQuestionVar}</Badge> of this <Badge>{category}</Badge>
                        </Label>
                        {/* Typeahead to include all of the possible split utterances, multiple selected */}
                        <Typeahead
                            id='selectIdentityAnswer'
                            ref={ref}
                            multiple
                            // Return the substring between the previous index and the current index for options
                            options={createIdentityAnswerList()}
                            placeholder='Select the correct split utterance'
                            onChange={(selected) => {
                                const tempList: number[] = [];
                                for (let index of selected) {
                                    if (typeof index === 'object') tempList.push(index.value);
                                    else if (typeof index === 'number') tempList.push(index);
                                }
                                tempList.sort((a, b) => a - b);
                                setIdentityQuestionAnswer(tempList);
                            }}
                        />
                    </FormGroup>
                ) : null}
                {selectedQuestionFrame?.mc1Options && selectedQuestionFrame.mc1Options?.length > 0 ? (
                    <FormGroup>
                        <Label for='selectMC1Answer'>{selectedQuestionFrame.mc1QuestionText}</Label>
                        <Input
                            type='select'
                            name='selectMC1Answer'
                            id='selectMC1Answer'
                            value={mc1Answer.toString()}
                            onChange={(e) => setMC1Answer(Number(e.target.value))}
                        >
                            {selectedQuestionFrame.mc1Options.map((leadup, index) => (
                                <option key={index} value={index}>
                                    {leadup}
                                </option>
                            ))}
                        </Input>
                    </FormGroup>
                ) : null}
                {selectedQuestionFrame?.mc2Options && selectedQuestionFrame.mc2Options?.length > 0 ? (
                    <FormGroup>
                        <Label for='selectMC2Answer'>{selectedQuestionFrame.mc2QuestionText}</Label>
                        <Input
                            type='select'
                            name='selectMC2Answer'
                            id='selectMC2Answer'
                            value={mc2Answer.toString()}
                            onChange={(e) => setMC2Answer(Number(e.target.value))}
                        >
                            {selectedQuestionFrame.mc2Options.map((leadup, index) => (
                                <option key={index} value={index}>
                                    {leadup}
                                </option>
                            ))}
                        </Input>
                    </FormGroup>
                ) : null}
            </div>
        );
    };

    return (
        <div>
            <Form onSubmit={(e) => submitPasta(e)}>
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
                                <Label for='utterance'>Utterance:</Label>

                                <Input
                                    type='text'
                                    name='utterance'
                                    onChange={(e) => selectUtterance(e)}
                                    value={utterance}
                                    id='utterance'
                                    placeholder='Indistinquisable'
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            {questionFrames.length > 0 ? (
                                <FormGroup>
                                    <Label for='selectCategory'>Category:</Label>

                                    <Input
                                        type='select'
                                        name='selectCategory'
                                        id='selectCategory'
                                        value={category}
                                        onChange={(e) => selectCategory(e)}
                                    >
                                        <option disabled value=''>
                                            Select a category
                                        </option>
                                        {questionFrames.map((frame) => (
                                            <option key={frame.category} value={frame.category}>
                                                {frame.category}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            ) : (
                                // If there are no question frames, display a message to create one first
                                <p style={{ color: 'red', fontWeight: 700 }}>Please create a question frame first.</p>
                            )}
                        </Col>
                    </Row>
                    <Row>
                        <Col
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: '12px'
                            }}
                        >
                            {category && utterance ? (
                                <>
                                    <div style={{ marginBottom: 8 }}>
                                        {' '}
                                        Split the <Badge>{category}</Badge> by its <Badge>{selectedQuestionFrame?.splitQuestionVar}</Badge>
                                    </div>
                                    <SplitComponent
                                        text={utterance}
                                        indexes={splitQuestionAnswer}
                                        setIndexes={selectSplitAnswer}
                                        dotSize={8}
                                        fontSize={20}
                                    />
                                </>
                            ) : (
                                <p>Please set the utterance.</p>
                            )}
                        </Col>
                    </Row>
                    <Row>
                        <Col>{selectedQuestionFrame ? createFields() : null}</Col>
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
                                disabled={!validateButton()}
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
