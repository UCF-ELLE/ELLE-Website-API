import React, { Component, useEffect, useState } from 'react';
import {
    Collapse,
    ButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Card,
    Input,
    InputGroup,
    Container,
    Row,
    Col,
    Alert,
    Label,
    Modal,
    ModalHeader,
    ModalBody,
    Button,
} from 'reactstrap';
import axios from 'axios';
import Select from 'react-select';
import Layout from '@/app/layout';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/router';

import searchImage from '@/public/images/search.png';
import Image from 'next/image';
import AddModule from '@/components/Modules/AddModule';
import AddExistingModule from '@/components/Modules/AddExistingModule';
import StudentView from '@/components/Modules/Views/StudentView';
import AdminView from '@/components/Modules/Views/AdminView';
import SuperAdminView from '@/components/Modules/Views/SuperAdminView';

type AnswerType = {
    front: string;
    back: string;
    type: string;
    termID: number;
};

type ModuleType = {
    moduleID: number;
    name: string;
    language: string;
    complexity: number;
    groupID: number[];
    userID: number;
};

type EventType = {
    module: ModuleType;
    task?: string;
};

type ClassType = {
    groupID: number;
    groupName: string;
    accessLevel: string;
}

type GroupType = {
    groupID: number;
    groupName: string;
    accessLevel: string;
}

