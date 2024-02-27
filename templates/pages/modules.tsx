import Layout from '@/app/layout';
import { useUser } from '@/hooks/useUser';
import { useEffect, useState } from 'react';
import { Col, Container, Label, Row } from 'reactstrap';

import ModuleSearch from '@/components/Modules/ModuleSearch';
import MainModuleView from '@/components/Modules/Views/Main/MainModuleView';
import { UserGroup } from '@/types/api/group';
import { MentorQuestion } from '@/types/api/mentors';
import { Module, ModuleQuestion, ModuleQuestionAnswer } from '@/types/api/modules';
import { Term } from '@/types/api/terms';
import { UserLevel } from '@/types/api/user';
import { PermissionGroup } from '@/types/misc';
import axios from 'axios';
import Select from 'react-select';

export default function Modules() {
    const { user, loading } = useUser();
    const permissionLevel = user?.permissionGroup;
    const [modules, setModules] = useState<Module[]>([]);
    const [dynamicModules, setDynamicModules] = useState<Module[]>([]);
    const [currentModule, setCurrentModule] = useState<Module>();
    const [classes, setClasses] = useState<UserGroup[]>([]);
    const [classChanged, setClassChanged] = useState(false);
    const [selectedClass, setSelectedClass] = useState({
        value: 0,
        label: 'All'
    });
    const [questions, setQuestions] = useState<ModuleQuestion[]>([]);
    const [mentorQuestions, setMentorQuestions] = useState<MentorQuestion[]>([]);
    const [allAnswers, setAllAnswers] = useState<ModuleQuestionAnswer[]>([]);
    const [currentPermissionLevel, setCurrentPermissionLevel] = useState<PermissionGroup>(permissionLevel as PermissionGroup);
    const [groupPermissionLevels, setGroupPermissionLevels] = useState<UserLevel[]>([]);
    const [modificationWarning, setModificationWarning] = useState(false);

    useEffect(() => {
        if (!loading) {
            updateModuleList('initialize');
            getClasses();
            getGroupPermissionLevels();
            if (permissionLevel === 'su') setCurrentPermissionLevel(permissionLevel);
        }
    }, [loading]);

    useEffect(() => {
        if (!currentModule) return;

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: { language: currentModule?.language }
        };

        axios
            .get<Term[]>('/elleapi/term', header)
            .then((res) => {
                const allAnswersInDB = res.data.filter((answer) => {
                    if (answer.type !== 'PH') return true;
                    return false;
                });

                const frontArray: string[] = [];
                const allAnswersWithoutDupes: ModuleQuestionAnswer[] = [];

                allAnswersInDB.forEach((answer) => {
                    if (answer.front && !frontArray.includes(answer.front)) {
                        frontArray.push(answer.front);
                        allAnswersWithoutDupes.push(answer);
                    }
                });
                setAllAnswers(allAnswersWithoutDupes);
            })
            .catch((error) => console.log('error in getAllAnswers: ', error));
    }, [currentModule, user?.jwt]);

    const updateModuleList = (task: string, moduleID?: number) => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: {
                groupID: permissionLevel === 'ta' ? selectedClass.value : null
            }
        };

        axios
            .get<Module[]>('/elleapi/retrieveusermodules', header)
            .then((res) => {
                let allModules = res.data;

                if (allModules.length === 0) {
                    return;
                }

                if (selectedClass.value === 0) {
                    setModules(allModules);
                    setDynamicModules(allModules);
                    setClassChanged(false);

                    if (task === 'add') {
                        let newModule = allModules.find((module: Module) => module.moduleID === moduleID);
                        updateCurrentModule(newModule, 'all');
                    } else if (task === 'unlink') {
                        moduleID === currentModule?.moduleID && updateCurrentModule(allModules[0]);
                    } else if (['initialize', 'change'].includes(task)) {
                        updateCurrentModule(allModules[0]);
                    }
                } else {
                    let groupSpecificModules = allModules.filter((module: Module) => module.groupID === selectedClass.value);

                    if (groupSpecificModules.length === 0) {
                        setDynamicModules([]);
                        setCurrentModule(undefined);
                        setClassChanged(false);
                        return;
                    }

                    setModules(allModules);
                    setDynamicModules(groupSpecificModules);
                    setClassChanged(false);

                    if (task === 'add') {
                        const newModule = groupSpecificModules.find((module: Module) => module.moduleID === moduleID);
                        updateCurrentModule(newModule, 'add');
                    } else if (task === 'unlink') {
                        moduleID === currentModule?.moduleID && updateCurrentModule(groupSpecificModules[0]);
                    } else if (task === 'change') {
                        updateCurrentModule(groupSpecificModules[0]);
                    }
                }
            })
            .catch((error) => {
                console.log('updateModuleList error: ', error);
            });
    };

    const updateCurrentModule = (module?: Module, task?: string) => {
        const data = {
            moduleID: module?.moduleID
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post<ModuleQuestion[]>('/elleapi/modulequestions', data, header)
            .then((res) => {
                let questions = res.data;

                setQuestions(questions);
                setCurrentModule(module);

                if (task) toggleModificationWarning('new');
                else toggleModificationWarning('update');
            })
            .catch((error) => console.log('updateCurrentModule error: ', error));
        axios
            .post<MentorQuestion[]>('/elleapi/getmentorquestions', data, header)
            .then((res) => {
                let questions = res.data;

                setMentorQuestions(questions);
            })
            .catch((error) => console.log('updateCurrentModule error: ', error));
    };

    const editModule = (editedName: string, module: Module) => {
        const data = {
            moduleID: module.moduleID,
            name: editedName,
            language: module.language,
            complexity: 2,
            groupID: currentPermissionLevel === 'ta' ? selectedClass.value : null
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .put<Module>('/elleapi/retrieveusermodules', data, header)
            .then((res) => {
                updateModuleList('change');

                if (currentModule?.moduleID === module.moduleID) {
                    setCurrentModule(res.data);
                }
            })
            .catch((error) => console.log('error in editModule: ', error));
    };

    const deleteModule = (id: number) => {
        const header = {
            data: {
                moduleID: id,
                groupID: currentPermissionLevel === 'st' ? selectedClass.value : null
            },
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .delete('/elleapi/module', header)
            .then((res) => {
                updateModuleList('delete');

                if (id === currentModule?.moduleID) {
                    updateCurrentModule(modules[0]);
                }
            })
            .catch((error) => console.log('error in deleteModule: ', error));
    };

    const unlinkModule = (id: number) => {
        const data = {
            moduleID: id,
            groupID: selectedClass.value
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post('/elleapi/addmoduletogroup', data, header)
            .then((res) => {
                updateModuleList('unlink', id);
            })
            .catch((error) => console.log('error in unlinkModule: ', error));
    };

    const toggleModificationWarning = (condition: string) => {
        if (condition === 'new') {
            setModificationWarning(true);
        } else if (condition === 'update') {
            setModificationWarning(false);
        } else {
            setModificationWarning(!modificationWarning);
        }
    };

    const getClasses = () => {
        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .get<UserGroup[]>('/elleapi/searchusergroups', header)
            .then((res) => {
                setClasses(res.data);
            })
            .catch((error) => {
                console.log('getClasses error: ', error);
            });
    };

    const updateClassContext = (classContext: { label: string; value: number }) => {
        if (classContext) {
            const currentClass = groupPermissionLevels.find((group) => group.groupID === classContext.value);
            setSelectedClass(classContext);
            setClassChanged(true);

            classContext.value !== 0 && setCurrentPermissionLevel(currentClass?.accessLevel as PermissionGroup);
        }
    };

    const getGroupPermissionLevels = () => {
        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };
        axios
            .get<UserLevel[]>('/elleapi/userlevels', header)
            .then((res) => {
                setGroupPermissionLevels(res.data);
            })
            .catch((error) => {
                console.log('getGroupPermissionLevels error: ', error);
            });
    };

    const classOptions = [
        { value: 0, label: 'All' },
        ...classes.map((group) => {
            return {
                value: group.groupID,
                label: group.groupName
            };
        })
    ];

    classChanged ? updateModuleList('change') : null;

    return (
        <Layout requireUser>
            <div>
                <Container className='mainContainer'>
                    <br />
                    <Row style={{ marginBottom: '15px' }}>
                        <Col className='Left Column' xs='3'>
                            <h3
                                style={{
                                    margin: '5px 0 0 0',
                                    color: '#16a3b8'
                                }}
                            >
                                Your ELLE Modules:
                            </h3>
                        </Col>
                        {currentPermissionLevel !== 'su' ? (
                            <Col
                                className='Right Column'
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}
                            >
                                <Label
                                    style={{
                                        margin: '5px 8px 0 0',
                                        fontSize: 'large'
                                    }}
                                >
                                    Class:{' '}
                                </Label>
                                <Select
                                    name='selectedClass'
                                    instanceId={'select-class'}
                                    options={classOptions}
                                    className='basic-single'
                                    classNamePrefix='select'
                                    isClearable={true}
                                    value={selectedClass}
                                    onChange={(e) =>
                                        updateClassContext({
                                            value: e?.value as number,
                                            label: e?.label as string
                                        })
                                    }
                                    styles={{
                                        valueContainer: () => ({
                                            width: '147px'
                                        }),
                                        // Fixes the overlapping problem of the component
                                        menu: (provided) => ({
                                            ...provided,
                                            zIndex: 9999
                                        }),
                                        singleValue: (provided) => ({
                                            ...provided,
                                            margin: '0 0 0 10px'
                                        }),
                                        input: (provided) => ({
                                            ...provided,
                                            margin: '0 0 0 10px'
                                        })
                                    }}
                                />
                            </Col>
                        ) : null}
                    </Row>
                    <Row className='Seperated Col'>
                        <ModuleSearch
                            modules={modules}
                            updateModuleList={updateModuleList}
                            dynamicModules={dynamicModules}
                            setDynamicModules={setDynamicModules}
                            selectedClass={selectedClass}
                            classOptions={classOptions}
                            updateCurrentModule={updateCurrentModule}
                            deleteModule={deleteModule}
                            editModule={editModule}
                            unlinkModule={unlinkModule}
                        />
                        <Col className='Right Column'>
                            {currentModule && (
                                <MainModuleView
                                    currentClass={selectedClass}
                                    curModule={currentModule}
                                    questions={questions}
                                    mentorQuestions={mentorQuestions}
                                    updateCurrentModule={updateCurrentModule}
                                    allAnswers={allAnswers}
                                    modificationWarning={modificationWarning}
                                    toggleModificationWarning={toggleModificationWarning}
                                />
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>
        </Layout>
    );
}
