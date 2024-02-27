import { useUser } from '@/hooks/useUser';
import { MentorQuestionFrequency, MentorQuestion as MentorQuestionType } from '@/types/api/mentors';
import { Module, ModuleQuestion, ModuleQuestionAnswer } from '@/types/api/modules';
import { Tag } from '@/types/api/terms';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { Alert, Button, Form, FormGroup, Input, Label, Table } from 'reactstrap';
import MentorQuestion from './MentorQuestion';
import Phrase from './Phrase';
import Question from './Question';
import Term from './Term';

export default function CardList({
    type,
    cards,
    currentClass,
    curModule,
    updateCurrentModule,
    addTag,
    deleteTag,
    allTags,
    allAnswers,
    frequency,
    mentorQuestions
}: {
    type: string;
    cards: ModuleQuestion[] | ModuleQuestionAnswer[];
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (module?: Module, task?: string) => void;
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
    allAnswers?: ModuleQuestionAnswer[];
    frequency: Omit<MentorQuestionFrequency, 'moduleID'>[];
    mentorQuestions?: MentorQuestionType[];
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;
    const [freq, setFreq] = useState(frequency[0]?.incorrectCardsFreq ? frequency[0].incorrectCardsFreq : -1);
    const [cfreq, setcFreq] = useState(frequency[0]?.correctCardsFreq ? frequency[0].correctCardsFreq : -1);
    const [tfreq, settFreq] = useState(frequency[0]?.time ? frequency[0].time : -1);
    const [moduleid, setModuleid] = useState(curModule.moduleID);

    const removeDuplicates = () => {
        const idList: number[] = [];
        const filteredList: ModuleQuestion[] | ModuleQuestionAnswer[] = [];

        if (cards.length === 0) return [];

        'termID' in cards[0]
            ? (cards as ModuleQuestionAnswer[]).map((card) => {
                  if (!idList.includes(card.termID)) {
                      idList.push(card.termID);
                      (filteredList as ModuleQuestionAnswer[]).push(card);
                  }
              })
            : (cards as ModuleQuestion[]).map((card) => {
                  if (!idList.includes(card.questionID)) {
                      idList.push(card.questionID);
                      (filteredList as ModuleQuestion[]).push(card);
                  }
              });

        return filteredList;
    };

    const updateMentorFrequency = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let data = {
            numIncorrectCards: parseInt(e.currentTarget.frequency.value),
            numCorrectCards: parseInt(e.currentTarget.cfrequency.value),
            time: parseInt(e.currentTarget.tfrequency.value),
            module_id: curModule.moduleID
        };

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post('/elleapi/setmentorquestionfrequency', data, header)
            .then((res) => {
                //updateCurrentModule(curModule.moduleID);
            })
            .catch((error) => {
                console.log('updateMentorFrequency error: ', error.response);
            });
    };

    const updateModuleFrequency = (moduleid: number) => {
        let data = {
            module_id: moduleid
        };

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post('/elleapi/getmentorquestionfrequency', data, header)
            .then((res) => {
                setFreq(res.data[0].incorrectCardsFreq);
                setcFreq(res.data[0].correctCardsFreq);
                settFreq(res.data[0].time);
            })
            .catch((error) => {
                console.log('getmentorquestionfrequency error: ', error.response);
            });
    };

    const HeadRow = useMemo(() => {
        switch (type) {
            case 'terms':
                return (
                    <thead>
                        <tr>
                            <th style={{ width: '32%' }}>English</th>
                            <th style={{ width: '32%' }}>Translated</th>
                            <th style={{ width: '12%' }}>Type</th>
                            <th style={{ width: '12%' }}>Gender</th>
                            <th style={{ width: '12%' }}>Picture</th>
                            <th style={{ width: '12%' }}>Audio</th>
                            {permissionLevel !== 'st' ? <th style={{ width: '32%' }}> </th> : null}
                        </tr>
                    </thead>
                );
            case 'phrases':
                return (
                    <thead>
                        <tr>
                            <th style={{ width: '32%' }}>Phrase (English)</th>
                            <th style={{ width: '32%' }}>Phrase (Translated)</th>
                            <th style={{ width: '12%' }}>Picture</th>
                            <th style={{ width: '12%' }}>Audio</th>
                            {permissionLevel !== 'st' ? <th style={{ width: '32%' }}> </th> : null}
                        </tr>
                    </thead>
                );
            case 'questions':
                <thead>
                    <tr>
                        <th style={{ width: '64%' }}>Question</th>
                        <th style={{ width: '9%' }}>Picture</th>
                        <th style={{ width: '9%' }}>Audio</th>
                        {permissionLevel !== 'st' ? <th style={{ width: '9%' }}> </th> : null}
                    </tr>
                </thead>;
            default:
                return <></>;
        }
    }, [permissionLevel, type]);

    if (type === 'mentorQuestions' && moduleid !== curModule.moduleID) {
        updateModuleFrequency(curModule.moduleID);
        setModuleid(curModule.moduleID);
    }

    const list = removeDuplicates();
    const len = list.length;

    return (
        <>
            {type === 'terms' && (
                <TermCardList
                    list={list as ModuleQuestionAnswer[]}
                    len={len}
                    currentClass={currentClass}
                    curModule={curModule}
                    updateCurrentModule={updateCurrentModule}
                    deleteTag={deleteTag}
                    addTag={addTag}
                    allTags={allTags}
                    HeadRow={HeadRow}
                />
            )}
            {type === 'phrases' && (
                <PhraseCardList
                    list={list as ModuleQuestionAnswer[]}
                    len={len}
                    currentClass={currentClass}
                    curModule={curModule}
                    updateCurrentModule={updateCurrentModule}
                    HeadRow={HeadRow}
                />
            )}
            {type === 'questions' && (
                <QuestionCardList
                    cards={cards as ModuleQuestion[]}
                    list={cards as ModuleQuestion[]}
                    currentClass={currentClass}
                    curModule={curModule}
                    updateCurrentModule={updateCurrentModule}
                    deleteTag={deleteTag}
                    addTag={addTag}
                    allTags={allTags}
                    allAnswers={allAnswers as ModuleQuestionAnswer[]}
                    HeadRow={HeadRow}
                />
            )}
            {type === 'mentorQuestions' && permissionLevel && (
                <MentorQuestionCardList
                    mentorQuestions={mentorQuestions as MentorQuestionType[]}
                    curModule={curModule}
                    updateCurrentModule={updateCurrentModule}
                    cfreq={cfreq}
                    setcFreq={setcFreq}
                    freq={freq}
                    setFreq={setFreq}
                    tfreq={tfreq}
                    settFreq={settFreq}
                    updateMentorFrequency={updateMentorFrequency}
                    permissionLevel={permissionLevel}
                />
            )}
        </>
    );
}