export default function Modules() {
    const { user } = useUser();
    const router = useRouter();

    const [modules, setModules] = useState<ModuleType[]>([]);
    const [dynamicModules, setDynamicModules] = useState<ModuleType[]>([]);
    const [mentorQuestions, setMentorQuestions] = useState([]);
    const [currentModule, setCurrentModule] = useState<ModuleType>();
    const [cards, setCards] = useState([]);
    const [allAnswers, setAllAnswers] = useState<AnswerType[]>([]);
    const [searchDeck, setSearchDeck] = useState('');
    const [addModuleButtonOpen, setAddModuleButtonOpen] = useState(false);
    const [openForm, setOpenForm] = useState(0);
    const [emptyCollection, setEmptyCollection] = useState(false);
    const [modificationWarning, setModificationWarning] = useState(false);
    const [selectedClass, setSelectedClass] = useState({
        value: 0,
        label: 'All',
    });
    const [classChanged, setClassChanged] = useState(false);
    const [classes, setClasses] = useState<ClassType[]>([]);
    const [groupPermissionLevels, setGroupPermissionLevels] = useState<GroupType[]>([]);
    const [permission, setCurrentPermissionLevel] = useState(
        user?.permissionGroup
    );

    useEffect(() => {
        verifyPermission();
        updateModuleList('initialize');
        getClasses();
        getGroupPermissionLevels();
    }, []);

    const verifyPermission = () => {
        if (!user || !permission) router.push('/home');
    };

    //function for updating the module list on the sidebar with what's in the database
    const updateModuleList = (task: string, moduleID?: number) => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: {
                groupID:
                    permission === 'ta'
                        ? selectedClass.value
                        : null,
            },
        };

        axios.get('/elleapi/retrieveusermodules', header).then((res) => {
            let allModules = res.data;

            if (allModules.length === 0) {
                toggleEmptyCollectionAlert();
                return;
            }

            if (selectedClass.value === 0) {
                setModules(allModules);
                setDynamicModules(allModules);
                setClassChanged(false);
            }

            //when a new module is added you want to display that new module
            if (task === 'add') {
                let newModule = allModules.find(
                    (module: ModuleType) => module.moduleID === moduleID
                );
                updateCurrentModule({ module: newModule, task: 'all' });
            } else if (task === 'unlink') {
                if (moduleID === currentModule?.moduleID)
                    updateCurrentModule({ module: allModules[0] });
            } else if (task === 'initialize' || task === 'change') {
                updateCurrentModule({ module: allModules[0] });
            } else {
                let groupSpecificModules = allModules.filter(
                    (module: ModuleType) =>
                        module.groupID !== null &&
                        module.groupID.indexOf(selectedClass.value) !== -1
                );

                if (groupSpecificModules.length === 0) {
                    setDynamicModules([]);
                    setCurrentModule(undefined);
                    setClassChanged(false);
                    toggleEmptyCollectionAlert();
                    return;
                }

                setModules(allModules);
                setDynamicModules(groupSpecificModules);
                setClassChanged(false);

                //when a new module is added you want to display that new module
                if (task === 'add') {
                    let newModule = groupSpecificModules.find(
                        (module: ModuleType) => module.moduleID === moduleID
                    );
                    updateCurrentModule({
                        module: newModule,
                        task: 'add',
                    });
                } else if (task === 'unlink') {
                    if (moduleID === currentModule?.moduleID)
                        updateCurrentModule({
                            module: groupSpecificModules[0],
                        });
                }
                //when the page is first initialized or when the class context has changed then display the first module in the list
                else if (task === 'change') {
                    updateCurrentModule({
                        module: groupSpecificModules[0],
                    });
                }
            }
        });
    };

    //function for getting the elements in the current module
    const updateCurrentModule = (event: EventType) => {
        const data = {
            moduleID: event.module.moduleID,
        };

        const header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        axios
            .post('/elleapi/modulequestions', data, header)
            .then((res) => {
                let cards = res.data;

                setCards(cards);
                setCurrentModule(event.module);

                if (event.task) {
                    toggleModificationWarning('new');
                } else toggleModificationWarning('update');

                getAllAnswers();
            })
            .catch(function (error) {
                console.log('updateCurrentModule error: ', error);
            });

        axios
            .post('/elleapi/getmentorquestions', data, header)
            .then((res) => {
                let questions = res.data;

                setMentorQuestions(questions);
            })
            .catch(function (error) {
                console.log('updateCurrentModule error: ', error);
            });
    };

    const getAllAnswers = () => {
        let allAnswersInDB: AnswerType[] = [];

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: { language: currentModule?.language },
        };

        axios
            .get('/elleapi/term', header)
            .then((res) => {
                allAnswersInDB = res.data;

                //gets rid of responses that have type "PH", for phrases
                allAnswersInDB = allAnswersInDB.filter((answer: AnswerType) => {
                    if (answer.type !== 'PH') {
                        return true;
                    } else {
                        return false;
                    }
                });

                // //gets tje information we'll actually use from the get response
                // allAnswersInDB = allAnswersInDB.map((answer: AnswerType) => {
                //     return {
                //         front: answer.front, //Foreign version of the word
                //         back: answer.back, //English version of the word
                //         termID: answer.termID,
                //         type: answer.type,
                //     };
                // });

                //removes duplicates
                let frontArray = [];
                let allAnswersMinusDupes: AnswerType[] = [];
                for (let i = 0; i < allAnswersInDB.length; i++) {
                    if (frontArray.indexOf(allAnswersInDB[i].front) === -1) {
                        frontArray.push(allAnswersInDB[i].front);
                        allAnswersMinusDupes.push(allAnswersInDB[i]);
                    }
                }

                setAllAnswers(allAnswersMinusDupes);
            })
            .catch((error) => {
                console.log('error in getAllAnswers: ', error);
            });
    };

    //function for editing the name of a module
    const editModule = (editedName: string, event: EventType) => {
        const data = {
            moduleID: event.module.moduleID,
            name: editedName,
            language: event.module.language,
            complexity: 2, //all modules will have complexity 2
            groupID:
                permission === 'st' ? selectedClass.value : null,
        };

        let header = {
            headers: { Authorization: 'Bearer ' + localStorage.getItem('jwt') },
        };

        axios
            .put('/elleapi/module', data, header)
            .then((res) => {
                updateModuleList('edit');

                if (currentModule?.moduleID === event.module.moduleID) {
                    setCurrentModule(res.data);
                }
            })
            .catch(function (error) {
                console.log('editModule error: ', error);
            });
    };

    //function for deleting a module
    const deleteModule = (id: number) => {
        let header = {
            data: {
                moduleID: id,
                groupID:
                    permission === 'st'
                        ? selectedClass.value
                        : null,
            },
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        axios
            .delete('/elleapi/module', header)
            .then((res) => {
                updateModuleList('delete');

                if (id === currentModule?.moduleID)
                    updateCurrentModule({ module: modules[0] });
            })
            .catch(function (error) {
                console.log('deleteModule error: ', error.response);
            });
    };

    //function to unlink a module from a group
    const unlinkModule = (id: number) => {
        const data = {
            moduleID: id,
            groupID: selectedClass.value,
        };

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        axios
            .post('/elleapi/addmoduletogroup', data, header)
            .then((res) => {
                updateModuleList('unlink', id);
            })
            .catch(function (error) {
                console.log(error.message);
            });
    };

    //function for making the searchbar for the module list work
    const updateSearchDeck = (e: React.ChangeEvent<HTMLInputElement>) => {
        //returns true if any part of module name matches the search string
        let newModuleList = modules.filter((module: ModuleType) => {
            if (module) {
                return (
                    module.name
                        .toLowerCase()
                        .indexOf(e.target.value.toLowerCase()) !== -1
                );
            } else {
                return false;
            }
        });

        setSearchDeck(e.target.value.substring(0, 20));
        setDynamicModules(newModuleList);
    };

    //function that toggles whether or not the new module form is shown
    const toggleAddModuleButton = () => {
        setAddModuleButtonOpen(!addModuleButtonOpen);
    };

    //function that determines which form is open
    const setOpenFormFunction = (openedForm: number) => {
        //if the form is open at the moment then close it by setting it back to form 0, which is the closed state
        if (openForm === openedForm) {
            setOpenForm(0);
        } else {
            //else set the state of the open form to the form # that you want to open
            setOpenForm(openedForm);
        }
    };

    //function that toggles whether or not the empty collection alert is shown
    const toggleEmptyCollectionAlert = () => {
        setEmptyCollection(!emptyCollection);
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
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        axios
            .get('/elleapi/searchusergroups', header)
            .then((res) => {
                setClasses(res.data);
            })
            .catch((error) => {
                console.log('getClasses error: ', error);
            });
    };

    const updateClassContext = (value: { value: number; label: string }) => {

        if (value !== null) {
            let currentClass = groupPermissionLevels.find(
                (group) => group.groupID === value.value
            );

            setSelectedClass(value);
            setClassChanged(true);

            value.value === 0
                ? verifyPermission()
                : setCurrentPermissionLevel(currentClass?.accessLevel);
        } else {
            setSelectedClass({ value: 0, label: 'All' });
            setClassChanged(true);
            verifyPermission();
        }
    };

    const getGroupPermissionLevels = () => {
        axios
            .get('/elleapi/userlevels', {
                headers: {
                    Authorization: 'Bearer ' + user?.jwt,
                },
            })
            .then((res) => {
                setGroupPermissionLevels(res.data);
            })
            .catch((error) => {
                console.log('getPermissionLevels error: ', error);
            });
    };

    let classOptions = [];
    classOptions.push({ value: 0, label: 'All' });

    classes.map((item) => {
        classOptions.push({ value: item.groupID, label: item.groupName });
    });

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

                        {permission !== 'su' ? (
                            <Col
                                className="Right Column"
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                }}
                            >
                                {/*Class Context*/}
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
                                    options={classOptions}
                                    className="basic-single"
                                    classNamePrefix="select"
                                    isClearable={true}
                                    value={selectedClass}
                                    onChange={(e) => updateClassContext({ value: e?.value as number, label: e?.label as string})}
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
                                {/* {classChanged
                                    ? updateModuleList('change')
                                    : null} */}
                            </Col>
                        ) : null}
                    </Row>
                    <Row className="Seperated Col">
                        <Col className="Left Column" xs="3">
                            {/*Search Bar for module list*/}
                            <InputGroup style={{ borderRadius: '12px' }}>
                                <div
                                    style={{ margin: '10px' }}
                                >
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
                                    onChange={(e) => updateSearchDeck(e)}
                                />
                                {permission === 'su' ? (
                                    <div>
                                        <Button
                                            style={{
                                                backgroundColor: '#3e6184',
                                            }}
                                            onClick={() => setOpenForm(2)}
                                        >
                                            {' '}
                                            Add Module{' '}
                                        </Button>
                                    </div>
                                ) : null}
                                {permission === 'pf' ||
                                permission === 'ta' ? (
                                    <div>
                                        <ButtonDropdown
                                            isOpen={
                                                addModuleButtonOpen
                                            }
                                            toggle={toggleAddModuleButton}
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
                            {/*Form for adding an existing Module*/}
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

                            {/*Form for adding a new Module*/}
                            <Collapse isOpen={openForm === 2}>
                                <AddModule
                                    updateModuleList={updateModuleList}
                                    classOptions={classOptions}
                                    currentClass={selectedClass}
                                />
                            </Collapse>

                            <Row>
                                <Col>
                                    {permission ===
                                    'st' ? (
                                        <StudentView
                                            modules={dynamicModules}
                                            updateCurrentModule={updateCurrentModule}
                                        />
                                    ) : null}
                                    {permission ===
                                        'pf' ||
                                    permission ===
                                        'ta' ? (
                                        <AdminView
                                            currentClassView={
                                                selectedClass.value
                                            }
                                            modules={dynamicModules}
                                            updateCurrentModule={updateCurrentModule
                                            }
                                            deleteModule={deleteModule}
                                            editModule={editModule}
                                            unlinkModule={unlinkModule}
                                        />
                                    ) : null}
                                    {permission ===
                                    'su' ? (
                                        <SuperAdminView
                                            modules={dynamicModules}
                                            updateCurrentModule={updateCurrentModule
                                            }
                                            deleteModule={deleteModule}
                                            editModule={editModule}
                                        />
                                    ) : null}
                                </Col>
                            </Row>
                        </Col>
                        <Col className="Right Column">
                            <Row>
                                <Col>
                                    {/*Either the contents of current module, or alert saying there are no modules*/}
                                    {currentModule ? (
                                        <Module
                                            currentClass={
                                                selectedClass
                                            }
                                            curModule={currentModule}
                                            cards={cards}
                                            updateCurrentModule={
                                                updateCurrentModule
                                            }
                                            allAnswers={allAnswers}
                                            modificationWarning={
                                                modificationWarning
                                            }
                                            toggleModificationWarning={
                                                toggleModificationWarning
                                            }
                                            mentorQuestions={
                                                mentorQuestions
                                            }
                                        />
                                    ) : (
                                        <Alert
                                            isOpen={emptyCollection}
                                        >
                                            {permission !== 'st'
                                                ? 'You have no modules in this class, please create one by clicking on the Add Module Button to your left.'
                                                : 'There are currently no modules in this class.'}
                                        </Alert>
                                    )}
                                    <br />
                                    <br />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </div>
        </Layout>
    );
}
