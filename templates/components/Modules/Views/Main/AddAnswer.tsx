import React, { useState } from 'react';
import { Button, Form, FormGroup, Label, Input, Row, Col, Alert } from 'reactstrap';

import TagList from './TagList';
import Autocomplete from './Autocomplete';
import { Tag } from '@/types/api/terms';
import { ModuleQuestionAnswer } from '@/types/api/modules';

export default function AddAnswer({
    addNewAnswerToList,
    cancelCreateAnswer,
    allTags,
    addTag,
    deleteTag,
    initialFront
}: {
    addNewAnswerToList: (event: ModuleQuestionAnswer) => void;
    cancelCreateAnswer: () => void;
    allTags: Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    initialFront: string;
}) {
    const [front, setFront] = useState(initialFront);
    const [back, setBack] = useState('');
    const [tags, setTags] = useState<Tag[]>([]);

    //function that sets the taglist on this form
    const updateTagList = (tagList: Tag[]) => {
        setTags(tagList);
    };

    const changeFront = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFront(e.target.value);
    };

    //TODO: Make this submit the answer and then add that answer to the list of answers
    //on the question that called it

    //function that submits the data
    const submitTerm = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (front.length !== 0 && back.length !== 0) {
            addNewAnswerToList({
                termID: 0,
                front: front,
                back: back,
                tags: tags.map((tag) => tag),
                type: '',
                gender: 'N',
                language: 'la'
            });
        } else {
            e.preventDefault();
            alert('Please fill all inputs!');
        }
    };

    //TODO: handleAddTag and createTag kinda do the same thing. Maybe they should be one thing?
    //function that adds a tag to list of tags on this form
    const handleAddTag = (tag: Tag) => {
        let list = addTag(tags, tag);
        setTags(list);
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
    };
    return (
        <div>
            <Form onSubmit={(e) => submitTerm(e)}>
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
                            <FormGroup>
                                <Label for='back'>English Word:</Label>

                                <Input
                                    type='text'
                                    name='back'
                                    onChange={(e) => setBack(e.target.value)}
                                    value={back}
                                    id='back'
                                    placeholder={back}
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='front'>Translated Word:</Label>

                                <Input
                                    type='text'
                                    name='front'
                                    onChange={(e) => setFront(e.target.value)}
                                    value={front}
                                    id='front'
                                    placeholder='Translated Word'
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Label for='tags'>Tags:</Label>

                            <br />

                            <FormGroup width='50%'>
                                <Autocomplete
                                    name={'tags'}
                                    id={'tags'}
                                    placeholder={'Tag'}
                                    handleAddTag={handleAddTag}
                                    createTag={createTag}
                                    renderButton={true}
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
                            <Button
                                style={{
                                    backgroundColor: '#004085',
                                    border: 'none'
                                }}
                                type='submit'
                                block
                            >
                                Create
                            </Button>
                            <Button
                                style={{
                                    backgroundColor: 'steelblue',
                                    border: 'none'
                                }}
                                onClick={cancelCreateAnswer}
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
