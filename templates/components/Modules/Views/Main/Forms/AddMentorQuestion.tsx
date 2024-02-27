import React, { useEffect, useState } from 'react';
import { Button, Form, FormGroup, Label, Input, Row, Col, Alert, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import axios from 'axios';
import classnames from 'classnames';
import { useUser } from '@/hooks/useUser';
import { Module, ModuleQuestionAnswer } from '@/types/api/modules';
import { Tag } from '@/types/api/terms';

export default function AddMentorQuestion({
    currentClass,
    curModule,
    updateCurrentModule,
    allAnswers,
    allAnswersNotInThisModule,
    deleteTag,
    addTag,
    allTags,
    setOpenForm,
    getAllTags
}: {
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (module: Module, task?: string) => void;
    allAnswers: ModuleQuestionAnswer[];
    allAnswersNotInThisModule: ModuleQuestionAnswer[];
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
    setOpenForm: (num: number) => void;
    getAllTags: () => void;
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;
    const [questionText, setQuestionText] = useState<string>('');
    const [answer1Text, setAnswer1Text] = useState<string>('');
    const [answer2Text, setAnswer2Text] = useState<string>('');
    const [answer3Text, setAnswer3Text] = useState<string>('');
    const [answer4Text, setAnswer4Text] = useState<string>('');
    const [answer5Text, setAnswer5Text] = useState<string>('');
    const [type, setType] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('1');

    useEffect(() => {
        toggle('1');
    }, []);

    const submitMCQuestion = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let answers1d = [e.currentTarget.answer1Text.value, e.currentTarget.answer2Text.value];
        /*if (e.target.answer5Text.value == "") {
			answers = [[e.target.answer1Text.value,
				e.target.answer2Text.value,
				e.target.answer3Text.value,
				e.target.answer4Text.value]];
		} else {
			answers = [[e.target.answer1Text.value,
				e.target.answer2Text.value,
				e.target.answer3Text.value,
				e.target.answer4Text.value,
				e.target.answer5Text.value]];
		}*/
        if (e.currentTarget.answer3Text.value != '') {
            answers1d.push(e.currentTarget.answer3Text.value);
        }
        if (e.currentTarget.answer4Text.value != '') {
            answers1d.push(e.currentTarget.answer4Text.value);
        }
        if (e.currentTarget.answer5Text.value != '') {
            answers1d.push(e.currentTarget.answer5Text.value);
        }
        let answers = [answers1d];
        let data = {
            type: 'MENTOR_MC',
            question_text: e.currentTarget.questionText.value,
            mc_options: answers,
            moduleID: curModule.moduleID
        };
        //console.log(data);

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post('/elleapi/creatementorquestions', data, header)
            .then((res) => {
                resetFields();
                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('submitQuestion error: ', error.response);
            });
    };

    const submitFRQuestion = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let data = {
            type: 'MENTOR_FR',
            question_text: e.currentTarget.questionText.value,
            mc_options: {},
            moduleID: curModule.moduleID
        };

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post('/elleapi/creatementorquestions', data, header)
            .then((res) => {
                resetFields();
                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('submitQuestion error: ', error.response);
            });
    };

    //clears the input fields of the addQuestion form
    //cannot however change questionID back to blank or else adding a newly created term as an answer would not work
    //questionID itself will be updated correctly when the addQuestion API request is called
    const resetFields = () => {
        setQuestionText('');
        setAnswer1Text('');
        setAnswer2Text('');
        setAnswer3Text('');
        setAnswer4Text('');
        setAnswer5Text('');
        setType([]);
    };

    const toggle = (tab: string) => {
        if (activeTab !== tab) {
            setActiveTab(tab);
        }
    };

    return (
        <div>
            <Nav tabs>
                <NavItem>
                    <NavLink
                        className={classnames({ active: activeTab === '1' })}
                        onClick={() => {
                            toggle('1');
                        }}
                    >
                        Multiple Choice
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink className={classnames({ active: activeTab === '2' })} onClick={() => toggle('2')}>
                        Free Response
                    </NavLink>
                </NavItem>
            </Nav>
            <TabContent activeTab={activeTab}>
                <TabPane tabId='1'>
                    <Form onSubmit={(e) => submitMCQuestion(e)}>
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
                                        <Label for='questionText'>Question:</Label>

                                        {questionText.length > 200 || (questionText.trim() == '' && questionText != '') ? (
                                            <Input
                                                invalid
                                                type='text'
                                                name='questionText'
                                                onChange={(e) => setQuestionText(e.target.value)}
                                                value={questionText}
                                                id='questionText'
                                                placeholder='Question (required)'
                                            />
                                        ) : (
                                            <Input
                                                type='text'
                                                name='questionText'
                                                onChange={(e) => setQuestionText(e.target.value)}
                                                value={questionText}
                                                id='questionText'
                                                placeholder='Question (required)'
                                            />
                                        )}
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Row>
                                <Col>
                                    <Label for='answers'>Answers:</Label>

                                    <br />

                                    <FormGroup width='200%'>
                                        {
                                            //there is undoubtedly prettier ways to do this but copy + paste works just as good :]
                                            (answer1Text != '' && answer1Text.trim() == '') || answer1Text.length > 30 ? (
                                                <Input
                                                    invalid
                                                    type='text'
                                                    name='answer1Text'
                                                    id='answer1Text'
                                                    value={answer1Text}
                                                    onChange={(e) => setAnswer1Text(e.target.value)}
                                                    placeholder='Answer 1 (required)'
                                                />
                                            ) : (
                                                <Input
                                                    type='text'
                                                    name='answer1Text'
                                                    id='answer1Text'
                                                    value={answer1Text}
                                                    onChange={(e) => setAnswer1Text(e.target.value)}
                                                    placeholder='Answer 1 (required)'
                                                />
                                            )
                                        }

                                        {(answer2Text != '' && answer2Text.trim() == '') || answer2Text.length > 30 ? (
                                            <Input
                                                invalid
                                                type='text'
                                                name='answer2Text'
                                                id='answer2Text'
                                                value={answer2Text}
                                                onChange={(e) => setAnswer2Text(e.target.value)}
                                                placeholder='Answer 2 (required)'
                                            />
                                        ) : (
                                            <Input
                                                type='text'
                                                name='answer2Text'
                                                id='answer2Text'
                                                value={answer2Text}
                                                onChange={(e) => setAnswer2Text(e.target.value)}
                                                placeholder='Answer 2 (required)'
                                            />
                                        )}

                                        {(answer3Text != '' && answer3Text.trim() == '') || answer3Text.length > 30 ? (
                                            <Input
                                                invalid
                                                type='text'
                                                name='answer3Text'
                                                id='answer3Text'
                                                value={answer3Text}
                                                onChange={(e) => setAnswer3Text(e.target.value)}
                                                placeholder='Answer 3 (optional)'
                                            />
                                        ) : (
                                            <Input
                                                type='text'
                                                name='answer3Text'
                                                id='answer3Text'
                                                value={answer3Text}
                                                onChange={(e) => setAnswer3Text(e.target.value)}
                                                placeholder='Answer 3 (optional)'
                                            />
                                        )}

                                        {(answer4Text != '' && answer4Text.trim() == '') || answer4Text.length > 30 ? (
                                            <Input
                                                invalid
                                                type='text'
                                                name='answer4Text'
                                                id='answer4Text'
                                                value={answer4Text}
                                                onChange={(e) => setAnswer4Text(e.target.value)}
                                                placeholder='Answer 4 (optional)'
                                            />
                                        ) : (
                                            <Input
                                                type='text'
                                                name='answer4Text'
                                                id='answer4Text'
                                                value={answer4Text}
                                                onChange={(e) => setAnswer4Text(e.target.value)}
                                                placeholder='Answer 4 (optional)'
                                            />
                                        )}

                                        {(answer5Text != '' && answer5Text.trim() == '') || answer5Text.length > 30 ? (
                                            <Input
                                                invalid
                                                type='text'
                                                name='answer5Text'
                                                id='answer5Text'
                                                value={answer5Text}
                                                onChange={(e) => setAnswer5Text(e.target.value)}
                                                placeholder='Answer 5 (optional)'
                                            />
                                        ) : (
                                            <Input
                                                type='text'
                                                name='answer5Text'
                                                id='answer5Text'
                                                value={answer5Text}
                                                onChange={(e) => setAnswer5Text(e.target.value)}
                                                placeholder='Answer 5 (optional)'
                                            />
                                        )}
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Row>
                                <Col>
                                    {questionText == '' || answer1Text == '' || answer2Text == '' ? (
                                        <Button
                                            disabled
                                            style={{
                                                backgroundColor: '#004085',
                                                border: 'none'
                                            }}
                                            type='submit'
                                            block
                                        >
                                            Create (please fill in required fields)
                                        </Button>
                                    ) : (answer5Text != '' && answer5Text.trim() == '') ||
                                      (answer4Text != '' && answer4Text.trim() == '') ||
                                      (answer3Text != '' && answer3Text.trim() == '') ||
                                      (questionText.trim() == '' && questionText != '') ||
                                      (answer1Text != '' && answer1Text.trim() == '') ||
                                      (answer2Text != '' && answer2Text.trim() == '') ? (
                                        <Button
                                            disabled
                                            style={{
                                                backgroundColor: '#004085',
                                                border: 'none'
                                            }}
                                            type='submit'
                                            block
                                        >
                                            Create (no whitespace only fields)
                                        </Button>
                                    ) : questionText.length > 200 ? (
                                        <Button
                                            disabled
                                            style={{
                                                backgroundColor: '#004085',
                                                border: 'none'
                                            }}
                                            type='submit'
                                            block
                                        >
                                            Create (200 character limit for question)
                                        </Button>
                                    ) : answer1Text.length > 30 ||
                                      answer2Text.length > 30 ||
                                      answer3Text.length > 30 ||
                                      answer4Text.length > 30 ||
                                      answer5Text.length > 30 ? (
                                        <Button
                                            disabled
                                            style={{
                                                backgroundColor: '#004085',
                                                border: 'none'
                                            }}
                                            type='submit'
                                            block
                                        >
                                            Create (30 character limit for answers)
                                        </Button>
                                    ) : (
                                        <Button
                                            style={{
                                                backgroundColor: '#004085',
                                                border: 'none'
                                            }}
                                            type='submit'
                                            block
                                        >
                                            Create
                                        </Button>
                                    )}

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
                </TabPane>
                <TabPane tabId='2'>
                    <Form onSubmit={(e) => submitFRQuestion(e)}>
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
                                        <Label for='questionText'>Question:</Label>

                                        {questionText.length > 200 || (questionText.trim() == '' && questionText != '') ? (
                                            <Input
                                                invalid
                                                type='text'
                                                name='questionText'
                                                onChange={(e) => setQuestionText(e.target.value)}
                                                value={questionText}
                                                id='questionText'
                                                placeholder='Question (required)'
                                                autoComplete='off'
                                            />
                                        ) : (
                                            <Input
                                                type='text'
                                                name='questionText'
                                                onChange={(e) => setQuestionText(e.target.value)}
                                                value={questionText}
                                                id='questionText'
                                                placeholder='Question (required)'
                                                autoComplete='off'
                                            />
                                        )}
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Row>
                                <Col>
                                    {questionText == '' ? (
                                        <Button
                                            disabled
                                            style={{
                                                backgroundColor: '#004085',
                                                border: 'none'
                                            }}
                                            type='submit'
                                            block
                                        >
                                            Create (please fill in question text)
                                        </Button>
                                    ) : questionText.trim() == '' && questionText != '' ? (
                                        <Button
                                            disabled
                                            style={{
                                                backgroundColor: '#004085',
                                                border: 'none'
                                            }}
                                            type='submit'
                                            block
                                        >
                                            Create (no whitespace only fields)
                                        </Button>
                                    ) : questionText.length > 200 ? (
                                        <Button
                                            disabled
                                            style={{
                                                backgroundColor: '#004085',
                                                border: 'none'
                                            }}
                                            type='submit'
                                            block
                                        >
                                            Create (200 character limit for question)
                                        </Button>
                                    ) : (
                                        <Button
                                            style={{
                                                backgroundColor: '#004085',
                                                border: 'none'
                                            }}
                                            type='submit'
                                            block
                                        >
                                            Create
                                        </Button>
                                    )}

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
                </TabPane>
            </TabContent>
        </div>
    );
}
