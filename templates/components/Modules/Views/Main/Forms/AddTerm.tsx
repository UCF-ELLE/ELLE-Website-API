import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, FormGroup, Input, Label, Row, Tooltip } from 'reactstrap';

import Image from 'next/image';
import Autocomplete from '../Autocomplete';
import TagList from '../TagList';

import { useUser } from '@/hooks/useUser';
import InfoImage from '@/public/static/images/info.png';
import { Module } from '@/types/api/modules';
import { Tag } from '@/types/api/terms';
import { Typeahead } from 'react-bootstrap-typeahead';
// import MicRecorder from 'mic-recorder';

export default function AddTerm({
    curModule,
    updateCurrentModule,
    currentClass,
    allTags,
    addTag,
    deleteTag,
    setOpenForm
}: {
    curModule: Module;
    updateCurrentModule: (module: Module, task?: string) => void;
    currentClass: { value: number; label: string };
    allTags: Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    setOpenForm: (form: number) => void;
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    const [front, setFront] = useState<string>('');
    const [back, setBack] = useState<string>('');
    const [type, setType] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedImgFile, setSelectedImgFile] = useState<File>(new File([], ''));
    const [selectedAudioFile, setSelectedAudioFile] = useState<File>(new File([], ''));
    const [imgLabel, setImgLabel] = useState<string>('Pick an image for the term');
    const [audioLabel, setAudioLabel] = useState<string>('Pick an audio for the term');
    const [tooltipOpen, setTooltipOpen] = useState<boolean>(false);
    const [tagInfoModalOpen, setTagInfoModalOpen] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const [errMsg, setErrMsg] = useState<string>('');
    // const [Mp3Recorder, setMp3Recorder] = useState<MicRecorder>(
    //     new MicRecorder({ bitRate: 128 })
    // );
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [blobURL, setBlobURL] = useState<string>('');
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [disable, setDisable] = useState<boolean>(true);
    const [file, setFile] = useState<File>(new File([], ''));
    const [didUpload, setDidUpload] = useState<boolean>(false);

    useEffect(() => {
        console.log('Tags', tags);
    }, [tags]);

    useEffect(() => {
        try {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(
                () => {
                    console.log('Permission Granted');
                    setIsBlocked(false);
                },
                () => {
                    console.log('Permission Denied');
                    setIsBlocked(true);
                }
            );
        } catch (err) {
            console.log(
                "couldn't find mic.",
                'currently not working in production because getUserMedia CANNOT be run over unsecure netowrk...we need SSL.',
                err
            );
        }
    }, []);

    const start = () => {
        if (isBlocked) {
            console.log('Permission Denied');
        } else {
            // Mp3Recorder.start()
            //     .then(() => {
            //         setIsRecording(true);
            //     })
            //     .catch((e: string) => console.error(e));

            // this.state.disable = true
            setDisable(true);
        }
    };

    const stop = () => {
        // Mp3Recorder.stop()
        //     .getAudio()
        //     .then(([buffer, blob]) => {
        //         const blobURL = URL.createObjectURL(blob);
        //         setBlobURL(blobURL);
        //         setIsRecording(false);

        //         const moduleIdentifier = document
        //             .getElementById('module-name')
        //             ?.textContent?.replace(/\s+/g, '-')
        //             .toLowerCase();
        //         const termName = (
        //             document.getElementById('back') as HTMLInputElement
        //         ).value
        //             ?.replace(/\s+/g, '-')
        //             .toLowerCase();

        //         // this.state.file = new File(buffer, `term_${moduleIdentifier}_${termName}.mp3`, {
        //         // 		type: blob.type,
        //         // 		lastModified: Date.now()
        //         // });
        //         setFile(
        //             new File(
        //                 buffer,
        //                 `term_${moduleIdentifier}_${termName}.mp3`,
        //                 { type: blob.type, lastModified: Date.now() }
        //             )
        //         );

        //         console.log(file);
        //     })
        //     .catch((e) => console.log(e));

        // this.state.disable = false
        // this.setState({ disable: false });
        setDisable(false);
    };

    const upload = () => {
        setSelectedAudioFile(file);
        // this.setState({ selectedAudioFile: this.state.file });
        setDidUpload(true);

        const audioFile = document.getElementById('audioFile') as HTMLInputElement;
        audioFile.disabled = true;

        console.log(selectedAudioFile);
    };

    const imgFileChangedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedImgFile(event.target.files[0]);
            setImgLabel(event.target.files[0] === undefined ? 'Pick an image for the term' : event.target.files[0].name);
        }
    };

    const audioFileChangedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedAudioFile(event.target.files[0]);
            setAudioLabel(event.target.files[0] === undefined ? 'Pick an audio for the term' : event.target.files[0].name);
        }
    };

    //function that submits the data
    const submitTerm = (e: React.FormEvent<HTMLFormElement>) => {
        if (front.length !== 0 && back.length !== 0) {
            e.preventDefault();
            const data = new FormData();
            let header = {
                headers: { Authorization: 'Bearer ' + user?.jwt }
            };

            //required fields for adding a term
            data.append('front', front);
            data.append('back', back);
            data.append('moduleID', curModule.moduleID.toString());
            data.append('language', curModule.language);

            if (permissionLevel === 'ta') data.append('groupID', currentClass.value.toString());

            //optional fields for adding a term
            if (type.length !== 0) data.append('type', type);

            if (gender.length !== 0) data.append('gender', gender);

            //map through all the tags and make a tag field object for them
            tags.map((label) => {
                return data.append('tag', label || '');
            });

            if (selectedImgFile.size !== 0) data.append('image', selectedImgFile);

            if (selectedAudioFile.size !== 0) data.append('audio', selectedAudioFile);

            axios
                .post('/elleapi/term', data, header)
                .then((res) => {
                    resetFields();
                    updateCurrentModule(curModule);
                })
                .catch((error) => {
                    console.log('submitTerm error: ', error.response);
                    if (error.response) {
                        setError(true);
                        setErrMsg(error.response.data);
                    }
                });
        } else {
            e.preventDefault();
            alert('Please fill out the English Word and Translated Word. Those fields are required!');
        }
    };

    const resetFields = () => {
        setFront('');
        setBack('');
        setType('');
        setGender('');
        setTags([]);
        setSelectedImgFile(new File([], ''));
        setSelectedAudioFile(new File([], ''));
        setImgLabel('Pick an image for the term');
        setAudioLabel('Pick an audio for the term');
        setError(false);
        setErrMsg('');
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

    const toggleTooltip = () => {
        setTooltipOpen(!tooltipOpen);
    };

    return (
        <div>
            <Form onSubmit={(e) => submitTerm(e)}>
                <input type='hidden' value='prayer' />
                {error ? <Alert color='danger'>{errMsg}</Alert> : null}
                <Alert
                    style={{
                        color: '#004085',
                        backgroundColor: 'lightskyblue',
                        border: 'none'
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
                                    placeholder='English Word'
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
                            <FormGroup>
                                <Label for='selectType'>Type:</Label>

                                <Input type='select' name='type' id='selectType' value={type} onChange={(e) => setType(e.target.value)}>
                                    <option value=''>Select</option>
                                    <option value='NN'>NN (Noun)</option>
                                    <option value='VR'>VR (Verb)</option>
                                    <option value='AJ'>AJ (Adjective)+</option>
                                    <option value='AV'>AV (Adverb)</option>
                                    {/* <option value="PH">PH (Phrase)</option> */}
                                </Input>
                            </FormGroup>
                        </Col>

                        <Col>
                            <FormGroup>
                                <Label for='selectGender'>Gender:</Label>

                                <Input type='select' name='gender' id='selectGender' value={gender} onChange={(e) => setGender(e.target.value)}>
                                    <option value=''>Select</option>
                                    <option value='MA'>MA (Male)</option>
                                    <option value='FE'>FE (Female)</option>
                                    <option value='NA'>NA (Nongendered)</option>
                                </Input>
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <Label for='tags'>
                                Tags:{' '}
                                <Image
                                    style={{
                                        width: '15px',
                                        height: '15px',
                                        cursor: 'pointer'
                                    }}
                                    alt={'Info'}
                                    src={InfoImage}
                                    id='infoLbl'
                                    onClick={() => console.log('info')}
                                />
                            </Label>

                            <Tooltip placement='right' isOpen={tooltipOpen} target='infoLbl' toggle={toggleTooltip}>
                                <p style={{ textAlign: 'left' }}>Tags:</p>
                                <p style={{ textAlign: 'left' }}>Adding a tag to a term allows you to associate it with a category.</p>
                                <p style={{ textAlign: 'left' }}>
                                    This can be really helpful when you are trying to make a module based on a specific category by using the add
                                    existing term form.
                                </p>
                                <p style={{ textAlign: 'left' }}>
                                    i.e. The term &quot;apple&quot; can have the tags: &quot;fruit&quot; and &quot;food&quot;.
                                </p>
                            </Tooltip>

                            <br />

                            <FormGroup width='50%'>
                                <Typeahead
                                    id='tags'
                                    multiple
                                    options={allTags}
                                    allowNew
                                    placeholder='Choose a tag...'
                                    newSelectionPrefix='Add a new tag: '
                                    selected={tags}
                                    onChange={(e) => {
                                        const tempList = [];
                                        for (let tag of e) {
                                            if (typeof tag === 'object') {
                                                console.log('bye');
                                                tempList.push(tag.label);
                                            } else {
                                                console.log('hi');
                                                tempList.push(tag);
                                            }
                                        }
                                        setTags(tempList);
                                    }}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='imgFile'>Image:</Label>

                                <Input type='file' accept='.png, .jpg, .jpeg' id='imgFile' label={imgLabel} onChange={imgFileChangedHandler} />
                            </FormGroup>
                        </Col>

                        <Col>
                            <FormGroup>
                                <Label for='audioFile'>Audio:</Label>

                                <br></br>
                                <div
                                    style={{
                                        paddingBottom: '5px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <button
                                        type='button'
                                        onClick={start}
                                        disabled={isRecording}
                                        style={{
                                            border: 'none',
                                            margin: '5px'
                                        }}
                                    >
                                        Record
                                    </button>
                                    <button
                                        type='button'
                                        onClick={stop}
                                        disabled={!isRecording}
                                        style={{
                                            border: 'none',
                                            margin: '5px'
                                        }}
                                    >
                                        Stop
                                    </button>

                                    <button
                                        type='button'
                                        onClick={upload}
                                        disabled={disable}
                                        style={{
                                            border: 'none',
                                            margin: '5px'
                                        }}
                                    >
                                        Upload
                                    </button>
                                </div>

                                {didUpload ? (
                                    <div
                                        style={{
                                            color: 'red',
                                            paddingBottom: '5px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Successfully uploaded recorded audio file!
                                    </div>
                                ) : (
                                    ''
                                )}

                                <div
                                    style={{
                                        paddingBottom: '5px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    <audio src={blobURL} controls={true} />
                                </div>

                                <Input type='file' accept='.ogg, .wav, .mp3' id='audioFile' label={audioLabel} onChange={audioFileChangedHandler} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Button
                                style={{
                                    backgroundColor: 'rgb(0, 64, 133)',
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
