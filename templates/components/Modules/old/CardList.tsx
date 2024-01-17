import React from 'react';
import { useState, useEffect } from 'react';
import {
    Table,
    Alert,
    Button,
    Form,
    FormGroup,
    Label,
    Input,
} from 'reactstrap';
import axios from 'axios';

import Term from './Term';
import Phrase from './Phrase';
import Question from './Question';
import MentorQuestion from './MentorQuestion';
import { useUser } from '@/hooks/useUser';
import {
    Module,
    ModuleQuestion,
    ModuleQuestionAnswer,
} from '@/types/api/modules';
import { EventType } from '@/types/events';
import { Tag } from '@/types/api/terms';
import {
    MentorQuestionFrequency,
    MentorQuestion as MentorQuestionType,
} from '@/types/api/mentors';
import { LoggedAnswer } from '@/types/api/logged_answer';

const updateMentorFrequency = (
    e: React.FormEvent<HTMLFormElement>,
    curModule: Module,
    updateCurrentModule: (e: EventType) => void,
    jwt?: string
) => {
    e.preventDefault();
    let data = {
        numIncorrectCards: parseInt(e.currentTarget.frequency.value),
        numCorrectCards: parseInt(e.currentTarget.cfrequency.value),
        time: parseInt(e.currentTarget.tfrequency.value),
        module_id: curModule.moduleID,
    };

    let header = {
        headers: { Authorization: 'Bearer ' + jwt },
    };

    axios
        .post('/elleapi/setmentorquestionfrequency', data, header)
        .then((res) => {
            //updateCurrentModule({ module: curModule.moduleID });
        })
        .catch((error) => {
            console.log('updateMentorFrequency error: ', error.response);
        });
};

const updateModuleFrequency = (
    setIFreq: (iFreq: number) => void,
    setCFreq: (iFreq: number) => void,
    setTFreq: (iFreq: number) => void,
    moduleid: number,
    jwt?: string
) => {
    let data = {
        module_id: moduleid,
    };

    let header = {
        headers: { Authorization: 'Bearer ' + jwt },
    };

    axios
        .post('/elleapi/getmentorquestionfrequency', data, header)
        .then((res) => {
            setIFreq(res.data[0].incorrectCardsFreq);
            setCFreq(res.data[0].correctCardsFreq);
            setTFreq(res.data[0].time);
        })
        .catch((error) => {
            console.log('getmentorquestionfrequency error: ', error.response);
        });
};

