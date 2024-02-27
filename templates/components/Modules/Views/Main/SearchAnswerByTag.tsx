import React, { useState } from 'react';
import { Button, Form, FormGroup, Label, Input, Row, Col, Alert, Card } from 'reactstrap';
import axios from 'axios';

import TagList from './TagList';
import Autocomplete from './Autocomplete';
import AnswerButtonList from './AnswerButtonList';
import { Module, ModuleQuestionAnswer } from '@/types/api/modules';
import { Tag, Term } from '@/types/api/terms';
import { useUser } from '@/hooks/useUser';

export default function SearchAnswersByTag({
    curModule,
    updateCurrentModule,
    deleteTag,
    addTag,
    allTags,
    allAnswers,
    handleAddAnswer,
    toggleSearchByTagForm
}: {
    curModule: Module;
    updateCurrentModule: (module: Module, task?: string) => void;
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    allAnswers: ModuleQuestionAnswer[];
    allTags: Tag[];
    handleAddAnswer: (answer: string) => void;
    toggleSearchByTagForm: () => void;
}) {
    const { user } = useUser();
    const [search, setSearch] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [previousTags, setPreviousTags] = useState<Tag[]>([]);
    const [addedTerms, setAddedTerms] = useState<ModuleQuestionAnswer[]>([]);
    const [tagFilteredTerms, setTagFilteredTerms] = useState<string[]>([]);
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [type, setType] = useState('');
    const [gender, setGender] = useState('');
    const [selectedImgFile, setSelectedImgFile] = useState<File | null>(null);
    const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
    const [imgLabel, setImgLabel] = useState('Pick an image for the term');
    const [audioLabel, setAudioLabel] = useState('Pick an audio for the term');

    //function that sets the taglist on this form
    const updateTagList = (tagList: Tag[]) => {
        setTags(tagList);
    };

    //function that submits the data
    const submitSearchedAnswers = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        for (let term of addedTerms) {
            term.front && handleAddAnswer(term.front);
        }

        toggleSearchByTagForm();
    };

    const resetFields = () => {
        setFront('');
        setBack('');
        setType('');
        setGender('');
        setTags([]);
        setSelectedImgFile(null);
        setSelectedAudioFile(null);
        setImgLabel('Pick an image for the term');
        setAudioLabel('Pick an audio for the term');
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

        let answerObject = addedTerms.find((answer) => answer.front === event.answer) || { termID: -1, gender: 'N' };
        let answerIndex = tempAnswerButtonList.indexOf(answerObject);

        if (answerIndex !== -1) {
            tempAnswerButtonList.splice(answerIndex, 1);
        }

        setAddedTerms(tempAnswerButtonList);
    };

    const handleAddExistingTerm = (event: ModuleQuestionAnswer) => {
        let tempAddedTerms = addedTerms;
        tempAddedTerms.push({
            front: event.front,
            termID: event.termID,
            gender: event.gender
        });

        setAddedTerms(tempAddedTerms);
    };

    const updateTagFilteredTerms = () => {
        setTagFilteredTerms([]);

        for (let i = 0; i < tags.length; i++) {
            let header = {
                headers: {
                    Authorization: 'Bearer ' + user?.jwt
                },
                params: { tag_name: tags[i] }
            };

            axios
                .get<Term[]>('/elleapi/tag_term', header)
                .then((res) => {
                    let tempTagFilteredTerms = tagFilteredTerms;

                    res.data.map((term) => {
                        if (term.front && tempTagFilteredTerms.indexOf(term.front) === -1) {
                            tempTagFilteredTerms.push(term.front);
                        }
                    });

                    setTagFilteredTerms(tempTagFilteredTerms);
                })
                .catch((error) => {
                    console.log('updateTagFilteredTerms error: ', error);
                });
        }
    };

    const updatePreviousTags = (currentTagList: Tag[]) => {
        setPreviousTags(currentTagList);
    };

    let filterFunction = (term: ModuleQuestionAnswer) => {
        let termFront = term.front || '';
        let namePrefix = termFront.substring(0, search.length);

        if (namePrefix.toLowerCase() === search.toLowerCase()) {
            if ((term.front && tagFilteredTerms.indexOf(term.front) !== -1) || tagFilteredTerms.length === 0) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

    let dynamicTerms: ModuleQuestionAnswer[] = [];

    let currentTagList = tags;

    if (currentTagList.length !== previousTags.length) {
        updatePreviousTags(currentTagList);
        updateTagFilteredTerms();
    }

    if (allAnswers.length > 0) {
        dynamicTerms = allAnswers.filter(filterFunction);
    }

    return (
        <div>
            <Form onSubmit={(e) => submitSearchedAnswers(e)}>
                <input type='hidden' value='prayer' />

                <Alert
                    style={{
                        color: '#004085',
                        backgroundColor: 'lightskyblue',
                        border: 'none',
                        borderRadius: '0px'
                    }}
                >
                    <Row>
                        <Col>
                            <FormGroup width='50%'>
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
                                        width: '100%'
                                    }}
                                    suggestions={allTags}
                                />
                            </FormGroup>

                            {/*Lists all of the tags on this term, displayed as buttons*/}
                            <Alert color='warning'>
                                <TagList tags={tags} handleDeleteTag={handleDeleteTag} deletable={true} />
                            </Alert>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <h6 style={{ color: 'black', fontWeight: '300' }}>All Terms:</h6>
                            <Card
                                color='info'
                                style={{
                                    overflow: 'scroll',
                                    height: '35vh',
                                    width: '100%'
                                }}
                            >
                                {dynamicTerms
                                    .filter((answer) => {
                                        let tempAddedTermsIDArray = addedTerms.map((term) => {
                                            return term.termID;
                                        });
                                        return tempAddedTermsIDArray.indexOf(answer.termID) === -1;
                                    })
                                    .map((answer) => {
                                        return (
                                            <Button
                                                style={{
                                                    backgroundColor: 'dodgerBlue',
                                                    border: 'none'
                                                }}
                                                key={answer.termID}
                                                onClick={() =>
                                                    handleAddExistingTerm({
                                                        front: answer.front,
                                                        termID: answer.termID,
                                                        gender: answer.gender
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
                            <h6 style={{ color: 'black', fontWeight: '300' }}>Added Terms:</h6>
                            <Alert
                                style={{
                                    backgroundColor: 'deepSkyBlue',
                                    overflow: 'scroll',
                                    height: '35vh',
                                    width: '100%',
                                    border: 'none'
                                }}
                            >
                                <AnswerButtonList
                                    answers={addedTerms.map((answer) => {
                                        return answer.front || '';
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
                                    backgroundColor: '#004085',
                                    border: 'none'
                                }}
                                type='submit'
                                block
                            >
                                Add
                            </Button>
                            <Button
                                style={{
                                    backgroundColor: 'steelblue',
                                    border: 'none'
                                }}
                                onClick={toggleSearchByTagForm}
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
