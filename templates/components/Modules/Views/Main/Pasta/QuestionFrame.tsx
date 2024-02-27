import React, { Fragment, useMemo, useState } from 'react';
import { Alert, Button, ButtonGroup, Modal, ModalHeader, ModalBody, ModalFooter, Collapse, Input, Badge, Row, Col } from 'reactstrap';
import axios from 'axios';

import { Module } from '@/types/api/modules';
import { useUser } from '@/hooks/useUser';
import Image from 'next/image';

// This is awful
import toolsImage from '@/public/static/images/tools.png';
import deleteImage from '@/public/static/images/delete.png';
import submitImage from '@/public/static/images/submit.png';
import cancelImage from '@/public/static/images/cancel.png';
import { QuestionFrame } from '@/types/api/pastagame';
import { Typeahead } from 'react-bootstrap-typeahead';

export default function QuestionFrame({
    questionFrame,
    currentClass,
    updateCurrentModule,
    curModule
}: {
    questionFrame: QuestionFrame;
    currentClass: { value: number; label: string };
    updateCurrentModule: (module?: Module, task?: string) => void;
    curModule: Module;
}) {
    const [modal, setModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedDisplayName, setEditedDisplayName] = useState(questionFrame.displayName);
    const [editedCategory, setEditedCategory] = useState(questionFrame.category);
    const [editedSplitQuestionVar, setEditedSplitQuestionVar] = useState(questionFrame.splitQuestionVar);
    const [editedIdentifyQuestionVar, setEditedIdentifyQuestionVar] = useState(questionFrame.identifyQuestionVar);
    const [editedMC1QuestionText, setEditedMC1QuestionText] = useState(questionFrame.mc1QuestionText);
    const [editedMC1Options, setEditedMC1Options] = useState(questionFrame.mc1Options);
    const [editedMC2QuestionText, setEditedMC2QuestionText] = useState(questionFrame.mc2QuestionText);
    const [editedMC2Options, setEditedMC2Options] = useState(questionFrame.mc2Options);

    const [rowCollapse, setRowCollapse] = useState(false);

    const { user, loading } = useUser();
    const permissionLevel = user?.permissionGroup;

    //function that gets called when the edit button is pushed. Sets editmode to true
    const editCard = () => {
        setEditMode(true);
        setRowCollapse(true);
    };

    //function that submits all of the edited data put on a card
    const submitEdit = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setEditMode(false);

        const data = new FormData();
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        data.append('qframeID', questionFrame.qframeID.toString());
        editedDisplayName && data.append('displayName', editedDisplayName);
        editedCategory && data.append('category', editedCategory);
        editedSplitQuestionVar && data.append('splitQuestionVar', editedSplitQuestionVar); //not editable

        if (permissionLevel === 'ta') {
            data.append('groupID', currentClass.value.toString());
        }

        editedIdentifyQuestionVar && data.append('identityLeadup', editedIdentifyQuestionVar);

        editedMC1QuestionText && data.append('mc1QuestionText', editedMC1QuestionText);
        editedMC1Options && data.append('mc1Options', JSON.stringify(editedMC1Options));

        editedMC2QuestionText && data.append('mc2QuestionText', editedMC2QuestionText);
        editedMC2Options && data.append('mc2Options', JSON.stringify(editedMC2Options));

        axios
            .put('/elleapi/pastagame/qframe', data, header)
            .then((res) => {
                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('submitEdit in Card.js error: ', error.response);
            });
    };

    //toggling delete modal, is not related to delete card API
    const handleDelete = () => {
        setModal(!modal);
    };

    //function for deleting a card from the database
    const deleteQuestionFrame = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setModal(!modal);

        let header = {
            data: {
                qframeID: questionFrame.qframeID,
                groupID: permissionLevel === 'ta' ? currentClass.value : null
            },
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .delete('/elleapi/pastagame/qframe', header)
            .then((res) => {
                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('deleteTerm in Card.js error: ', error.response);
            });
    };

    //function that cancels the edit and sets everything back to what it was initially
    const handleCancelEdit = () => {
        setEditMode(false);
        setEditedDisplayName(questionFrame.displayName);
        setEditedCategory(questionFrame.category);
        setEditedSplitQuestionVar(questionFrame.splitQuestionVar);
        setEditedIdentifyQuestionVar(questionFrame.identifyQuestionVar);
        setEditedMC1QuestionText(questionFrame.mc1QuestionText);
        setEditedMC1Options(questionFrame.mc1Options);
        setEditedMC2QuestionText(questionFrame.mc2QuestionText);
        setEditedMC2Options(questionFrame.mc2Options);
        setRowCollapse(false);
    };

    if (editMode === false) {
        return (
            <Fragment>
                <tr onClick={() => setRowCollapse(!rowCollapse)}>
                    <td>{editedDisplayName}</td>
                    <td>{editedCategory}</td>
                    <td>
                        {' '}
                        Split the <Badge>{editedDisplayName || editedCategory}</Badge> by its <Badge>{editedSplitQuestionVar}</Badge>.
                    </td>

                    {permissionLevel !== 'st' ? (
                        <td>
                            <ButtonGroup>
                                <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => editCard()}>
                                    <Image
                                        src={toolsImage}
                                        alt='edit icon'
                                        style={{
                                            width: '25px',
                                            height: '25px'
                                        }}
                                    />
                                </Button>
                                <Button
                                    style={{
                                        backgroundColor: 'lightcoral'
                                    }}
                                    onClick={handleDelete}
                                >
                                    <Image
                                        src={deleteImage}
                                        alt='trash can icon'
                                        style={{
                                            width: '25px',
                                            height: '25px'
                                        }}
                                    />
                                </Button>
                            </ButtonGroup>
                        </td>
                    ) : null}

                    <Modal isOpen={modal} toggle={() => setModal(!modal)}>
                        <ModalHeader toggle={() => setModal(!modal)}>Delete</ModalHeader>

                        <ModalBody>
                            <Alert color='primary'>
                                Deleting this question frame will remove it from all the users who are currently using this module as well. It will
                                also remove all of the pastas associated with it.
                            </Alert>
                            <p style={{ paddingLeft: '20px' }}>Are you sure you want to delete the question frame: {editedDisplayName}?</p>
                        </ModalBody>

                        <ModalFooter>
                            <Button onClick={() => setModal(!modal)}>Cancel</Button>
                            <Button color='danger' onClick={(e) => deleteQuestionFrame(e)}>
                                Delete
                            </Button>
                        </ModalFooter>
                    </Modal>
                </tr>
                <CollapseRow
                    editedDisplayName={editedDisplayName}
                    editedIdentifyQuestionVar={editedIdentifyQuestionVar}
                    editedCategory={editedCategory}
                    editedMC1QuestionText={editedMC1QuestionText}
                    editedMC1Options={editedMC1Options}
                    editedMC2QuestionText={editedMC2QuestionText}
                    editedMC2Options={editedMC2Options}
                    rowCollapse={rowCollapse}
                />
            </Fragment>
        );
    } else {
        return (
            <Fragment>
                <tr>
                    <td>
                        <Input
                            type='text'
                            name='editedDisplayName'
                            onChange={(e) => setEditedDisplayName(e.target.value)}
                            value={editedDisplayName}
                        />
                    </td>

                    <td>
                        <Input type='text' name='editedFront' onChange={(e) => setEditedCategory(e.target.value)} value={editedCategory} />
                    </td>

                    <td>
                        <Input
                            type='text'
                            name='editedFront'
                            onChange={(e) => setEditedSplitQuestionVar(e.target.value)}
                            value={editedSplitQuestionVar}
                        />
                    </td>

                    <td>
                        <ButtonGroup>
                            <Button style={{ backgroundColor: 'lightcyan' }} onClick={(e) => submitEdit(e)}>
                                <Image
                                    src={submitImage}
                                    alt='Icon made by Becris from www.flaticon.com'
                                    style={{
                                        width: '25px',
                                        height: '25px'
                                    }}
                                />
                            </Button>
                            <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => handleCancelEdit()}>
                                <Image
                                    src={cancelImage}
                                    alt='Icon made by Freepik from www.flaticon.com'
                                    style={{
                                        width: '25px',
                                        height: '25px'
                                    }}
                                />
                            </Button>
                        </ButtonGroup>
                    </td>
                </tr>
                <CollapseEditRow
                    displayName={editedDisplayName}
                    category={editedCategory}
                    editedIdentifyQuestionVar={editedIdentifyQuestionVar}
                    setEditedIdentifyQuestionVar={setEditedIdentifyQuestionVar}
                    editedMC1QuestionText={editedMC1QuestionText}
                    setEditedMC1QuestionText={setEditedMC1QuestionText}
                    editedMC1Options={editedMC1Options}
                    setEditedMC1Options={setEditedMC1Options}
                    editedMC2QuestionText={editedMC2QuestionText}
                    setEditedMC2QuestionText={setEditedMC2QuestionText}
                    editedMC2Options={editedMC2Options}
                    setEditedMC2Options={setEditedMC2Options}
                />
            </Fragment>
        );
    }
}

