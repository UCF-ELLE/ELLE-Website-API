import React, { useRef, useState } from 'react';
import Select, { GroupBase, SelectInstance } from 'react-select';
import { Alert, Button, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import languageCodes from '@/public/static/json/languageCodes.json';
import { Language, LanguageCode } from '@/types/misc';
import { useUser } from '@/hooks/useAuth';
import axios from 'axios';
import { Module } from '@/types/api/modules';

const getLanguageCodeList = () => {
    const list = [];
    for (const key in languageCodes) {
        list.push({
            label: languageCodes[key as LanguageCode],
            value: key as LanguageCode
        });
    }
    return list;
};

export default function AddModuleForm({
    updateModuleList,
    classOptions,
    currentClass
}: {
    updateModuleList: (task: string, moduleID?: number) => void;
    classOptions: { value: number; label: string }[];
    currentClass: { value: number; label: string };
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;
    const [name, setName] = useState<string>('');
    const [selectedLanguage, setLanguage] = useState<Language>({
        label: undefined,
        value: undefined
    });
    const [languageCodeList, setLanguageList] = useState<Language[]>(getLanguageCodeList());
    const [classState, setClassState] = useState<{
        value: number;
        label: string;
    }>();
    const [isPastaModule, setIsPastaModule] = useState<boolean>(false);
    const [status, setStatus] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const selectInputRef = useRef<SelectInstance<Language>>(null);
    const [titoWelcomeMessage, setTitoWelcomeMessage] = useState<string>('');

    const suggestions = [
        "Hi, my name is Tito! Let's practice using the vocabulary words on the right. Try to use each word in a complete sentence!",
        "Welcome to the chat! I'm here to help you practice. Which topic should we discuss first?",
        "Hi! I need your help to remember my target language. Can you talk to me using the words on the right?"
    ];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let data;

        if (permissionLevel === 'su') {
            data = {
                name,
                language: selectedLanguage.value,
                complexity: 2,
                isPastaModule,
                titoWelcomeMessage
            };
        } else {
            data = {
                name,
                language: selectedLanguage.value,
                complexity: 2,
                groupID: currentClass.value === 0 ? classState?.value : currentClass.value,
                isPastaModule,
                titoWelcomeMessage
            };
        }

        const header = { headers: { Authorization: `Bearer ${user?.jwt}` } };
        let modID = -1;

        axios
            .post<Module>('/elleapi/module', data, header)
            .then((res) => {
                setSuccess(true);
                modID = res.data.moduleID;
                onShowStatus();
                updateModuleList('add', modID);
                const data = {
                    numIncorrectCards: 10,
                    numCorrectCards: 10,
                    time: 10,
                    module_id: modID
                };

                const header = {
                    headers: { Authorization: `Bearer ${user?.jwt}` }
                };

                axios
                    .post('/elleapi/setmentorquestionfrequency', data, header)
                    .then((res) => {
                        //updateCurrentModule({ module: curModule.moduleID });
                    })
                    .catch((error) => {
                        console.log('updateMentorFrequency error: ', error.response);
                    });
            })
            .catch((error) => {
                if (error.message !== undefined) {
                    console.log('Add Module error', error.message);
                    onShowStatus();
                }
            });
    };

    const onShowStatus = () => {
        setStatus(true);
        window.setTimeout(() => {
            setStatus(false);
            setName('');
            setTitoWelcomeMessage('');
            setLanguage({ label: undefined, value: undefined });
            if (selectInputRef.current) selectInputRef.current.clearValue();
            setClassState(undefined);
            setSuccess(false);
        }, 2000);
    };

    const renderStatus = () => {
        if (status && success) {
            return (
                <Alert color='success' isOpen={status}>
                    {name} has been added successfully!
                </Alert>
            );
        } else if (status && !success) {
            return (
                <Alert color='danger' isOpen={status}>
                    Failure to add {name}
                </Alert>
            );
        }
    };

    const filteredClassOptions = classOptions.filter((option) => option.value !== 0);

    return (
        <div>
            <Alert color='none' style={{ color: '#004085', backgroundColor: 'aliceblue' }}>
                <Form onSubmit={handleSubmit}>
                    {renderStatus()}
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='moduleName'>Module Name:</Label>
                                <Input type='text' placeholder='Module Name' value={name} onChange={(e) => setName(e.target.value)} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='moduleLang'>Language:</Label>
                                <Select
                                    name='languageCode'
                                    instanceId={'select-language'}
                                    options={languageCodeList}
                                    ref={selectInputRef}
                                    className='basic-single'
                                    classNamePrefix='select'
                                    isClearable={true}
                                    onChange={(e) =>
                                        setLanguage({
                                            label: e?.label as string,
                                            value: e?.value as LanguageCode
                                        })
                                    }
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col className='mb-3'>
                            <FormGroup check>
                                <Input type='checkbox' name='isPastaModule' onClick={() => setIsPastaModule(!isPastaModule)} />
                                <Label check for='isPastaModule'>
                                    Pasta Module
                                </Label>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='titoWelcomeMessage'>Tito's First Message (Optional):</Label>
                                <Input
                                    type='textarea'
                                    placeholder="Enter custom first message from Tito"
                                    value={titoWelcomeMessage}
                                    onChange={(e) => setTitoWelcomeMessage(e.target.value)}
                                    rows={3}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row className='mb-3'>
                        <Col>
                            <Label style={{ fontSize: '0.85rem', color: '#555' }}>Suggestions (click to use):</Label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {suggestions.map((suggestion, idx) => (
                                    <Button
                                        key={idx}
                                        outline
                                        type='button'
                                        size='sm'
                                        color='secondary'
                                        style={{ textAlign: 'left', whiteSpace: 'normal', fontSize: '0.8rem' }}
                                        onClick={() => setTitoWelcomeMessage(suggestion)}
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
                        </Col>
                    </Row>
                    {currentClass.value === 0 && permissionLevel !== 'su' ? (
                        <Row>
                            <Col>
                                <FormGroup>
                                    <Label for='classContext'>Class:</Label>
                                    <Select
                                        name='class'
                                        instanceId={'select-class'}
                                        options={filteredClassOptions}
                                        className='basic-single'
                                        classNamePrefix='select'
                                        isClearable={true}
                                        value={classState}
                                        onChange={(e) =>
                                            setClassState({
                                                label: e?.label as string,
                                                value: e?.value as number
                                            })
                                        }
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    ) : null}
                    <Row>
                        <Col>
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
                        </Col>
                    </Row>
                </Form>
            </Alert>
        </div>
    );
}
