import Image from 'next/image';
import React, { useState } from 'react';
import {
    Button,
    ButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Popover,
    PopoverHeader,
    PopoverBody,
    Form,
    FormGroup,
    Label,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Alert
} from 'reactstrap';

import toolsImage from '@/public/static/images/tools.png';
import deleteImage from '@/public/static/images/delete.png';
import unlinkImage from '@/public/static/images/unlink.png';
import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';

export default function SplitDeckBtn({
    currentModule,
    updateCurrentModule,
    editModule,
    deleteModule,
    unlinkModule,
    currentClassView
}: {
    currentModule: Module;
    updateCurrentModule: (module?: Module, task?: string) => void;
    editModule?: (name: string, module: Module) => void;
    deleteModule?: (moduleID: number) => void;
    unlinkModule?: (moduleID: number) => void;
    currentClassView?: number;
}) {
    const { user } = useUser();
    const permission = user?.permissionGroup;
    const [dropdownOpen, setOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editedModuleName, setName] = useState('');

    const toggle = () => setOpen(!dropdownOpen);
    const togglePopover = () => setPopoverOpen(!popoverOpen);
    const toggleUnlinkModal = () => setUnlinkModalOpen(!unlinkModalOpen);
    const toggleModal = () => setModalOpen(!modalOpen);

    return (
        <ButtonDropdown isOpen={dropdownOpen} toggle={toggle}>
            <Button
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    width: '100%',
                    backgroundColor: '#5faeb5',
                    border: 'none',
                    borderRadius: '0px',
                    overflowX: 'scroll'
                }}
                id={'deckButton' + currentModule.moduleID}
                type='button'
                onClick={() => {
                    updateCurrentModule(currentModule);
                }}
            >
                {currentModule.name}
            </Button>
            <Popover trigger='legacy' placement='bottom' isOpen={popoverOpen} target={'deckButton' + currentModule.moduleID}>
                <PopoverHeader>
                    Edit Module
                    <Button
                        close
                        onClick={() => {
                            togglePopover();
                        }}
                    />
                </PopoverHeader>
                <PopoverBody>
                    <Form>
                        <FormGroup>
                            <Label for='moduleName'>Name:</Label>
                            <Input
                                type='text'
                                name='mName'
                                id='moduleName'
                                autoComplete='off'
                                placeholder={currentModule.name}
                                value={editedModuleName}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </FormGroup>
                        <Button
                            onClick={() => {
                                editModule && editModule(editedModuleName, currentModule);
                                togglePopover();
                            }}
                        >
                            Submit
                        </Button>
                    </Form>
                </PopoverBody>
            </Popover>

            {permission !== 'st' ? (
                <>
                    <DropdownToggle
                        caret
                        color='info'
                        style={{
                            backgroundColor: '#5faeb5',
                            border: 'none',
                            borderRadius: '0px'
                        }}
                    >
                        {''}
                    </DropdownToggle>
                    <DropdownMenu
                        style={{
                            minWidth: '50px',
                            padding: '0px',
                            backgroundColor: 'gray'
                        }}
                    >
                        <DropdownItem
                            style={{
                                padding: '4px 24px 4px 10px',
                                backgroundColor: 'lightcyan',
                                color: 'black',
                                outline: 'none'
                            }}
                            onClick={() => {
                                togglePopover();
                            }}
                        >
                            <Image src={toolsImage} alt='edit icon' style={{ width: '18px', height: '18px' }} /> Edit
                        </DropdownItem>

                        {currentModule.userID === user?.userID || permission === 'su' ? (
                            <DropdownItem
                                style={{
                                    padding: '4px 24px 4px 10px',
                                    backgroundColor: 'lightcoral',
                                    color: 'black',
                                    outline: 'none'
                                }}
                                onClick={() => {
                                    toggleModal();
                                }}
                            >
                                <Image src={deleteImage} alt='trash can icon' style={{ width: '18px', height: '20px' }} /> Delete
                            </DropdownItem>
                        ) : null}

                        {(permission === 'pf' || permission === 'ta') && currentClassView !== 0 && currentModule.userID !== user?.userID ? (
                            <DropdownItem
                                style={{
                                    padding: '4px 24px 4px 10px',
                                    backgroundColor: 'lightsalmon',
                                    color: 'black',
                                    outline: 'none'
                                }}
                                onClick={() => {
                                    toggleUnlinkModal();
                                }}
                            >
                                <Image src={unlinkImage} alt='unlink icon' style={{ width: '18px', height: '20px' }} /> Unlink
                            </DropdownItem>
                        ) : null}
                    </DropdownMenu>
                </>
            ) : null}

            <Modal isOpen={unlinkModalOpen}>
                <ModalHeader toggle={toggleUnlinkModal}>Delete</ModalHeader>
                <ModalBody>
                    <p style={{ paddingLeft: '20px' }}>Are you sure you want to unlink the module: {currentModule.name}?</p>
                </ModalBody>
                <ModalFooter>
                    <Button
                        onClick={() => {
                            toggleUnlinkModal();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color='danger'
                        onClick={() => {
                            unlinkModule && unlinkModule(currentModule.moduleID);
                            toggleUnlinkModal();
                        }}
                    >
                        Unlink
                    </Button>
                </ModalFooter>
            </Modal>

            <Modal isOpen={modalOpen}>
                <ModalHeader toggle={toggleModal}>Delete</ModalHeader>
                <ModalBody>
                    <Alert color='primary'>Deleting this module will remove it from all the users who are currently using this module as well.</Alert>
                    <p style={{ paddingLeft: '20px' }}>Are you sure you want to delete the module: {currentModule.name}?</p>
                </ModalBody>
                <ModalFooter>
                    <Button
                        onClick={() => {
                            toggleModal();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        color='danger'
                        onClick={() => {
                            deleteModule && deleteModule(currentModule.moduleID);
                            toggleModal();
                        }}
                    >
                        Delete
                    </Button>
                </ModalFooter>
            </Modal>
        </ButtonDropdown>
    );
}