const CollapseRow = ({
    editedDisplayName,
    editedIdentifyQuestionVar,
    editedCategory,
    editedMC1QuestionText,
    editedMC1Options,
    editedMC2QuestionText,
    editedMC2Options,
    rowCollapse
}: {
    editedDisplayName?: string;
    editedIdentifyQuestionVar?: string;
    editedCategory: string;
    editedMC1QuestionText?: string;
    editedMC1Options?: string[];
    editedMC2QuestionText?: string;
    editedMC2Options?: string[];
    rowCollapse: boolean;
}) => {
    return (
        <tr>
            <td
                style={{
                    border: 'none',
                    padding: 0
                }}
                colSpan={4}
            >
                <Collapse isOpen={rowCollapse}>
                    <div style={{ padding: 12 }}>
                        {editedIdentifyQuestionVar && (
                            <Row
                                style={{
                                    paddingBottom: 12,
                                    borderBottom: editedMC1QuestionText || editedMC2QuestionText ? '1px solid #dee2e6' : undefined
                                }}
                            >
                                <Col>Identify Question:</Col>
                                <Col>
                                    Identify <Badge>{editedIdentifyQuestionVar}</Badge> of this <Badge>{editedDisplayName || editedCategory}</Badge>.
                                </Col>
                            </Row>
                        )}
                        {editedMC1QuestionText && (
                            <Row
                                style={{
                                    padding: '12px 0px',
                                    borderBottom: editedMC2QuestionText ? '1px solid #dee2e6' : undefined
                                }}
                            >
                                <Col>{editedMC1QuestionText}</Col>
                                <Col>
                                    <div>Answers:</div>
                                    <span style={{ display: 'flex', gap: 8 }}>
                                        {editedMC1Options?.map((option, index) => {
                                            return (
                                                <Badge
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    {option}
                                                </Badge>
                                            );
                                        })}
                                    </span>
                                </Col>
                            </Row>
                        )}
                        {editedMC2QuestionText && (
                            <Row
                                style={{
                                    padding: '12px 0px'
                                }}
                            >
                                <Col>{editedMC2QuestionText}</Col>
                                <Col>
                                    <div>Answers:</div>
                                    <span style={{ display: 'flex', gap: 12 }}>
                                        {editedMC2Options?.map((option, index) => {
                                            return (
                                                <Badge
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    {option}
                                                </Badge>
                                            );
                                        })}
                                    </span>
                                </Col>
                            </Row>
                        )}
                    </div>
                </Collapse>
            </td>
        </tr>
    );
};

