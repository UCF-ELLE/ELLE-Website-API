import React, { useEffect, useState } from 'react';
import { Button, Form, FormGroup, Label, Input, Row, Col, Alert } from 'reactstrap';
import axios from 'axios';
// import MicRecorder from 'mic-recorder';
import { Module } from '@/types/api/modules';
import { useUser } from '@/hooks/useAuth';
import { useAudioRecorder } from 'react-audio-voice-recorder';

export default function AddPhrase({
    currentClass,
    curModule,
    updateCurrentModule,
    setOpenForm
}: {
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (module: Module, task?: string) => void;
    setOpenForm: (num: number) => void;
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;
    const [phFront, setPhFront] = useState<string>('');
    const [phBack, setPhBack] = useState<string>('');
    const [selectedImgFile, setSelectedImgFile] = useState<File>(new File([], ''));
    const [selectedAudioFile, setSelectedAudioFile] = useState<File>(new File([], ''));
    const [imgLabel, setImgLabel] = useState<string>('Pick an image for the term');
    const [audioLabel, setAudioLabel] = useState<string>('Pick an audio for the term');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [blobURL, setBlobURL] = useState<string>('');
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [disable, setDisable] = useState<boolean>(true);
    const [file, setFile] = useState<File>(new File([], ''));
    const [didUpload, setDidUpload] = useState<boolean>(false);
    const { startRecording, stopRecording, recordingBlob, isRecording: isAudioRecording } = useAudioRecorder();

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
                'couldnt find mic.',
                'currently not working in production because getUserMedia CANNOT be run over unsecure netowrk...we need SSL.',
                err
            );
        }
    }, []);

    // Check if audio is recording, if not then set the blob to the state
    useEffect(() => {
        if (!isAudioRecording) {
            const audio = recordingBlob;
            if (audio === undefined) {
                return;
            }
            const blob = new Blob([audio], { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            setBlobURL(url);
            setFile(new File([blob], 'audio.wav', { type: 'audio/wav' }));
            setIsRecording(false);
            setDisable(false);
        }
    }, [isAudioRecording, recordingBlob]);

    const start = () => {
        if (isBlocked) {
            console.log('Permission Denied');
        } else {
            startRecording();
            setIsRecording(true);
            setDisable(true);
        }
    };

    const stop = () => {
        stopRecording();
    };

    const upload = () => {
        setSelectedAudioFile(file);
        setDidUpload(true);

        (document.getElementById('phAudioFile') as HTMLInputElement).disabled = true;
    };

    const submitPhrase = (event: React.FormEvent<HTMLFormElement>) => {
        if (phFront.length !== 0 && phBack.length !== 0) {
            event.preventDefault();
            const data = new FormData();
            let header = {
                headers: { Authorization: 'Bearer ' + user?.jwt }
            };

            //required fields for adding a phrase
            data.append('front', phFront);
            data.append('back', phBack);
            data.append('moduleID', curModule.moduleID.toString());
            data.append('language', curModule.language);
            //the type of a term must be PH in order to added as a phrase in the backend, so this will be hardcoded
            data.append('type', 'PH');

            if (permissionLevel === 'ta') data.append('groupID', currentClass.value.toString());

            //optional fields for adding a phrase
            selectedImgFile.size !== 0 && data.append('image', selectedImgFile);
            selectedAudioFile.size !== 0 && data.append('audio', selectedAudioFile);

            axios
                .post('/elleapi/term', data, header)
                .then((res) => {
                    resetFields();
                    updateCurrentModule(curModule);
                })
                .catch(function (error) {
                    console.log('submitPhrase error: ', error.response);
                });
        } else {
            event.preventDefault();
            alert('Please fill all inputs!');
        }
    };

    const resetFields = () => {
        setPhFront('');
        setPhBack('');
        setSelectedImgFile(new File([], ''));
        setSelectedAudioFile(new File([], ''));
        setImgLabel('Pick an image for the term');
        setAudioLabel('Pick an audio for the term');
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

    return (
        <div>
            <Form onSubmit={(e) => submitPhrase(e)}>
                <Alert
                    color='none'
                    style={{
                        color: '#004085',
                        backgroundColor: 'lightskyblue',
                        border: 'none'
                    }}
                >
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='phFront'>Phrase (English):</Label>
                                <Input
                                    type='text'
                                    name='phFront'
                                    onChange={(e) => setPhFront(e.target.value)}
                                    value={phFront}
                                    id='phFront'
                                    placeholder='Phrase in English'
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='phBack'>Phrase (Translated):</Label>
                                <Input
                                    type='text'
                                    name='phBack'
                                    onChange={(e) => setPhBack(e.target.value)}
                                    value={phBack}
                                    id='phBack'
                                    placeholder='Phrase Translated'
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='phImgFile'>Image:</Label>

                                <Input type='file' accept='.png, .jpg, .jpeg' id='phImgFile' label={imgLabel} onChange={imgFileChangedHandler} />
                            </FormGroup>
                        </Col>

                        <Col>
                            <FormGroup>
                                <Label for='phAudioFile'>Audio:</Label>
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

                                <Input type='file' accept='.ogg, .wav, .mp3' id='phAudioFile' label={audioLabel} onChange={audioFileChangedHandler} />
                            </FormGroup>
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
