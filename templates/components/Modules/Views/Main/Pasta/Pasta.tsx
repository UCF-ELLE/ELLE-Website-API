import React, { Fragment, useState } from 'react';
import {
    Alert,
    Button,
    ButtonGroup,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Collapse,
    Input,
    Badge,
    Row,
    Col,
} from 'reactstrap';
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

export default function Pasta({
    pasta,
    currentClass,
    questionFrame,
    updateCurrentModule,
    curModule,
}: {
    pasta: Pasta;
    questionFrame: QuestionFrame;
    currentClass: { value: number; label: string };
    updateCurrentModule: (module?: Module, task?: string) => void;
    curModule: Module;
}) {
    const [modal, setModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedCategory, setEditedCategory] = useState(pasta.category);
    const [editedUtterance, setEditedUtterance] = useState(pasta.utterance);
    const [editedSplitAnswer, setEditedSplitAnswer] = useState(
        pasta.splitAnswer
    );
    const [editedIdentifyAnswer, setEditedIdentifyAnswer] = useState(
        pasta.identifyAnswer
    );
    const [editedMC1Answer, setEditedMC1Answer] = useState(pasta.mc1Answer);
    const [editedMC2Answer, setEditedMC2Answer] = useState(pasta.mc2Answer);

    const [rowCollapse, setRowCollapse] = useState(false);

    const { user, loading } = useUser();
    const permissionLevel = user?.permissionGroup;

    //function that gets called when the edit button is pushed. Sets editmode to true
    const editCard = () => {
        setEditMode(true);
    };

    //function that submits all of the edited data put on a card
    const submitEdit = (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        setEditMode(false);

        const data = new FormData();
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        editedUtterance && data.append('utterance', editedUtterance);
        editedCategory && data.append('category', editedCategory);
        editedSplitAnswer &&
            data.append('splitAnswer', JSON.stringify(editedSplitAnswer)); //not editable

        if (permissionLevel === 'ta') {
            data.append('groupID', currentClass.value.toString());
        }

        editedIdentifyAnswer &&
            data.append('identifyAnswer', JSON.stringify(editedIdentifyAnswer));

        editedMC1Answer && data.append('mc1Answer', editedMC1Answer.toString());
        editedMC2Answer && data.append('mc2Answer', editedMC2Answer.toString());

        axios
            .put('/elleapi/pastagame/pasta', data, header)
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
    const deletePasta = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        setModal(!modal);

        let header = {
            data: {
                pastaID: pasta.pastaID,
                groupID: permissionLevel === 'ta' ? currentClass.value : null,
            },
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        axios
            .delete('/elleapi/pastagame/pasta', header)
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
        setEditedCategory(pasta.category);
        setEditedUtterance(pasta.utterance);
        setEditedSplitAnswer(pasta.splitAnswer);
        setEditedIdentifyAnswer(pasta.identifyAnswer);
        setEditedMC1Answer(pasta.mc1Answer);
        setEditedMC2Answer(pasta.mc2Answer);
    };

    if (editMode === false) {
        return (
            <Fragment>
                <tr onClick={() => setRowCollapse(!rowCollapse)}>
                    <td>{editedUtterance}</td>
                    <td>{editedCategory}</td>
                    <td>
                        {editedSplitAnswer && editedSplitAnswer.length > 0
                            ? editedSplitAnswer.map((split, index) => {
                                  return (
                                      <Badge key={index}>
                                          {index === 0
                                              ? pasta.utterance.substring(
                                                    0,
                                                    split
                                                )
                                              : pasta.utterance.substring(
                                                    editedSplitAnswer[
                                                        index - 1
                                                    ],
                                                    split
                                                )}
                                      </Badge>
                                  );
                              })
                            : null}
                    </td>

                    {permissionLevel !== 'st' ? (
                        <td>
                            <ButtonGroup>
                                <Button
                                    style={{ backgroundColor: 'lightcyan' }}
                                    onClick={() => editCard()}
                                >
                                    <Image
                                        src={toolsImage}
                                        alt="edit icon"
                                        style={{
                                            width: '25px',
                                            height: '25px',
                                        }}
                                    />
                                </Button>
                                <Button
                                    style={{
                                        backgroundColor: 'lightcoral',
                                    }}
                                    onClick={handleDelete}
                                >
                                    <Image
                                        src={deleteImage}
                                        alt="trash can icon"
                                        style={{
                                            width: '25px',
                                            height: '25px',
                                        }}
                                    />
                                </Button>
                            </ButtonGroup>
                        </td>
                    ) : null}

                    <Modal isOpen={modal} toggle={() => setModal(!modal)}>
                        <ModalHeader toggle={() => setModal(!modal)}>
                            Delete
                        </ModalHeader>

                        <ModalBody>
                            <Alert color="primary">
                                Deleting this pasta will remove it from all the
                                users who are currently using this module as
                                well.
                            </Alert>
                            <p style={{ paddingLeft: '20px' }}>
                                Are you sure you want to delete the pasta:{' '}
                                {editedUtterance}?
                            </p>
                        </ModalBody>

                        <ModalFooter>
                            <Button onClick={() => setModal(!modal)}>
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onClick={(e) => deletePasta(e)}
                            >
                                Delete
                            </Button>
                        </ModalFooter>
                    </Modal>
                </tr>

                <tr>
                    <td
                        style={{
                            border: 'none',
                            padding: 0,
                        }}
                        colSpan={4}
                    >
                        <Collapse isOpen={rowCollapse} style={{ padding: 12 }}>
                            {editedIdentifyAnswer && (
                                <Row
                                    style={{
                                        paddingBottom: 24,
                                    }}
                                >
                                    <Col>Identify Question Answer:</Col>
                                    <Col>
                                        {editedIdentifyAnswer?.map(
                                            (option, index) => {
                                                const answer =
                                                    option === 0
                                                        ? pasta.utterance.substring(
                                                              0,
                                                              editedSplitAnswer[
                                                                  option
                                                              ]
                                                          )
                                                        : pasta.utterance.substring(
                                                              editedSplitAnswer[
                                                                  option - 1
                                                              ],
                                                              editedSplitAnswer[
                                                                  option
                                                              ]
                                                          );
                                                return (
                                                    <Badge key={index}>
                                                        {answer}
                                                    </Badge>
                                                );
                                            }
                                        )}
                                    </Col>
                                </Row>
                            )}
                            {editedMC1Answer && (
                                <Row
                                    style={{
                                        paddingBottom: 24,
                                    }}
                                >
                                    <Col>{questionFrame?.mc1QuestionText}</Col>
                                    <Col>
                                        {questionFrame?.mc1Options &&
                                            questionFrame?.mc1Options[
                                                editedMC1Answer
                                            ]}
                                    </Col>
                                </Row>
                            )}
                            {editedMC2Answer && (
                                <Row
                                    style={{
                                        paddingBottom: 24,
                                    }}
                                >
                                    <Col>{questionFrame?.mc2QuestionText}</Col>
                                    <Col>
                                        {questionFrame?.mc2Options &&
                                            questionFrame?.mc2Options[
                                                editedMC2Answer
                                            ]}
                                    </Col>
                                </Row>
                            )}
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
                            type="text"
                            name="editedUtterance"
                            onChange={(e) => setEditedUtterance(e.target.value)}
                            value={editedUtterance}
                        />
                    </td>

                    <td>
                        <Input
                            type="text"
                            name="editedCategory"
                            onChange={(e) => setEditedCategory(e.target.value)}
                            value={editedCategory}
                        />
                    </td>

                    <td>
                        <SplitComponent
                            text={editedUtterance}
                            indexes={editedSplitAnswer}
                            setIndexes={setEditedSplitAnswer}
                        />
                    </td>

                    <td>
                        <ButtonGroup>
                            <Button
                                style={{ backgroundColor: 'lightcyan' }}
                                onClick={(e) => submitEdit(e)}
                            >
                                <Image
                                    src={submitImage}
                                    alt="Icon made by Becris from www.flaticon.com"
                                    style={{
                                        width: '25px',
                                        height: '25px',
                                    }}
                                />
                            </Button>
                            <Button
                                style={{ backgroundColor: 'lightcyan' }}
                                onClick={() => handleCancelEdit()}
                            >
                                <Image
                                    src={cancelImage}
                                    alt="Icon made by Freepik from www.flaticon.com"
                                    style={{
                                        width: '25px',
                                        height: '25px',
                                    }}
                                />
                            </Button>
                        </ButtonGroup>
                    </td>
                </tr>
            </Fragment>
        );
    }
}