const CollapseEditRow = ({
    displayName,
    category,
    editedIdentifyQuestionVar,
    setEditedIdentifyQuestionVar,
    editedMC1QuestionText,
    setEditedMC1QuestionText,
    editedMC1Options,
    setEditedMC1Options,
    editedMC2QuestionText,
    setEditedMC2QuestionText,
    editedMC2Options,
    setEditedMC2Options
}: {
    displayName?: string;
    category: string;
    editedIdentifyQuestionVar?: string;
    setEditedIdentifyQuestionVar: (value: string) => void;
    editedMC1QuestionText?: string;
    setEditedMC1QuestionText: (value: string) => void;
    editedMC1Options?: string[];
    setEditedMC1Options: (value: string[]) => void;
    editedMC2QuestionText?: string;
    setEditedMC2QuestionText: (value: string) => void;
    editedMC2Options?: string[];
    setEditedMC2Options: (value: string[]) => void;
}) => {
    return (
        <tr>
            <td
                style={{
                    border: 'none',
                    padding: 0
                }}
                colSpan={4}
            >
                <Collapse isOpen={true}>
                    <div style={{ padding: 12 }}>
                        <Row
                            style={{
                                padding: '12px 0px'
                            }}
                        >
                            <Col>
                                <label>What to Identify:</label>
                                <Input
                                    type='text'
                                    name='editedIdentifyQuestionVar'
                                    onChange={(e) => setEditedIdentifyQuestionVar(e.target.value)}
                                    placeholder='the root'
                                    value={editedIdentifyQuestionVar}
                                />
                            </Col>
                            <Col
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <div>
                                    Identify <Badge>{editedIdentifyQuestionVar}</Badge> of this <Badge>{displayName || category}</Badge>.
                                </div>
                            </Col>
                        </Row>
                        <Row style={{ padding: '12px 0px' }}>
                            <Col>
                                <label>First Multiple Choice Question:</label>
                                <Input
                                    type='text'
                                    name='editedMC1QuestionText'
                                    onChange={(e) => setEditedMC1QuestionText(e.target.value)}
                                    value={editedMC1QuestionText}
                                />
                            </Col>
                            <Col>
                                <label>First Multiple Choice Answers:</label>
                                {/* Typeahead component, limit to 5 options */}
                                <Typeahead
                                    id='editedMC1Options'
                                    multiple
                                    inputProps={{
                                        readOnly: editedMC1Options && editedMC1Options?.length >= 4
                                    }}
                                    allowNew={(res, props) => {
                                        if (props.selected.length >= 4) {
                                            return false;
                                        }
                                        return true;
                                    }}
                                    onChange={(selected) => setEditedMC1Options(selected as string[])}
                                    options={editedMC1Options || []}
                                    placeholder='Enter options...'
                                    emptyLabel='Enter option...'
                                    selected={editedMC1Options}
                                />
                            </Col>
                        </Row>
                        <Row style={{ padding: '12px 0px' }}>
                            <Col>
                                <label>Second Multiple Choice Question:</label>
                                <Input
                                    type='text'
                                    name='editedMC2QuestionText'
                                    onChange={(e) => setEditedMC2QuestionText(e.target.value)}
                                    value={editedMC2QuestionText}
                                />
                            </Col>
                            <Col>
                                <label>Second Multiple Choice Answers:</label>
                                <Typeahead
                                    id='editedMC2Options'
                                    multiple
                                    allowNew={(res, props) => {
                                        if (props.selected.length >= 4) {
                                            return false;
                                        }
                                        return true;
                                    }}
                                    onChange={(selected) => setEditedMC2Options(selected as string[])}
                                    options={editedMC2Options || []}
                                    placeholder='Enter options...'
                                    emptyLabel='Enter option...'
                                    selected={editedMC2Options}
                                />
                            </Col>
                        </Row>
                    </div>
                </Collapse>
            </td>
        </tr>
    );
};
