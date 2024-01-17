import React, { useState } from 'react';
import {
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Row,
    Col,
    Alert,
    Card,
} from 'reactstrap';
import axios from 'axios';

import TagList from './TagList';
import Autocomplete from './Autocomplete';
import AnswerButtonList from './AnswerButtonList';
import { Tag, Term } from '@/types/api/terms';
import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';
import { EventType } from '@/types/events';
import { LoggedAnswer } from '@/types/api/logged_answer';

export default function AddExistingTerm({
    currentClass,
    curModule,
    updateCurrentModule,
    allAnswers,
    allTags,
    addTag,
    deleteTag,
    setOpenForm,
}: {
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (event: EventType) => void;
    allAnswers: LoggedAnswer[];
    allTags: Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    setOpenForm: (openedForm: number) => void;
}) {
    const [search, setSearch] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [previousTags, setPreviousTags] = useState<Tag[]>([]);
    const [addedTerms, setAddedTerms] = useState<Term[]>([]);
    const [tagFilteredTerms, setTagFilteredTerms] = useState<string[]>([]);
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    //function that sets the taglist on this form
    const updateTagList = (tagList: Tag[]) => {
        setTags(tagList);
    };

    //function that submits the data
    const submitExistingTerms = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        let groupID = null;

        if (permissionLevel === 'ta') groupID = currentClass.value;

        for (let i = 0; i < addedTerms.length; i++) {
            let data = {
                termID: addedTerms[i].termID,
                moduleID: curModule.moduleID,
                groupID: groupID,
            };

            axios
                .post('/elleapi/attachterm', data, header)
                .then((res) => {
                    if (i === addedTerms.length - 1) {
                        updateCurrentModule({ module: curModule });
                    }
                })
                .catch((error) => {
                    console.log('submitExistingTerms error: ', error.response);
                })
                .then(() => {
                    resetFields();
                });
        }
    };

    const resetFields = () => {
        setSearch('');
        setAddedTerms([]);

        updateCurrentModule({ module: curModule });
    };

    //TODO: handleAddTag and createTag kinda do the same thing. Maybe they should be one thing?
    //function that adds a tag to list of tags on this form
    const handleAddTag = (tag: Tag) => {
        let list = addTag(tags, tag);
        setTags(list);

        updateTagFilteredTerms();
    };

    //function that adds a new tag from user input to list of tags on this form
    const createTag = (tag: Tag) => {
        let tempTags = tags;

        tempTags.push(tag);

        setTags(tempTags);
    };

    //function that removes a tag from the list of tags on this form
    const handleDeleteTag = (tag: Tag) => {
        let list = deleteTag(tags, tag);
        setTags(list);

        updateTagFilteredTerms();
    };

    const handleDeleteAnswer = (event: { answer: string }) => {
        let tempAnswerButtonList = addedTerms;

        let answerObject = addedTerms.find((answer) => {
            if (answer.front === event.answer) {
                return true;
            } else {
                return false;
            }
        });

        if (answerObject === undefined) {
            return;
        }

        let answerIndex = tempAnswerButtonList.indexOf(answerObject);

        if (answerIndex !== -1) {
            tempAnswerButtonList.splice(answerIndex, 1);
        }

        setAddedTerms(tempAnswerButtonList);
    };

    const handleAddExistingTerm = (event: Term) => {
        let tempAddedTerms = addedTerms;

        tempAddedTerms.push({
            front: event.front,
            termID: event.termID,
            back: event.back,
            gender: event.gender,
            type: event.type,
            language: event.language,
        });

        setAddedTerms(tempAddedTerms);
    };

    const updateTagFilteredTerms = () => {
        setTagFilteredTerms([]);

        for (let i = 0; i < tags.length; i++) {
            let header = {
                headers: { Authorization: 'Bearer ' + user?.jwt },
                params: { tag_name: tags[i] },
            };

            axios
                .get<Term[]>('/elleapi/tag_term', header)
                .then((res) => {
                    let tempTagFilteredTerms = tagFilteredTerms;

                    res.data.map((term) => {
                        if (tempTagFilteredTerms.indexOf(term.front) === -1) {
                            tempTagFilteredTerms.push(term.front);
                        }
                    });
                    setTagFilteredTerms(tempTagFilteredTerms);
                })
                .catch((error) => {
                    console.log(
                        'updateTagFilteredTerms error: ',
                        error.response
                    );
                });
        }
    };

    const updatePreviousTags = (currentTagList: Tag[]) => {
        setPreviousTags(currentTagList);
    };

    let filterFunction = (term: LoggedAnswer) => {
        if (!term.front) return false;

        let frontPrefix = term.front?.trim().substring(0, search.length) || '';
        if (frontPrefix.toLowerCase() === search.toLowerCase()) {
            if (
                tagFilteredTerms.indexOf(term.front) !== -1 ||
                tagFilteredTerms.length === 0
            ) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

    let dynamicTerms;

    let currentTagList = tags;

    if (currentTagList.length !== previousTags.length) {
        updatePreviousTags(currentTagList);
        updateTagFilteredTerms();
    }

    if (allAnswers.length === 0) {
        dynamicTerms = allAnswers.filter(filterFunction);
    }

    let tempAddedTermsIDArray = addedTerms.map((term) => {
        return term.termID;
    });
    let validTerms =
        dynamicTerms &&
        dynamicTerms.filter((answer) => {
            return tempAddedTermsIDArray.indexOf(answer.logID) === -1;
        });

    return (
        <div>
            <Form onSubmit={(e) => submitExistingTerms(e)}>
                <input type="hidden" value="prayer" />

                <Alert
                    style={{
                        color: '#004085',
                        backgroundColor: 'lightskyblue',
                        border: 'none',
                    }}
                >
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for="search">Search:</Label>

                                <Input
                                    type="text"
                                    name="search"
                                    onChange={(e) => setSearch(e.target.value)}
                                    value={search}
                                    id="search"
                                    placeholder="Search"
                                    autoComplete="off"
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Label for="tags">Tags:</Label>

                            <br />

                            <FormGroup width="50%">
                                <Autocomplete
                                    name={'tags'}
                                    id={'tags'}
                                    placeholder={'Tag'}
                                    handleAddTag={handleAddTag}
                                    createTag={createTag}
                                    renderButton={false}
                                    autoCompleteStyle={{
                                        borderWidth: '0px',
                                        borderStyle: 'none',
                                        width: '40%',
                                    }}
                                    suggestions={allTags}
                                />
                            </FormGroup>

                            {/*Lists all of the tags on this term, displayed as buttons*/}
                            <Alert color="warning">
                                <TagList
                                    tags={tags}
                                    handleDeleteTag={handleDeleteTag}
                                    deletable={true}
                                />
                            </Alert>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <h5 style={{ color: 'black', fontWeight: '300' }}>
                                All Terms:
                            </h5>
                            <Card
                                color="info"
                                style={{
                                    overflow: 'scroll',
                                    height: '35vh',
                                    width: '100%',
                                }}
                            >
                                {validTerms &&
                                    validTerms.map((answer) => {
                                        return (
                                            <Button
                                                style={{
                                                    backgroundColor: '#2b7e8a',
                                                    border: 'none',
                                                    borderRadius: '0px',
                                                }}
                                                key={answer.logID}
                                                onClick={() =>
                                                    handleAddExistingTerm({
                                                        front:
                                                            answer.front || '',
                                                        termID: 0,
                                                        back: '',
                                                        type: '',
                                                        gender: 'M',
                                                        language: 'en',
                                                    })
                                                }
                                            >
                                                {answer.front}
                                            </Button>
                                        );
                                    })}
                            </Card>
                        </Col>
                        <Col>
                            <h5 style={{ color: 'black', fontWeight: '300' }}>
                                Added Terms:
                            </h5>
                            <Alert
                                style={{
                                    backgroundColor: '#17A2B7',
                                    overflow: 'scroll',
                                    height: '35vh',
                                    width: '100%',
                                    border: 'none',
                                }}
                            >
                                <AnswerButtonList
                                    answers={addedTerms.map((answer) => {
                                        return answer.front;
                                    })}
                                    handleDeleteAnswer={handleDeleteAnswer}
                                    deletable={true}
                                />
                            </Alert>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Button
                                style={{
                                    backgroundColor: 'rgb(0, 64, 133)',
                                    border: 'none',
                                }}
                                type="submit"
                                block
                            >
                                Add
                            </Button>
                            <Button
                                style={{
                                    backgroundColor: 'steelblue',
                                    border: 'none',
                                }}
                                onClick={() => setOpenForm(0)}
                                block
                            >
                                Cancel
                            </Button>
                        </Col>
                    </Row>
                </Alert>
            </Form>
        </div>
    );
}
