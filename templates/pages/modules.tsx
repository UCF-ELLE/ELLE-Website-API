import Layout from '@/app/layout';
import { useUser } from '@/hooks/useUser';
import {
    Button,
    ButtonDropdown,
    Col,
    Collapse,
    Container,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Input,
    InputGroup,
    Label,
    Modal,
    ModalBody,
    ModalHeader,
    Row,
} from 'reactstrap';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

import searchImage from '@/public/static/images/search.png';
import AddModuleForm from '@/components/Modules/AddModuleForm';
import axios from 'axios';
import {
    Module,
    ModuleQuestion,
    ModuleQuestionAnswer,
} from '@/types/api/modules';
import { MentorQuestion } from '@/types/api/mentors';
import { Term } from '@/types/api/terms';
import { PermissionGroup } from '@/types/misc';
import { UserGroup } from '@/types/api/group';
import { UserLevel } from '@/types/api/user';
import Select from 'react-select';
import { useRouter } from 'next/router';
import AddExistingModule from '@/components/Modules/AddExistingModule';
import SuperAdminView from '@/components/Modules/Views/SuperAdminView';
import StudentView from '@/components/Modules/Views/StudentView';
import AdminView from '@/components/Modules/Views/AdminView';
import MainModuleView from '@/components/Modules/Views/MainModuleView';