function TermCardList({
    list,
    len,
    currentClass,
    curModule,
    updateCurrentModule,
    deleteTag,
    addTag,
    allTags,
    HeadRow
}: {
    list: ModuleQuestionAnswer[];
    len: number;
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (module?: Module, task?: string) => void;
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
    HeadRow: JSX.Element;
}) {
    return (
        <div>
            {len === 0 ? (
                <Alert> There are currently no terms in this module. </Alert>
            ) : (
                <Table hover className='tableList'>
                    {HeadRow}
                    <tbody>
                        {(list as ModuleQuestionAnswer[]).map((card) => {
                            return (
                                <Term
                                    key={card.termID}
                                    card={card}
                                    currentClass={currentClass}
                                    curModule={curModule}
                                    updateCurrentModule={updateCurrentModule}
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
}

function PhraseCardList({
    list,
    len,
    currentClass,
    curModule,
    updateCurrentModule,
    HeadRow
}: {
    list: ModuleQuestionAnswer[];
    len: number;
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (module?: Module, task?: string) => void;
    HeadRow: JSX.Element;
}) {
    return (
        <div>
            {len === 0 ? (
                <Alert> There are currently no phrases in this module. </Alert>
            ) : (
                <Table hover className='tableList'>
                    {HeadRow}
                    <tbody>
                        {(list as ModuleQuestionAnswer[]).map((card) => {
                            return (
                                <Phrase
                                    key={card.termID}
                                    card={card}
                                    currentClass={currentClass}
                                    curModule={curModule}
                                    updateCurrentModule={updateCurrentModule}
                                />
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </div>
    );
}

function QuestionCardList({
    cards,
    list,
    currentClass,
    curModule,
    updateCurrentModule,
    deleteTag,
    addTag,
    allTags,
    allAnswers,
    HeadRow
}: {
    cards: ModuleQuestion[];
    list: ModuleQuestion[];
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (module?: Module, task?: string) => void;
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
    allAnswers: ModuleQuestionAnswer[];
    HeadRow: JSX.Element;
}) {
    return (
        <div>
            {cards.length === 0 ? (
                <Alert> There are currently no questions in this module. </Alert>
            ) : (
                <Table hover className='tableList'>
                    {HeadRow}
                    <tbody>
                        {list.map((card) => {
                            return (
                                <Question
                                    key={card.questionID}
                                    question={card}
                                    currentClass={currentClass}
                                    curModule={curModule}
                                    updateCurrentModule={updateCurrentModule}
                                    deleteTag={deleteTag}
                                    addTag={addTag}
                                    allAnswers={allAnswers as ModuleQuestionAnswer[]}
                                    allTags={allTags}
                                />
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </div>
    );
}

function MentorQuestionCardList({
    mentorQuestions,
    curModule,
    updateCurrentModule,
    cfreq,
    setcFreq,
    freq,
    setFreq,
    tfreq,
    settFreq,
    updateMentorFrequency,
    permissionLevel
}: {
    mentorQuestions: MentorQuestionType[];
    curModule: Module;
    updateCurrentModule: (module?: Module, task?: string) => void;
    cfreq: number;
    setcFreq: (cfreq: number) => void;
    freq: number;
    setFreq: (freq: number) => void;
    tfreq: number;
    settFreq: (tfreq: number) => void;
    updateMentorFrequency: (e: React.FormEvent<HTMLFormElement>) => void;
    permissionLevel: string;
}) {
    return (
        <div>
            {mentorQuestions?.length === 0 ? (
                <Alert> There are currently no mentor questions in this module. </Alert>
            ) : (
                <div>
                    <br />
                    <h3>Mentor Question Frequency</h3>
                    <br />
                    <Form onSubmit={(e) => updateMentorFrequency(e)}>
                        <FormGroup className='mb-2 mr-sm-2 mb-sm-0'>
                            <Label for='cfrequency' className='mr-sm-2'>
                                <b>Every X cards correctly matched:</b>
                            </Label>
                            {cfreq <= 0 ? (
                                <Input
                                    invalid
                                    placeholder='Enter a number'
                                    type='number'
                                    min='1'
                                    name='cfrequency'
                                    id='cfrequency'
                                    value={cfreq || 1}
                                    onChange={(e) => setcFreq(parseInt(e.target.value))}
                                />
                            ) : (
                                <Input
                                    type='number'
                                    min='1'
                                    name='cfrequency'
                                    id='cfrequency'
                                    value={cfreq || 1}
                                    onChange={(e) => setcFreq(parseInt(e.target.value))}
                                />
                            )}
                        </FormGroup>
                        <br />
                        <FormGroup className='mb-2 mr-sm-2 mb-sm-0'>
                            <Label for='frequency' className='mr-sm-2'>
                                <b>Every X cards incorrectly matched:</b>
                            </Label>
                            {freq <= 0 ? (
                                <Input
                                    invalid
                                    placeholder='Enter a number'
                                    type='number'
                                    min='1'
                                    name='frequency'
                                    id='frequency'
                                    value={freq || 1}
                                    onChange={(e) => setFreq(parseInt(e.target.value))}
                                />
                            ) : (
                                <Input
                                    type='number'
                                    min='1'
                                    name='frequency'
                                    id='frequency'
                                    value={freq || 1}
                                    onChange={(e) => setFreq(parseInt(e.target.value))}
                                />
                            )}
                        </FormGroup>
                        <br />
                        <FormGroup className='mb-2 mr-sm-2 mb-sm-0'>
                            <Label for='tfrequency' className='mr-sm-2'>
                                <b>Every X seconds:</b>
                            </Label>
                            {tfreq <= 0 ? (
                                <Input
                                    invalid
                                    placeholder='Enter a number'
                                    type='number'
                                    min='1'
                                    name='tfrequency'
                                    id='tfrequency'
                                    value={tfreq || 1}
                                    onChange={(e) => settFreq(parseInt(e.target.value))}
                                />
                            ) : (
                                <Input
                                    type='number'
                                    min='1'
                                    name='tfrequency'
                                    id='tfrequency'
                                    value={tfreq || 1}
                                    onChange={(e) => settFreq(parseInt(e.target.value))}
                                />
                            )}
                        </FormGroup>
                        <br />
                        {cfreq <= 0 || freq <= 0 || tfreq <= 0 ? (
                            <Button disabled>Submit (fields must be greater than 0) </Button>
                        ) : (
                            <Button>Submit</Button>
                        )}
                    </Form>
                    <br />
                    <Table hover className='tableList'>
                        <thead>
                            <tr>
                                <th style={{ width: '64%' }}>Question</th>
                                {permissionLevel !== 'st' ? <th style={{ width: '9%' }}> </th> : null}
                            </tr>
                        </thead>
                        <tbody>
                            {mentorQuestions?.map((question) => {
                                return (
                                    <MentorQuestion
                                        key={question.questionID}
                                        question={question}
                                        curModule={curModule}
                                        updateCurrentModule={updateCurrentModule}
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
