import React, { Fragment, useContext, useEffect, useMemo, useState } from 'react';
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
import { Pasta, QuestionFrame } from '@/types/api/pastagame';
import { Typeahead } from 'react-bootstrap-typeahead';
import { SplitComponent } from '../Forms/Pasta/SplitComponent';

export default function Pasta({ pasta, questionFrames, curModule }: { pasta: Pasta; questionFrames: QuestionFrame[]; curModule: Module }) {
    const [modal, setModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedCategory, setEditedCategory] = useState(pasta.category);
    const [editedUtterance, setEditedUtterance] = useState(pasta.utterance);
    const [editedSplitAnswer, setEditedSplitAnswer] = useState(pasta.splitAnswer);
    const [editedIdentifyAnswer, setEditedIdentifyAnswer] = useState(pasta.identifyAnswer);
    const [editedMC1Answer, setEditedMC1Answer] = useState(pasta.mc1Answer);
    const [editedMC2Answer, setEditedMC2Answer] = useState(pasta.mc2Answer);
    const [invalidAlertText, setInvalidAlertText] = useState<string[]>([]);
    const { editPasta, deletePasta } = useContext(PastaContext);

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
        // If invalidAlertText is not empty, do not submit the edit
        if (invalidAlertText.length !== 0) return;

        setEditMode(false);

        const editedPasta: Pasta = {
            pastaID: pasta.pastaID,
            moduleID: curModule.moduleID,
            category: editedCategory,
            utterance: editedUtterance,
            splitAnswer: editedSplitAnswer,
            identifyAnswer: editedIdentifyAnswer,
            mc1Answer: editedMC1Answer,
            mc2Answer: editedMC2Answer
        };

        editPasta(editedPasta);
    };

    //toggling delete modal, is not related to delete card API
    const handleDelete = () => {
        setModal(!modal);
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

    // When the category is changed, all answers should be reset
    const handleChangeCategory = (category: string) => {
        const qf = questionFrames.find((qf) => qf.category === category);
        if (!qf) return;

        setEditedCategory(qf.category);
        setEditedSplitAnswer([]);

        if (qf?.identifyQuestionVar) setEditedIdentifyAnswer([]);
        else setEditedIdentifyAnswer(undefined);

        if (qf?.mc1QuestionText) setEditedMC1Answer(0);
        else setEditedMC1Answer(undefined);
        if (qf?.mc2QuestionText) setEditedMC2Answer(0);
        else setEditedMC2Answer(undefined);
    };

    // A nasty useEffect that checks if the edited data is valid
    useEffect(() => {
        if (editMode) {
            const invalidText = [];
            const category = questionFrame?.displayName ?? questionFrame?.category;
            if (editedUtterance.length === 0) invalidText.push('The utterance cannot be empty. Please enter a valid utterance.');
            if (editedCategory.length === 0) invalidText.push('The category cannot be empty. Please select a valid category.');
            if (editedSplitAnswer.length === 0)
                invalidText.push(
                    `The answer(s) for "Split this ${category} by its ${questionFrame?.splitQuestionVar}" cannot be empty. Please select at least one split answer above.`
                );
            if (questionFrame?.identifyQuestionVar && editedIdentifyAnswer?.length === 0)
                invalidText.push(
                    `The answer(s) for "Identify ${questionFrame?.identifyQuestionVar} of this ${category}" cannot be empty. Please select at least one answer.`
                );
            if (questionFrame?.mc1QuestionText && editedMC1Answer == undefined)
                invalidText.push(`The answer for ${questionFrame?.mc1QuestionText} cannot be empty. Please select a valid answer.`);
            if (questionFrame?.mc2QuestionText && editedMC2Answer == undefined)
                invalidText.push(`The answer for ${questionFrame?.mc2QuestionText} cannot be empty. Please select a valid answer.`);
            if (invalidText.length > 0) setInvalidAlertText(invalidText);
            else setInvalidAlertText([]);
        }
    }, [
        editMode,
        editedCategory.length,
        editedIdentifyAnswer?.length,
        editedMC1Answer,
        editedMC2Answer,
        editedSplitAnswer.length,
        editedUtterance.length,
        questionFrame
    ]);

    const splitArrayToOptionList = useMemo(() => {
        const curatedText = pasta.utterance.replace(/[^a-zA-Z0-9]/g, '');
        const result = editedSplitAnswer.map((split, index) => {
            const curatedLabel =
                index === 0 ? curatedText.substring(0, split + 1) : curatedText.substring(editedSplitAnswer[index - 1] + 1, split + 1);
            return {
                label: curatedLabel,
                value: index
            };
        });
        result.push({
            label: curatedText.substring(editedSplitAnswer[editedSplitAnswer.length - 1] + 1),
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
                        <div style={{ display: 'flex', gap: 8, height: 20 }}>
                            {splitArrayToOptionList.map((split, index) => {
                                return <Badge key={index}>{split.label}</Badge>;
                            })}
                        </div>
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
                            <Button color='danger' onClick={(e) => deletePasta(pasta.pastaID)}>
                                Delete
                            </Button>
                        </ModalFooter>
                    </Modal>
                </tr>

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
                                {questionFrame.identifyQuestionVar && (
                                    <Row
                                        style={{
                                            paddingBottom: 24
                                        }}
                                    >
                                        <Col>
                                            Identify the {questionFrame.identifyQuestionVar} of this{' '}
                                            {questionFrame.displayName ?? questionFrame.category}
                                        </Col>
                                        <Col>
                                            <div style={{ display: 'flex', gap: 12, height: 20 }}>
                                                {editedIdentifyAnswer?.map((option, index) => {
                                                    const answer = splitArrayToOptionList[option].label;
                                                    return <Badge key={index}>{answer}</Badge>;
                                                })}
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                                {questionFrame.mc1QuestionText && editedMC1Answer !== undefined && (
                                    <Row
                                        style={{
                                            paddingBottom: 24
                                        }}
                                    >
                                        <Col>{questionFrame?.mc1QuestionText}</Col>
                                        <Col>{questionFrame?.mc1Options && questionFrame?.mc1Options[editedMC1Answer]}</Col>
                                    </Row>
                                )}
                                {questionFrame.mc2QuestionText && editedMC2Answer !== undefined && (
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
                        <Input
                            type='text'
                            name='editedUtterance'
                            onChange={(e) => setEditedUtterance(e.target.value)}
                            value={editedUtterance}
                            required
                        />
                    </td>

                    <td>
                        <Input
                            type='select'
                            name='editedCategory'
                            onChange={(e) => handleChangeCategory(e.target.value)}
                            value={editedCategory}
                            required
                        >
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
                <tr className='no-hover'>
                    <td
                        style={{
                            border: 'none',
                            padding: 0
                        }}
                        colSpan={4}
                    >
                        {'identifyQuestionVar' in questionFrame ||
                        'mc1QuestionText' in questionFrame ||
                        'mc2QuestionText' in questionFrame ||
                        invalidAlertText.length !== 0 ? (
                            <Collapse isOpen={true}>
                                <div style={{ padding: 12 }}>
                                    {invalidAlertText.length !== 0 && (
                                        <Alert color='danger' style={{ whiteSpace: 'pre-wrap' }}>
                                            <ul style={{ margin: 0 }}>
                                                {invalidAlertText.map((text, index) => (
                                                    <li key={index}>{text}</li>
                                                ))}
                                            </ul>
                                        </Alert>
                                    )}
                                    {questionFrame.identifyQuestionVar && (
                                        <Row
                                            style={{
                                                paddingBottom: 24
                                            }}
                                        >
                                            <Col>
                                                <label>
                                                    Identify {questionFrame.identifyQuestionVar} of this{' '}
                                                    {questionFrame.displayName ?? questionFrame.category}:
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
                                                    value={editedMC1Answer}
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
                                                    value={editedMC2Answer}
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
