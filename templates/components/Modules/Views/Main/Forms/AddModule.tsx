import React, { useEffect, useState } from 'react';
import { Button, Form, FormGroup, Label, Input, Row, Col, Alert } from 'reactstrap';
import Select from 'react-select';
import axios from 'axios';
import languageCodes from '@/public/static/json/languageCodes.json';
import { useUser } from '@/hooks/useUser';
import { LanguageCode } from '@/types/misc';

export default function AddModule({
    updateModuleList,
    classOptions,
    currentClass
}: {
    updateModuleList: (task: string, moduleID?: number) => void;
    classOptions: { value: number; label: string }[];
    currentClass: { value: number; label: string };
}) {
    const { user } = useUser();
    const permission = user?.permissionGroup;
    const [name, setName] = useState<string>('');
    const [language, setLanguage] = useState<{ label: string; value: string }>({
        label: '',
        value: ''
    });
    const [status, setStatus] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [classID, setClassID] = useState<string>('');
    const [languageCodesList, setLanguageCodesList] = useState<{ label: string; value: string }[]>([]);
    const [classState, setClassState] = useState<{
        label: string;
        value: string;
    }>({ label: '', value: '' });

    useEffect(() => {
        let tempCodeList = [];

        for (let key in languageCodes) {
            tempCodeList.push({
                label: languageCodes[key as LanguageCode],
                value: key
            });
        }

        setLanguageCodesList(tempCodeList);
    }, []);

    const submitModule = (e: React.FormEvent) => {
        e.preventDefault();

        let data;

        if (permission === 'su') {
            data = {
                name: name,
                language,
                complexity: 2
            };
        } else {
            data = {
                name: name,
                language,
                complexity: 2,
                groupID: currentClass.value === 0 ? classState.value : currentClass.value
            };

            let header = {
                headers: { Authorization: 'Bearer ' + user?.jwt }
            };

            let modID = -1;

            axios
                .post('/elleapi/module', data, header)
                .then((res) => {
                    setSuccess(true);
                    onShowStatus();
                    modID = res.data.moduleID;
                    updateModuleList('add', modID);
                    let data = {
                        numIncorrectCards: 10,
                        numCorrectCards: 10,
                        time: 10,
                        module_id: modID
                    };

                    let header = {
                        headers: { Authorization: 'Bearer ' + user?.jwt }
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
        }
    };

    const onShowStatus = () => {
        setStatus(true);
        window.setTimeout(() => {
            setStatus(false);
            setName('');
            setLanguage({ label: '', value: '' });
            setClassID('');
            setSuccess(false);
        }, 2000);
    };

    const renderStatus = () => {
        if (status && success) {
            return (
                <Alert color='success' isOpen={status}>
                    {name} has been added successfully!{' '}
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

    const classSelectOptions = classOptions.map((option: { value: number; label: string }) => {
        return { value: option.value.toString(), label: option.label };
    });

    return (
        <div>
            <Alert color='none' style={{ color: '#004085', backgroundColor: 'aliceblue' }}>
                <Form onSubmit={submitModule}>
                    {renderStatus()}
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='moduleName'>Module Name:</Label>
                                <Input type='text' placeholder='Module Name' value={name} onChange={(e) => setName(e.target.name)} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='moduleLang'>Language:</Label>
                                <Select
                                    name='languageCode'
                                    options={languageCodesList}
                                    className='basic-single'
                                    classNamePrefix='select'
                                    isClearable={true}
                                    value={language}
                                    onChange={(e) =>
                                        setLanguage({
                                            label: e?.label as string,
                                            value: e?.value as string
                                        })
                                    }
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    {currentClass.value === 0 && permission !== 'su' ? (
                        <Row>
                            <Col>
                                <FormGroup>
                                    <Label for='classContext'>Class:</Label>
                                    <Select
                                        name='class'
                                        options={classSelectOptions}
                                        className='basic-single'
                                        classNamePrefix='select'
                                        isClearable={true}
                                        value={classState}
                                        onChange={(e) =>
                                            setClassState({
                                                label: e?.label as string,
                                                value: e?.value as string
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
