import React, { useEffect, useState } from 'react';
import { Input, Label, Row, Col, Table, Card, InputGroup } from 'reactstrap';
import Select from 'react-select';
import axios from 'axios';

import ExistingModule from '@/components/Modules/ExistingModule';
import languageCodes from '@/public/static/json/languageCodes.json';
import { useUser } from '@/hooks/useUser';
import Image from 'next/image';

import moduleImage from '@/public/static/images/module.png';
import langImage from '@/public/static/images/languages.png';
import creatorImage from '@/public/static/images/creator.png';
import { Module } from '@/types/api/modules';
import { LanguageCode } from '@/types/misc';

export default function AddExistingModule({
    updateModuleList,
    classOptions,
    currentClass
}: {
    updateModuleList: (task: string, moduleID?: number) => void;
    classOptions: { value: number; label: string }[];
    currentClass: { value: number; label: string };
}) {
    const { user } = useUser();
    const [allModulesInDB, setAllModulesInDB] = useState<Module[]>([]);
    const [reusuableModules, setReusuableModules] = useState<Module[]>([]);
    const [classState, setClassState] = useState<{
        label: string;
        value: number;
    }>();
    const [searchName, setSearchName] = useState('');
    const [searchCreator, setSearchCreator] = useState('');
    const [languageCodeList, setLanguageCodeList] = useState<{ label: string; value: string }[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<{
        label: string;
        value: string;
    }>({ label: '', value: '' });
    const [isSelected, setIsSelected] = useState(false);

    useEffect(() => {
        getAllModulesInDB();
        let tempCodeList = [];

        for (let key in languageCodes) {
            tempCodeList.push({
                label: languageCodes[key as LanguageCode],
                value: key
            });
        }

        setLanguageCodeList(tempCodeList);
    }, []);

    const getAllModulesInDB = () => {
        let config = {
            params: { groupID: currentClass.value },
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .get('/elleapi/retrievemodules', config)
            .then((res) => {
                setAllModulesInDB(res.data);

                if (currentClass.value !== 0) {
                    updateClass(currentClass);
                }
            })
            .catch((error) => {
                console.log('getAllModulesInDB error: ', error.message);
            });
    };

    const updateClass = (value: { label: string; value: number }) => {
        if (value !== null) {
            let config = {
                params: { groupID: value.value },
                headers: { Authorization: 'Bearer ' + user?.jwt }
            };

            axios
                .get('/elleapi/retrievegroupmodules', config)
                .then((res) => {
                    let modules: Module[] = [];

                    let idList = res.data.map((module: Module) => module.moduleID);

                    allModulesInDB.map((module) => {
                        if (idList.indexOf(module.moduleID) === -1) {
                            modules.push(module);
                        }
                    });
                    setClassState(value);
                    setReusuableModules(modules);
                })
                .catch(function (error) {
                    console.log('updateClass in addExistingModule.js error: ', error.message);
                });
        } else {
            setClassState(value);
            setReusuableModules([]);
        }
    };

    const classSelectOptions = classOptions.filter((option: { label: string; value: number }) => option.value !== 0);

    let language = '';
    if (selectedLanguage !== null && selectedLanguage.value !== undefined) {
        language = selectedLanguage.value;
    }

    let filteredModules = reusuableModules.filter((module: Module) => {
        return (
            module.name?.toLowerCase().indexOf(searchName.toLowerCase()) !== -1 &&
            module.language.toLowerCase().indexOf(language) !== -1 &&
            module.username?.toLowerCase().indexOf(searchCreator.toLowerCase()) !== -1
        );
    });

    return (
        <div>
            <Row>
                <Col
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: '5px 15px 10px 15px'
                    }}
                >
                    <Label for='classContext' style={{ margin: '12px 8px 0 0', fontSize: 'large' }}>
                        Class:
                    </Label>
                    {currentClass.value === 0 ? (
                        <Select
                            name='class'
                            options={classSelectOptions}
                            className='basic-single'
                            classNamePrefix='select'
                            isClearable={true}
                            value={classState}
                            onChange={(e) =>
                                updateClass({
                                    label: e?.label as string,
                                    value: e?.value as number
                                })
                            }
                            styles={{
                                control: (provided) => ({
                                    ...provided,
                                    marginTop: '7px'
                                }),
                                valueContainer: (provided) => ({
                                    ...provided,
                                    width: '400px'
                                })
                            }}
                        />
                    ) : (
                        <Label
                            style={{
                                margin: '12px 8px 0 0',
                                fontSize: 'large',
                                display: 'flex',
                                justifyContent: 'flex-end'
                            }}
                        >
                            {currentClass.label}
                        </Label>
                    )}
                </Col>
            </Row>

            <Row style={{ marginBottom: '10px' }}>
                <Col>
                    <InputGroup>
                        <div style={{ margin: '5px' }}>
                            <Image src={moduleImage} alt='Icon made by Freepik from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                        </div>
                        <Input
                            style={{ borderStyle: 'hidden', padding: '6px' }}
                            type='text'
                            placeholder='Search Name'
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value.substring(0, 20))}
                        />
                    </InputGroup>
                </Col>

                <Col>
                    <InputGroup>
                        <div style={{ margin: '5px' }}>
                            <Image src={langImage} alt='Icon made by Smashicons from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                        </div>
                        <Select
                            name='languageCode'
                            options={languageCodeList}
                            className='basic-single'
                            classNamePrefix='select'
                            isClearable={true}
                            value={selectedLanguage}
                            onChange={(e) =>
                                setSelectedLanguage({
                                    label: e?.label as string,
                                    value: e?.value as string
                                })
                            }
                            styles={{
                                control: (provided, state) => ({
                                    ...provided,
                                    width: isSelected ? '96px' : '96px',
                                    borderStyle: 'hidden'
                                }),
                                valueContainer: (provided) => ({
                                    ...provided,
                                    width: '58px',
                                    fontSize: '12px'
                                })
                            }}
                        />
                    </InputGroup>
                </Col>

                <Col>
                    <InputGroup>
                        <div style={{ margin: '5px' }}>
                            <Image src={creatorImage} alt='Icon made by Freepik from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                        </div>
                        <Input
                            style={{ borderStyle: 'hidden', padding: '6px' }}
                            type='text'
                            placeholder='Search Creator'
                            value={searchCreator}
                            onChange={(e) => setSearchCreator(e.target.value.substring(0, 20))}
                        />
                    </InputGroup>
                </Col>
            </Row>

            <Card
                style={{
                    height: '50vh',
                    borderRadius: '6px',
                    borderStyle: 'hidden'
                }}
                className='moduleTable'
            >
                {(currentClass.value === 0 && classState?.label === '' && classState?.value === 0) ||
                (currentClass.value === 0 && classState === null) ? (
                    <Card
                        color='info'
                        style={{
                            height: '100%',
                            textAlign: 'center',
                            color: 'white'
                        }}
                    >
                        Please select a class first.
                    </Card>
                ) : (
                    <Table hover>
                        <thead>
                            <tr>
                                <th style={{ borderTopLeftRadius: '5px' }}>Name</th>
                                <th>Language</th>
                                <th>Creator</th>
                                <th style={{ borderTopRightRadius: '5px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredModules.map((module) => {
                                return (
                                    <ExistingModule
                                        key={module.moduleID}
                                        module={module}
                                        selectedClass={currentClass.value === 0 ? classState : currentClass}
                                        updateModuleList={updateModuleList}
                                    />
                                );
                            })}
                        </tbody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
