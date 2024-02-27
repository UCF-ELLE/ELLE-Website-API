import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { Alert, Button, ButtonGroup, Modal, ModalHeader, ModalBody, ModalFooter, Collapse, Input, Badge, Row, Col } from 'reactstrap';
import axios from 'axios';

import { Module } from '@/types/api/modules';
import { Tag } from '@/types/api/terms';
import { useUser } from '@/hooks/useUser';
import Image from 'next/image';

// This is awful
import toolsImage from '@/public/static/images/tools.png';
import deleteImage from '@/public/static/images/delete.png';
import submitImage from '@/public/static/images/submit.png';
import cancelImage from '@/public/static/images/cancel.png';
import { Pasta, QuestionFrame } from '@/types/api/pastagame';
import { SplitComponent } from '../Forms/Pasta/SplitComponent';
import { Typeahead } from 'react-bootstrap-typeahead';
import { split } from 'postcss/lib/list';

export default function Pasta({
    pasta,
    currentClass,
    questionFrames,
    reloadPastas,
    curModule
}: {
    pasta: Pasta;
    questionFrames: QuestionFrame[];
    currentClass: { value: number; label: string };
    reloadPastas: () => void;
    curModule: Module;
}) {
    const [modal, setModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedCategory, setEditedCategory] = useState(pasta.category);
    const [editedUtterance, setEditedUtterance] = useState(pasta.utterance);
    const [editedSplitAnswer, setEditedSplitAnswer] = useState(pasta.splitAnswer);
    const [editedIdentifyAnswer, setEditedIdentifyAnswer] = useState(pasta.identifyAnswer);
    const [editedMC1Answer, setEditedMC1Answer] = useState(pasta.mc1Answer);
    const [editedMC2Answer, setEditedMC2Answer] = useState(pasta.mc2Answer);

    const [rowCollapse, setRowCollapse] = useState(false);
    const questionFrame = questionFrames.find((qf) => qf.category === editedCategory);

    const { user, loading } = useUser();
    const permissionLevel = user?.permissionGroup;

    //function that gets called when the edit button is pushed. Sets editmode to true
    const editCard = () => {
        setEditMode(true);
    };

    //function that submits all of the edited data put on a card
    const submitEdit = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setEditMode(false);

        const data = new FormData();
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        data.append('pastaID', pasta.pastaID.toString());
        editedUtterance && data.append('utterance', editedUtterance);
        editedCategory && data.append('category', editedCategory);
        editedSplitAnswer && data.append('splitAnswer', JSON.stringify(editedSplitAnswer)); //not editable

        if (permissionLevel === 'ta') {
            data.append('groupID', currentClass.value.toString());
        }

        editedIdentifyAnswer && data.append('identifyAnswer', JSON.stringify(editedIdentifyAnswer));

        editedMC1Answer && data.append('mc1Answer', editedMC1Answer.toString());
        editedMC2Answer && data.append('mc2Answer', editedMC2Answer.toString());

        axios
            .put('/elleapi/pastagame/pasta', data, header)
            .then((res) => {
                reloadPastas();
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
    const deletePasta = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setModal(!modal);

        let header = {
            data: {
                pastaID: pasta.pastaID,
                groupID: permissionLevel === 'ta' ? currentClass.value : null
            },
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .delete('/elleapi/pastagame/pasta', header)
            .then((res) => {
                reloadPastas();
            })
            .catch((error) => {
                console.log('deleteTerm in Card.js error: ', error.response);
            });
    };

    //function that cancels the edit and sets everything back to what it was initially
    const handleCancelEdit = () => {
        setEditMode(false);
        setEditedCategory(pasta.category);
        setEditedUtterance(pasta.utterance);
        setEditedSplitAnswer(pasta.splitAnswer);
        setEditedIdentifyAnswer(pasta.identifyAnswer);
        setEditedMC1Answer(pasta.mc1Answer);
        setEditedMC2Answer(pasta.mc2Answer);
    };

    const splitArrayToOptionList = useMemo(() => {
        const result = editedSplitAnswer.map((split, index) => {
            return {
                label: index === 0 ? pasta.utterance.substring(0, split) : pasta.utterance.substring(editedSplitAnswer[index - 1], split),
                value: index
            };
        });
        result.push({
            label: pasta.utterance.substring(editedSplitAnswer[editedSplitAnswer.length - 1]),
            value: editedSplitAnswer.length
        });
        return result.sort((a, b) => a.value - b.value);
    }, [editedSplitAnswer, pasta.utterance]);

    if (!questionFrame) return;

    if (editMode === false) {
        return (
            <Fragment>
                <tr onClick={() => setRowCollapse(!rowCollapse)}>
                    <td>{editedUtterance}</td>
                    <td>{editedCategory}</td>
                    <td>
                        {splitArrayToOptionList.map((split, index) => {
                            return <Badge key={index}>{split.label}</Badge>;
                        })}
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
                                Deleting this pasta will remove it from all the users who are currently using this module as well.
                            </Alert>
                            <p style={{ paddingLeft: '20px' }}>Are you sure you want to delete the pasta: {editedUtterance}?</p>
                        </ModalBody>

                        <ModalFooter>
                            <Button onClick={() => setModal(!modal)}>Cancel</Button>
                            <Button color='danger' onClick={(e) => deletePasta(e)}>
                                Delete
                            </Button>
                        </ModalFooter>
                    </Modal>
                </tr>

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
                                {editedIdentifyAnswer && (
                                    <Row
                                        style={{
                                            paddingBottom: 24
                                        }}
                                    >
                                        <Col>Identify Question Answer:</Col>
                                        <Col>
                                            {editedIdentifyAnswer?.map((option, index) => {
                                                const answer = splitArrayToOptionList[option].label;
                                                return <Badge key={index}>{answer}</Badge>;
                                            })}
                                        </Col>
                                    </Row>
                                )}
                                {editedMC1Answer && (
                                    <Row
                                        style={{
                                            paddingBottom: 24
                                        }}
                                    >
                                        <Col>{questionFrame?.mc1QuestionText}</Col>
                                        <Col>{questionFrame?.mc1Options && questionFrame?.mc1Options[editedMC1Answer]}</Col>
                                    </Row>
                                )}
                                {editedMC2Answer && (
                                    <Row
                                        style={{
                                            paddingBottom: 24
                                        }}
                                    >
                                        <Col>{questionFrame?.mc2QuestionText}</Col>
                                        <Col>{questionFrame?.mc2Options && questionFrame?.mc2Options[editedMC2Answer]}</Col>
                                    </Row>
                                )}
                            </div>
                        </Collapse>
                    </td>
                </tr>
            </Fragment>
        );
    } else {
        return (
            <Fragment>
                <tr>
                    <td>
                        <Input type='text' name='editedUtterance' onChange={(e) => setEditedUtterance(e.target.value)} value={editedUtterance} />
                    </td>

                    <td>
                        <Input type='select' name='editedCategory' onChange={(e) => setEditedCategory(e.target.value)} value={editedCategory}>
                            <option disabled value=''>
                                Select a category
                            </option>
                            {questionFrames.map((frame) => (
                                <option key={frame.category} value={frame.category}>
                                    {frame.category}
                                </option>
                            ))}
                        </Input>
                    </td>

                    <td>
                        <SplitComponent text={editedUtterance} indexes={editedSplitAnswer} setIndexes={setEditedSplitAnswer} dotSize={7} />
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
                <tr>
                    <td
                        style={{
                            border: 'none',
                            padding: 0
                        }}
                        colSpan={4}
                    >
                        {'identifyQuestionVar' in questionFrame || 'mc1QuestionText' in questionFrame || 'mc2QuestionText' in questionFrame ? (
                            <Collapse isOpen={true}>
                                <div style={{ padding: 12 }}>
                                    {questionFrame.identifyQuestionVar && (
                                        <Row
                                            style={{
                                                paddingBottom: 24
                                            }}
                                        >
                                            <Col>
                                                <label>
                                                    Identify {questionFrame.identifyQuestionVar} of this {editedCategory}:
                                                </label>
                                                <Typeahead
                                                    id='identifyAnswer'
                                                    multiple
                                                    onChange={(selected) => {
                                                        setEditedIdentifyAnswer(
                                                            selected
                                                                .map((option) => (typeof option === 'object' ? option.value : option))
                                                                .sort((a, b) => a - b)
                                                        );
                                                    }}
                                                    options={splitArrayToOptionList}
                                                    selected={editedIdentifyAnswer
                                                        ?.map((option) => {
                                                            return splitArrayToOptionList[option];
                                                        })
                                                        .sort((a, b) => a.value - b.value)}
                                                    placeholder='Select the answer(s)'
                                                />
                                            </Col>
                                        </Row>
                                    )}
                                    {questionFrame.mc1QuestionText && (
                                        <Row
                                            style={{
                                                paddingBottom: 24
                                            }}
                                        >
                                            <Col>
                                                <label>{questionFrame?.mc1QuestionText}</label>
                                                <Input
                                                    type='select'
                                                    name='editedMC1Answer'
                                                    onChange={(e) => setEditedMC1Answer(parseInt(e.target.value))}
                                                    value={editedMC1Answer || -1}
                                                >
                                                    <option disabled value={-1}>
                                                        Select an answer
                                                    </option>
                                                    {questionFrame?.mc1Options?.map((option, index) => (
                                                        <option key={index} value={index}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </Col>
                                        </Row>
                                    )}
                                    {questionFrame.mc2QuestionText && (
                                        <Row
                                            style={{
                                                paddingBottom: 24
                                            }}
                                        >
                                            <Col>
                                                <label>{questionFrame?.mc2QuestionText}</label>
                                                <Input
                                                    type='select'
                                                    name='editedMC2Answer'
                                                    onChange={(e) => setEditedMC2Answer(parseInt(e.target.value))}
                                                    value={editedMC2Answer || -1}
                                                >
                                                    <option disabled value={-1}>
                                                        Select an answer
                                                    </option>
                                                    {questionFrame?.mc2Options?.map((option, index) => (
                                                        <option key={index} value={index}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </Col>
                                        </Row>
                                    )}
                                </div>
                            </Collapse>
                        ) : null}
                    </td>
                </tr>
            </Fragment>
        );
    }
}