const CardList = ({
    currentClass,
    cards,
    curModule,
    updateCurrentModule,
    deleteTag,
    addTag,
    allTags,
    freq,
    type,
    allAnswers,
    mentorQuestions,
}: {
    currentClass: { value: number; label: string };
    cards: ModuleQuestionAnswer[] | ModuleQuestion[];
    curModule: Module;
    updateCurrentModule: (event: EventType) => void;
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
    freq: MentorQuestionFrequency[];
    type?: Number;
    allAnswers?: LoggedAnswer[];
    mentorQuestions?: MentorQuestionType[];
}) => {
    const { user } = useUser();
    const isQuestion = (cards[0] as ModuleQuestionAnswer).termID !== undefined;
    const [iFreq, setIFreq] = useState(freq[0].incorrectCardsFreq);
    const [cFreq, setCFreq] = useState(freq[0].correctCardsFreq);
    const [tFreq, setTFreq] = useState(freq[0].time);
    //-1 is the default value for all of these, since things are loaded asynchronously and idk how to handle that
    //i just check to see if it's still the default invalid value and update if it's not
    if (iFreq == -1 && freq[0].incorrectCardsFreq != -1) {
        setIFreq(freq[0].incorrectCardsFreq);
    }
    if (cFreq == -1 && freq[0].correctCardsFreq != -1) {
        setCFreq(freq[0].correctCardsFreq);
    }
    if (tFreq == -1 && freq[0].time != -1) {
        setTFreq(freq[0].time);
    }
    const [moduleid, setModuleid] = useState(curModule.moduleID);
    const removeDuplicates = () => {
        if (isQuestion) return [];
        let idList: number[] = [];
        let filteredList: ModuleQuestionAnswer[] = [];

        (cards as ModuleQuestionAnswer[]).map((card) => {
            if (idList.indexOf(card.termID) === -1) {
                idList.push(card.termID);
                filteredList.push(card);
            }
        });
        return filteredList;
    };

    //if the module has changed, change the frequency
    if (type === 3 && curModule.moduleID != moduleid) {
        updateModuleFrequency(
            setIFreq,
            setCFreq,
            setTFreq,
            curModule.moduleID,
            user?.jwt
        );
        setModuleid(curModule.moduleID);
    }

    let list = removeDuplicates();
    let len = list.length;

    if (type === 0) {
        return (
            <div>
                {len === 0 ? (
                    <Alert>
                        {' '}
                        There are currently no terms in this module.{' '}
                    </Alert>
                ) : (
                    <Table hover className="tableList">
                        <thead>
                            <tr>
                                <th style={{ width: '32%' }}>English</th>
                                <th style={{ width: '32%' }}>Translated</th>
                                <th style={{ width: '12%' }}>Type</th>
                                <th style={{ width: '12%' }}>Gender</th>
                                <th style={{ width: '12%' }}>Picture</th>
                                <th style={{ width: '12%' }}>Audio</th>
                                {user?.permissionGroup !== 'st' ? (
                                    <th style={{ width: '32%' }}> </th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((card) => {
                                return (
                                    <Term
                                        key={card.termID}
                                        card={card}
                                        currentClass={currentClass}
                                        curModule={curModule}
                                        updateCurrentModule={
                                            updateCurrentModule
                                        }
                                        deleteTag={deleteTag}
                                        addTag={addTag}
                                        allTags={allTags}
                                    />
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </div>
        );
    } else if (type === 1) {
        return (
            <div>
                {len === 0 ? (
                    <Alert>
                        {' '}
                        There are currently no phrases in this module.{' '}
                    </Alert>
                ) : (
                    <Table hover className="tableList">
                        <thead>
                            <tr>
                                <th style={{ width: '32%' }}>
                                    Phrase (English)
                                </th>
                                <th style={{ width: '32%' }}>
                                    Phrase (Translated)
                                </th>
                                <th style={{ width: '12%' }}>Picture</th>
                                <th style={{ width: '12%' }}>Audio</th>
                                {user?.permissionGroup !== 'st' ? (
                                    <th style={{ width: '32%' }}> </th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((card) => {
                                return (
                                    <Phrase
                                        key={card.termID}
                                        card={card}
                                        currentClass={currentClass}
                                        curModule={curModule}
                                        updateCurrentModule={
                                            updateCurrentModule
                                        }
                                    />
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </div>
        );
    } else if (type === 2) {
        return (
            <div>
                {cards.length === 0 ? (
                    <Alert>
                        {' '}
                        There are currently no questions in this module.{' '}
                    </Alert>
                ) : (
                    <Table hover className="tableList">
                        <thead>
                            <tr>
                                <th style={{ width: '64%' }}>Question</th>
                                <th style={{ width: '9%' }}>Picture</th>
                                <th style={{ width: '9%' }}>Audio</th>
                                {user?.permissionGroup !== 'st' ? (
                                    <th style={{ width: '9%' }}> </th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            {(cards as ModuleQuestion[]).map((card) => {
                                return (
                                    <Question
                                        key={card.questionID}
                                        question={card}
                                        currentClass={currentClass}
                                        curModule={curModule}
                                        updateCurrentModule={
                                            updateCurrentModule
                                        }
                                        allAnswers={allAnswers || []}
                                        deleteTag={deleteTag}
                                        addTag={addTag}
                                        allTags={allTags}
                                    />
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </div>
        );
    } else if (type === 3) {
        return (
            <div>
                {mentorQuestions?.length === 0 ? (
                    <Alert>
                        {' '}
                        There are currently no mentor questions in this module.{' '}
                    </Alert>
                ) : (
                    <div>
                        <br />
                        <h3>Mentor Question Frequency</h3>
                        <br />
                        <Form
                            onSubmit={(e) =>
                                updateMentorFrequency(
                                    e,
                                    curModule,
                                    updateCurrentModule,
                                    user?.jwt
                                )
                            }
                        >
                            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                <Label for="cfrequency" className="mr-sm-2">
                                    <b>Every X cards correctly matched:</b>
                                </Label>
                                {cFreq == undefined || cFreq <= 0 ? (
                                    <Input
                                        invalid
                                        placeholder="Enter a number"
                                        type="number"
                                        min="1"
                                        name="cfrequency"
                                        id="cfrequency"
                                        value={cFreq}
                                        onChange={(e) =>
                                            setCFreq(parseInt(e.target.value))
                                        }
                                    />
                                ) : (
                                    <Input
                                        type="number"
                                        min="1"
                                        name="cfrequency"
                                        id="cfrequency"
                                        value={cFreq}
                                        onChange={(e) =>
                                            setCFreq(parseInt(e.target.value))
                                        }
                                    />
                                )}
                            </FormGroup>
                            <br />
                            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                <Label for="frequency" className="mr-sm-2">
                                    <b>Every X cards incorrectly matched:</b>
                                </Label>
                                {iFreq == undefined || iFreq <= 0 ? (
                                    <Input
                                        invalid
                                        placeholder="Enter a number"
                                        type="number"
                                        min="1"
                                        name="frequency"
                                        id="frequency"
                                        value={iFreq}
                                        onChange={(e) =>
                                            setIFreq(parseInt(e.target.value))
                                        }
                                    />
                                ) : (
                                    <Input
                                        type="number"
                                        min="1"
                                        name="frequency"
                                        id="frequency"
                                        value={iFreq}
                                        onChange={(e) =>
                                            setIFreq(parseInt(e.target.value))
                                        }
                                    />
                                )}
                            </FormGroup>
                            <br />
                            <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                <Label for="tfrequency" className="mr-sm-2">
                                    <b>Every X seconds:</b>
                                </Label>
                                {tFreq == undefined || tFreq <= 0 ? (
                                    <Input
                                        invalid
                                        placeholder="Enter a number"
                                        type="number"
                                        min="1"
                                        name="tfrequency"
                                        id="tfrequency"
                                        value={tFreq}
                                        onChange={(e) =>
                                            setTFreq(parseInt(e.target.value))
                                        }
                                    />
                                ) : (
                                    <Input
                                        type="number"
                                        min="1"
                                        name="tfrequency"
                                        id="tfrequency"
                                        value={tFreq}
                                        onChange={(e) =>
                                            setTFreq(parseInt(e.target.value))
                                        }
                                    />
                                )}
                            </FormGroup>
                            <br />
                            {cFreq == undefined ||
                            iFreq == undefined ||
                            tFreq == undefined ? (
                                <Button disabled>
                                    Submit (no empty fields){' '}
                                </Button>
                            ) : cFreq <= 0 || iFreq <= 0 || tFreq <= 0 ? (
                                <Button disabled>
                                    Submit (fields must be greater than 0){' '}
                                </Button>
                            ) : (
                                <Button>Submit</Button>
                            )}
                        </Form>
                        <br />
                        <Table hover className="tableList">
                            <thead>
                                <tr>
                                    <th style={{ width: '64%' }}>Question</th>
                                    {user?.permissionGroup !== 'st' ? (
                                        <th style={{ width: '9%' }}> </th>
                                    ) : null}
                                </tr>
                            </thead>
                            <tbody>
                                {mentorQuestions?.map((question) => {
                                    return (
                                        <MentorQuestion
                                            key={question.questionID}
                                            question={question}
                                            curModule={curModule}
                                            updateCurrentModule={
                                                updateCurrentModule
                                            }
                                        />
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                )}
            </div>
        );
    }
};

export default CardList;
