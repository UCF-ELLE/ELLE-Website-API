import {
    Col,
    Input,
    InputGroup,
    Button,
    ButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalHeader,
    ModalBody,
    Collapse,
    Row
} from 'reactstrap';
import AddExistingModule from './AddExistingModule';
import AddModuleForm from './AddModuleForm';
import AdminView from './Views/AdminView';
import StudentView from './Views/StudentView';
import SuperAdminView from './Views/SuperAdminView';
import Image from 'next/image';
import searchImage from '@/public/static/images/search.png';
import { useUser } from '@/hooks/useUser';
import React, { useState } from 'react';
import { Module } from '@/types/api/modules';

export default function ModuleSearch({
    modules,
    updateModuleList,
    dynamicModules,
    setDynamicModules,
    selectedClass,
    classOptions,
    updateCurrentModule,
    deleteModule,
    editModule,
    unlinkModule
}: {
    modules: Module[];
    updateModuleList: (task: string, ModuleID?: number) => void;
    dynamicModules: Module[];
    setDynamicModules: (modules: Module[]) => void;
    selectedClass: { value: number; label: string };
    classOptions: { value: number; label: string }[];
    updateCurrentModule: (module?: Module, task?: string) => void;
    deleteModule: (moduleID: number) => void;
    editModule: (name: string, module: Module) => void;
    unlinkModule: (moduleID: number) => void;
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;
    const [searchDeck, setSearchDeck] = useState('');
    const [addModuleButtonOpen, setAddModuleButtonOpen] = useState(false);
    const [openForm, setOpenForm] = useState(0);

    const updateSearchDeck = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newModuleList = modules.filter((module) => {
            return module?.name && module?.name.toLowerCase().includes(e.target.value.toLowerCase());
        });

        setSearchDeck(e.target.value.substring(0, 20));

        console.log('newModuleList', modules, newModuleList);

        setDynamicModules(newModuleList);
    };

    const openAddModuleForm = (num: number) => {
        openForm === num ? setOpenForm(0) : setOpenForm(num);
    };

    return (
        <Col className='Left Column' xs='3'>
            <InputGroup className='shadow' style={{ borderRadius: '12px' }}>
                <div style={{ margin: '10px' }}>
                    <Image
                        src={searchImage}
                        alt='Icon made by Freepik from www.flaticon.com'
                        style={{
                            width: '15px',
                            height: '15px'
                        }}
                    />
                </div>
                <Input style={{ border: 'none' }} placeholder='Search' value={searchDeck} onChange={(e) => updateSearchDeck(e)} />
                {permissionLevel === 'su' ? (
                    <div style={{ display: 'flex' }}>
                        <Button
                            style={{
                                backgroundColor: '#3e6184',
                                borderRadius: '0px 12px 12px 0px'
                            }}
                            onClick={() => openAddModuleForm(2)}
                        >
                            {' '}
                            Add Module{' '}
                        </Button>
                    </div>
                ) : null}
                {permissionLevel === 'pf' || permissionLevel === 'ta' ? (
                    <div>
                        <ButtonDropdown isOpen={addModuleButtonOpen} toggle={() => setAddModuleButtonOpen(!addModuleButtonOpen)}>
                            <DropdownToggle
                                style={{
                                    backgroundColor: '#3e6184',
                                    borderTopLeftRadius: '0px',
                                    borderBottomLeftRadius: '0px'
                                }}
                                caret
                            >
                                Add Module
                            </DropdownToggle>
                            <DropdownMenu>
                                <DropdownItem onClick={() => setOpenForm(1)}> Add Existing </DropdownItem>
                                <DropdownItem onClick={() => setOpenForm(2)}> Add New </DropdownItem>
                            </DropdownMenu>
                        </ButtonDropdown>
                    </div>
                ) : null}
            </InputGroup>
            <br />
            <Modal isOpen={openForm === 1} toggle={() => setOpenForm(1)}>
                <ModalHeader toggle={() => setOpenForm(1)}>Existing Modules</ModalHeader>
                <ModalBody style={{ padding: '0 20px 30px 20px' }}>
                    <AddExistingModule updateModuleList={updateModuleList} classOptions={classOptions} currentClass={selectedClass} />
                </ModalBody>
            </Modal>
            <Collapse isOpen={openForm === 2}>
                <AddModuleForm updateModuleList={updateModuleList} classOptions={classOptions} currentClass={selectedClass} />
            </Collapse>
            <Row>
                <Col>
                    {permissionLevel === 'st' ? <StudentView modules={dynamicModules} updateCurrentModule={updateCurrentModule} /> : null}
                    {permissionLevel === 'pf' || permissionLevel === 'ta' ? (
                        <AdminView
                            currentClassView={selectedClass.value}
                            modules={dynamicModules}
                            updateCurrentModule={updateCurrentModule}
                            deleteModule={deleteModule}
                            editModule={editModule}
                            unlinkModule={unlinkModule}
                        />
                    ) : null}
                    {permissionLevel === 'su' ? (
                        <SuperAdminView
                            modules={dynamicModules}
                            updateCurrentModule={updateCurrentModule}
                            deleteModule={deleteModule}
                            editModule={editModule}
                        />
                    ) : null}
                </Col>
            </Row>
        </Col>
    );
}
