import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Col, Collapse, Input, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';

import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';
import Image from 'next/image';

// This is awful
import { PastaContext, usePasta } from '@/hooks/usePasta';
import cancelImage from '@/public/static/images/cancel.png';
import deleteImage from '@/public/static/images/delete.png';
import submitImage from '@/public/static/images/submit.png';
import toolsImage from '@/public/static/images/tools.png';
import { QuestionFrame } from '@/types/api/pastagame';
import { Typeahead, TypeaheadRef } from 'react-bootstrap-typeahead';
import { Option } from 'react-bootstrap-typeahead/types/types';

export default function QuestionFrame({ questionFrame, curModule }: { questionFrame: QuestionFrame; curModule: Module }) {
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
    const { editQuestionFrame, deleteQuestionFrame } = useContext(PastaContext);

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

        const editedQuestionFrame: QuestionFrame = {
            qframeID: questionFrame.qframeID,
            moduleID: questionFrame.moduleID,
            displayName: editedDisplayName,
            category: editedCategory,
            splitQuestionVar: editedSplitQuestionVar,
            identifyQuestionVar: editedIdentifyQuestionVar,
            mc1QuestionText: editedMC1QuestionText,
            mc1Options: editedMC1Options,
            mc2QuestionText: editedMC2QuestionText,
            mc2Options: editedMC2Options
        };
        console.log(editedQuestionFrame);

        editQuestionFrame(editedQuestionFrame);
    };

    //toggling delete modal, is not related to delete card API
    const handleDelete = () => {
        setModal(!modal);
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
                            <Button color='danger' onClick={(e) => deleteQuestionFrame(questionFrame.qframeID)}>
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
        <tr className='no-hover'>
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
    // Likely a better way to implement this, React Bootstrap Typeahead is a bit of a pain to work with for custom inputs
    // Sets the visual state of the selected typeahead options
    const [editedMC1Typeahead, setEditedMC1Typeahead] = useState<Option[]>(editedMC1Options || []);
    const [editedMC2Typeahead, setEditedMC2Typeahead] = useState<Option[]>(editedMC2Options || []);

    // Sets the input value of the typeahead, used for hiding the menu when the input is an already selected option
    const [editedMC1Input, setEditedMC1Input] = useState<string>('');
    const [editedMC2Input, setEditedMC2Input] = useState<string>('');

    const ref1 = React.createRef<TypeaheadRef>();
    const ref2 = React.createRef<TypeaheadRef>();

    useEffect(() => {
        if (editedMC1Options?.includes(editedMC1Input)) {
            ref1.current?.hideMenu();
        }
    }, [editedMC1Input, editedMC1Options, ref1]);

    useEffect(() => {
        if (editedMC2Options?.includes(editedMC2Input)) {
            ref2.current?.hideMenu();
        }
    }, [editedMC2Input, editedMC2Options, ref2]);

    return (
        <tr className='no-hover'>
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
                                <label>Identity Question:</label>
                                <Input
                                    type='text'
                                    name='editedIdentifyQuestionVar'
                                    onChange={(e) => setEditedIdentifyQuestionVar(e.target.value)}
                                    placeholder='the root(s)'
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
                                {editedIdentifyQuestionVar ? (
                                    <div>
                                        Identify <Badge>{editedIdentifyQuestionVar}</Badge> of this <Badge>{displayName || category}</Badge>.
                                    </div>
                                ) : (
                                    <div className='text-secondary'>No identity question entered yet!</div>
                                )}
                            </Col>
                        </Row>
                        <Row style={{ padding: '12px 0px' }}>
                            <Col>
                                <label>First Multiple Choice Question:</label>
                                <Input
                                    type='text'
                                    name='editedMC1QuestionText'
                                    onChange={(e) => setEditedMC1QuestionText(e.target.value)}
                                    value={editedMC1QuestionText || ''}
                                />
                            </Col>
                            <Col>
                                <label>First Multiple Choice Answers:</label>
                                <Typeahead
                                    id='editedMC1Options'
                                    multiple
                                    minLength={1}
                                    ref={ref1}
                                    inputProps={{ readOnly: editedMC1Options && editedMC1Options?.length >= 4 }}
                                    open={editedMC1Options && editedMC1Options?.length >= 4 ? false : undefined}
                                    allowNew={(res, props) => {
                                        if (props.selected.length >= 4) return false;
                                        if (editedMC1Options?.includes(props.text)) {
                                            return false;
                                        }
                                        return true;
                                    }}
                                    onInputChange={(input) => setEditedMC1Input(input)}
                                    onChange={(selected) => {
                                        setEditedMC1Typeahead(selected);
                                        setEditedMC1Options(selected.map((option) => (typeof option === 'string' ? option : option.label)));
                                    }}
                                    options={[]}
                                    placeholder='Enter options...'
                                    emptyLabel='Enter option...'
                                    selected={editedMC1Typeahead}
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
                                    value={editedMC2QuestionText || ''}
                                />
                            </Col>
                            <Col>
                                <label>Second Multiple Choice Answers:</label>
                                <Typeahead
                                    id='editedMC2Options'
                                    multiple
                                    ref={ref2}
                                    minLength={1}
                                    inputProps={{ readOnly: editedMC2Options && editedMC2Options?.length >= 4 }}
                                    open={editedMC2Options && editedMC2Options?.length >= 4 ? false : undefined}
                                    allowNew={(res, props) => {
                                        if (props.selected.length >= 4) return false;
                                        if (editedMC2Options?.includes(props.text)) {
                                            return false;
                                        }
                                        return true;
                                    }}
                                    onInputChange={(input) => setEditedMC2Input(input)}
                                    onChange={(selected) => {
                                        setEditedMC2Typeahead(selected);
                                        setEditedMC2Options(selected.map((option) => (typeof option === 'string' ? option : option.label)));
                                    }}
                                    options={[]}
                                    placeholder='Enter answers...'
                                    emptyLabel='Enter answer...'
                                    selected={editedMC2Typeahead}
                                />
                            </Col>
                        </Row>
                    </div>
                </Collapse>
            </td>
        </tr>
    );
};