export default function Modules() {
    const { user, loading } = useUser();
    const permissionLevel = user?.permissionGroup;
    const router = useRouter();

    const [searchDeck, setSearchDeck] = useState('');
    const [openForm, setOpenForm] = useState(0);
    const [modules, setModules] = useState<Module[]>([]);
    const [dynamicModules, setDynamicModules] = useState<Module[]>([]);
    const [currentModule, setCurrentModule] = useState<Module>();
    const [classes, setClasses] = useState<UserGroup[]>([]);
    const [classChanged, setClassChanged] = useState(false);
    const [selectedClass, setSelectedClass] = useState({
        value: 0,
        label: 'All',
    });
    const [questions, setQuestions] = useState<ModuleQuestion[]>([]);
    const [mentorQuestions, setMentorQuestions] = useState<MentorQuestion[]>(
        []
    );
    const [allAnswers, setAllAnswers] = useState<ModuleQuestionAnswer[]>([]);
    const [currentPermissionLevel, setCurrentPermissionLevel] =
        useState<PermissionGroup>(permissionLevel as PermissionGroup);
    const [groupPermissionLevels, setGroupPermissionLevels] = useState<
        UserLevel[]
    >([]);
    const [modificationWarning, setModificationWarning] = useState(false);
    const [addModuleButtonOpen, setAddModuleButtonOpen] = useState(false);

    const verifyPermission = useCallback(() => {
        if (!loading) {
            if (!user || !permissionLevel) router.push('/home');
        }
    }, [loading, permissionLevel, router, user]);

    useEffect(() => {
        verifyPermission();
    }, [verifyPermission]);

    useEffect(() => {
        if (!loading) {
            updateModuleList('initialize');
            getClasses();
            getGroupPermissionLevels();
            if (permissionLevel === 'su')
                setCurrentPermissionLevel(permissionLevel);
        }
    }, [loading]);

    const openAddModuleForm = (num: number) => {
        openForm === num ? setOpenForm(0) : setOpenForm(num);
    };

    const updateModuleList = (task: string, moduleID?: number) => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: {
                groupID: permissionLevel === 'ta' ? selectedClass.value : null,
            },
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
                        let newModule = allModules.find(
                            (module: Module) => module.moduleID === moduleID
                        );
                        updateCurrentModule(newModule, 'all');
                    } else if (task === 'unlink') {
                        moduleID === currentModule?.moduleID &&
                            updateCurrentModule(allModules[0]);
                    } else if (['initialize', 'change'].includes(task)) {
                        updateCurrentModule(allModules[0]);
                    }
                } else {
                    let groupSpecificModules = allModules.filter(
                        (module: Module) =>
                            module.groupID === selectedClass.value
                    );

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
                        const newModule = groupSpecificModules.find(
                            (module: Module) => module.moduleID === moduleID
                        );
                        updateCurrentModule(newModule, 'add');
                    } else if (task === 'unlink') {
                        moduleID === currentModule?.moduleID &&
                            updateCurrentModule(groupSpecificModules[0]);
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
            moduleID: module?.moduleID,
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
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
            .catch((error) =>
                console.log('updateCurrentModule error: ', error)
            );

        axios
            .post<MentorQuestion[]>('/elleapi/getmentorquestions', data, header)
            .then((res) => {
                let questions = res.data;

                setMentorQuestions(questions);
            })
            .catch((error) =>
                console.log('updateCurrentModule error: ', error)
            );
    };

    const getAllAnswers = () => {
        let allAnswersInDB: ModuleQuestionAnswer[] = [];

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: { language: currentModule?.language },
        };

        axios
            .get<Term[]>('/elleapi/terms', header)
            .then((res) => {
                const termArray = res.data.filter((answer) => {
                    if (answer.type !== 'PH') return true;
                    return false;
                });

                allAnswersInDB = termArray.map((answer) => {
                    return {
                        front: answer.front,
                        back: answer.back,
                        termID: answer.termID,
                        gender: answer.gender,
                    };
                });

                const frontArray: string[] = [];
                const allAnswersWithoutDupes: ModuleQuestionAnswer[] = [];

                allAnswersInDB.forEach((answer) => {
                    if (answer.front && frontArray.includes(answer.front)) {
                        frontArray.push(answer.front);
                        allAnswersWithoutDupes.push(answer);
                    }
                });

                setAllAnswers(allAnswersWithoutDupes);
            })
            .catch((error) => console.log('error in getAllAnswers: ', error));
    };

    const editModule = (editedName: string, module: Module) => {
        const data = {
            moduleID: module.moduleID,
            name: editedName,
            language: module.language,
            complexity: 2,
            groupID:
                currentPermissionLevel === 'ta' ? selectedClass.value : null,
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
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
                groupID:
                    currentPermissionLevel === 'st'
                        ? selectedClass.value
                        : null,
            },
            headers: { Authorization: 'Bearer ' + user?.jwt },
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
            groupID: selectedClass.value,
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        axios
            .post('/elleapi/addmoduletogroup', data, header)
            .then((res) => {
                updateModuleList('unlink', id);
            })
            .catch((error) => console.log('error in unlinkModule: ', error));
    };

    const updateSearchDeck = (e: any) => {
        const newModuleList = modules.filter((module) => {
            return (
                module?.name &&
                module?.name
                    .toLowerCase()
                    .includes(e.target.value.toLowerCase())
            );
        });

        setSearchDeck(e.target.value.substring(0, 20));
        setDynamicModules(newModuleList);
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
            headers: { Authorization: 'Bearer ' + user?.jwt },
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

    const updateClassContext = (classContext: {
        label: string;
        value: number;
    }) => {
        if (classContext) {
            const currentClass = groupPermissionLevels.find(
                (group) => group.groupID === classContext.value
            );
            setSelectedClass(classContext);
            setClassChanged(true);

            classContext.value === 0
                ? verifyPermission()
                : setCurrentPermissionLevel(
                      currentClass?.accessLevel as PermissionGroup
                  );
        }
    };

    const getGroupPermissionLevels = () => {
        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
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
                label: group.groupName,
            };
        }),
    ];

    classChanged ? updateModuleList('change') : null;

    return (
        <Layout>
            <div>
                <Container className="mainContainer">
                    <br />
                    <Row style={{ marginBottom: '15px' }}>
                        <Col className="Left Column" xs="3">
                            <h3
                                style={{
                                    margin: '5px 0 0 0',
                                    color: '#16a3b8',
                                }}
                            >
                                Your ELLE Modules:
                            </h3>
                        </Col>
                        {currentPermissionLevel !== 'su' ? (
                            <Col
                                className="Right Column"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                <Label
                                    style={{
                                        margin: '5px 8px 0 0',
                                        fontSize: 'large',
                                    }}
                                >
                                    Class:{' '}
                                </Label>
                                <Select
                                    name="selectedClass"
                                    instanceId={'select-class'}
                                    options={classOptions}
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isClearable={true}
                                    value={selectedClass}
                                    onChange={(e) =>
                                        updateClassContext({
                                            value: e?.value as number,
                                            label: e?.label as string,
                                        })
                                    }
                                    styles={{
                                        valueContainer: () => ({
                                            width: '147px',
                                        }),
                                        // Fixes the overlapping problem of the component
                                        menu: (provided) => ({
                                            ...provided,
                                            zIndex: 9999,
                                        }),
                                        singleValue: (provided) => ({
                                            ...provided,
                                            margin: '0 0 0 10px',
                                        }),
                                        input: (provided) => ({
                                            ...provided,
                                            margin: '0 0 0 10px',
                                        }),
                                    }}
                                />
                            </Col>
                        ) : null}
                    </Row>
                    <Row className="Seperated Col">
                        <Col className="Left Column" xs="3">
                            <InputGroup stylee={{ borderRadius: '12px' }}>
                                <div style={{ margin: '10px' }}>
                                    <Image
                                        src={searchImage}
                                        alt="Icon made by Freepik from www.flaticon.com"
                                        style={{
                                            width: '15px',
                                            height: '15px',
                                        }}
                                    />
                                </div>
                                <Input
                                    style={{ border: 'none' }}
                                    placeholder="Search"
                                    value={searchDeck}
                                    onChange={(e) => console.log(e)}
                                />
                                {permissionLevel === 'su' ? (
                                    <div>
                                        <Button
                                            style={{
                                                backgroundColor: '#3e6184',
                                            }}
                                            onClick={() => openAddModuleForm(2)}
                                        >
                                            {' '}
                                            Add Module{' '}
                                        </Button>
                                    </div>
                                ) : null}
                                {permissionLevel === 'pf' ||
                                permissionLevel === 'ta' ? (
                                    <div>
                                        <ButtonDropdown
                                            isOpen={addModuleButtonOpen}
                                            toggle={() =>
                                                setAddModuleButtonOpen(
                                                    !addModuleButtonOpen
                                                )
                                            }
                                        >
                                            <DropdownToggle
                                                style={{
                                                    backgroundColor: '#3e6184',
                                                    borderTopLeftRadius: '0px',
                                                    borderBottomLeftRadius:
                                                        '0px',
                                                }}
                                                caret
                                            >
                                                Add Module
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem
                                                    onClick={() =>
                                                        setOpenForm(1)
                                                    }
                                                >
                                                    {' '}
                                                    Add Existing{' '}
                                                </DropdownItem>
                                                <DropdownItem
                                                    onClick={() =>
                                                        setOpenForm(2)
                                                    }
                                                >
                                                    {' '}
                                                    Add New{' '}
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </ButtonDropdown>
                                    </div>
                                ) : null}
                            </InputGroup>
                            <br />
                            <Modal
                                isOpen={openForm === 1}
                                toggle={() => setOpenForm(1)}
                            >
                                <ModalHeader toggle={() => setOpenForm(1)}>
                                    Existing Modules
                                </ModalHeader>
                                <ModalBody
                                    style={{ padding: '0 20px 30px 20px' }}
                                >
                                    <AddExistingModule
                                        updateModuleList={updateModuleList}
                                        classOptions={classOptions}
                                        currentClass={selectedClass}
                                    />
                                </ModalBody>
                            </Modal>
                            <Collapse isOpen={openForm === 2}>
                                <AddModuleForm
                                    updateModuleList={updateModuleList}
                                    classOptions={classOptions}
                                    currentClass={selectedClass}
                                />
                            </Collapse>
                            <Row>
                                <Col>
                                    {permissionLevel === 'st' ? (
                                        <StudentView
                                            modules={dynamicModules}
                                            updateCurrentModule={
                                                updateCurrentModule
                                            }
                                        />
                                    ) : null}
                                    {permissionLevel === 'pf' ||
                                    permissionLevel === 'ta' ? (
                                        <AdminView
                                            currentClassView={
                                                selectedClass.value
                                            }
                                            modules={dynamicModules}
                                            updateCurrentModule={
                                                updateCurrentModule
                                            }
                                            deleteModule={deleteModule}
                                            editModule={editModule}
                                            unlinkModule={unlinkModule}
                                        />
                                    ) : null}
                                    {permissionLevel === 'su' ? (
                                        <SuperAdminView
                                            modules={dynamicModules}
                                            updateCurrentModule={
                                                updateCurrentModule
                                            }
                                            deleteModule={deleteModule}
                                            editModule={editModule}
                                        />
                                    ) : null}
                                </Col>
                            </Row>
                        </Col>
                        <Col className="Right Column">
                            <MainModuleView
                                currentClass={selectedClass}
                                curModule={currentModule}
                                questions={questions}
                                mentorQuestions={mentorQuestions}
                                updateCurrentModule={updateCurrentModule}
                                allAnswers={allAnswers}
                                modificationWarning={modificationWarning}
                                toggleModificationWarning={
                                    toggleModificationWarning
                                }
                            />
                        </Col>
                    </Row>
                </Container>
            </div>
        </Layout>
    );
}
