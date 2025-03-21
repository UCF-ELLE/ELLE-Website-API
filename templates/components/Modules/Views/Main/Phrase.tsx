import { Alert, Button, ButtonGroup, Input, Modal, ModalBody, ModalFooter, ModalHeader, Tooltip } from 'reactstrap';
import { Module, ModuleQuestionAnswer } from '@/types/api/modules';
import React, { Fragment, useState, useEffect } from 'react';

import Image from 'next/image';
import axios from 'axios';
import cancelImage from '@/public/static/images/cancel.png';
import headphonesImage from '@/public/static/images/headphones.png';
import imageImage from '@/public/static/images/image.png';
import submitImage from '@/public/static/images/submit.png';
import toolImage from '@/public/static/images/tools.png';
import trashImage from '@/public/static/images/delete.png';
import uploadAudioImage from '@/public/static/images/uploadAudio.png';
import uploadImageImage from '@/public/static/images/uploadImage.png';
import { useUser } from '@/hooks/useAuth';
import { useAudioRecorder } from 'react-audio-voice-recorder';

export default function Phrase({
    card,
    currentClass,
    updateCurrentModule,
    curModule
}: {
    card: ModuleQuestionAnswer;
    currentClass: { value: number; label: string };
    updateCurrentModule: (module: Module, task?: string) => void;
    curModule: Module;
}) {
    const { startRecording, stopRecording, recordingBlob, isRecording: isAudioRecording } = useAudioRecorder();

    const [editedFront, setEditedFront] = useState(card.front);
    const [editedBack, setEditedBack] = useState(card.back);
    const [selectedImgFile, setSelectedImgFile] = useState(new File([], ''));
    const [selectedAudioFile, setSelectedAudioFile] = useState(new File([], ''));
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [blobURL, setBlobURL] = useState<string>('');
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [disable, setDisable] = useState<boolean>(true);
    const [file, setFile] = useState<File>(new File([], ''));
    const [didUpload, setDidUpload] = useState<boolean>(false);
    const [id, setId] = useState(card.termID);
    const [modal, setModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [changedImage, setChangedImage] = useState(false);
    const [changedAudio, setChangedAudio] = useState(false);
    const [imgTooltipOpen, setImgTooltipOpen] = useState(false);
    const [audioTooltipOpen, setAudioTooltipOpen] = useState(false);
    let imgInput: HTMLInputElement | null;
    let audioInput: HTMLInputElement | null;

    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    const start = () => {
        if (isBlocked) {
            console.log('Permission Denied');
        } else {
            startRecording();
            setIsRecording(true);
            setDisable(true);
        }
    };

    useEffect(() => {
        if (!isAudioRecording) {
            const audio = recordingBlob;
            if (audio === undefined) {
                return;
            }
            const blob = new Blob([audio], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            setBlobURL(url);
            setFile(new File([blob], 'audio.mp3', { type: 'audio/mp3' }));
            setIsRecording(false);
            setDisable(false);
        }
    }, [isAudioRecording, recordingBlob]);

    const stop = () => {
        stopRecording();
    };

    const upload = () => {
        setSelectedAudioFile(file);
        // this.setState({ selectedAudioFile: this.state.file });
        setChangedAudio(true);
        setDidUpload(true);

        const audioFile = document.getElementById('audioFile') as HTMLInputElement;
        audioFile.disabled = true;
    };

    const submitEdit = () => {
        setEditMode(false);
        setDidUpload(false);

        const data = new FormData();

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        //TYPEOF this 'term' will always be ph, so we will not allow the user to edit or see the type

        if (changedImage) {
            data.append('image', selectedImgFile);
        }
        if (changedAudio) {
            data.append('audio', selectedAudioFile);
        }

        editedFront && data.append('front', editedFront);
        editedBack && data.append('back', editedBack);
        card.language && data.append('language', card.language); //not editable
        data.append('termID', card.termID.toString()); //not editable

        if (permissionLevel === 'ta') data.append('groupID', currentClass.value.toString());

        axios
            .post('/elleapi/term', data, header)
            .then((res) => {
                //   this.setState({
                //     changedImage: false,
                //     changedAudio: false
                //   });
                setChangedImage(false);
                setChangedAudio(false);

                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('submitEdit in Phrase.js error: ', error.response);
            });
    };

    const handleCancelEdit = () => {
        setEditedFront(card.front);
        setEditedBack(card.back);
        setSelectedImgFile(new File([], ''));
        setSelectedAudioFile(new File([], ''));
        setId(card.termID);
        setModal(false);
        setEditMode(false);
        setChangedImage(false);
        setChangedAudio(false);
    };

    const handleDelete = () => {
        toggleModal();
    };

    const deletePhrase = () => {
        toggleModal();

        let header = {
            data: {
                termID: card.termID,
                groupID: permissionLevel === 'ta' ? currentClass.value : null
            },
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .delete('/elleapi/term', header)
            .then((res) => {
                updateCurrentModule(curModule);
            })
            .catch((error) => {
                console.log('deletePhrase error: ', error.response);
            });
    };

    const imgFileSelectedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            console.log('selectedImgFile: ', event.target.files[0].toString());
            setSelectedImgFile(event.target.files[0]);
            setChangedImage(true);
        }
    };

    const audioFileSelectedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedAudioFile(event.target.files[0]);
            setChangedAudio(true);
        }
    };

    const toggleImgTooltipOpen = () => {
        setImgTooltipOpen(!imgTooltipOpen);
    };

    const toggleAudioTooltipOpen = () => {
        setAudioTooltipOpen(!audioTooltipOpen);
    };

    const toggleModal = () => {
        setModal(!modal);
    };

    let imgLink = '/elleapi' + card.imageLocation;
    let audioLink = '/elleapi' + card.audioLocation;

    let disableImgButton = !card.imageLocation;
    let disableAudioButton = !card.audioLocation;

    let imgButtonClass = disableImgButton ? 'disabled-btn' : 'enabled-btn';
    let audioButtonClass = disableAudioButton ? 'disabled-btn' : 'enabled-btn';


    if (editMode === false) {
        return (
            <Fragment>
                <tr>
                    <td>{editedFront}</td>
                    <td>{editedBack}</td>
                    <td style={{ textAlign: 'center' }}>
                        {/* Add disabled attribute to disable button if no image file found */}
                        <Button className={`image-btn ${imgButtonClass}`} href={imgLink} download disabled={disableImgButton}>
                            <Image src={imageImage} alt='frame icon' style={{ width: '25px', height: '25px' }} />
                        </Button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                        {/* Add disabled attribute to disable button if no audio file found */}
                        <Button className={`audio-btn ${audioButtonClass}`} href={audioLink} download disabled={disableAudioButton}>
                            <Image src={headphonesImage} alt='headphones icon' style={{ width: '25px', height: '25px' }} />
                        </Button>
                    </td>

                    {permissionLevel !== 'st' ? (
                        <td>
                            <ButtonGroup>
                                <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => setEditMode(true)}>
                                    <Image
                                        src={toolImage}
                                        alt='edit icon'
                                        style={{
                                            width: '25px',
                                            height: '25px'
                                        }}
                                    />
                                </Button>
                                <Button style={{ backgroundColor: 'lightcoral' }} onClick={() => toggleModal()}>
                                    <Image
                                        src={trashImage}
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

                    <Modal isOpen={modal} toggle={toggleModal}>
                        <ModalHeader toggle={toggleModal}>Delete</ModalHeader>
                        <ModalBody>
                            <Alert color='primary'>
                                Deleting this phrase will remove it from all the users who are currently using this module as well.
                            </Alert>
                            <p style={{ paddingLeft: '20px' }}>Are you sure you want to delete the phrase: {editedFront}?</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={toggleModal}>Cancel</Button>
                            <Button color='danger' onClick={() => deletePhrase()}>
                                Delete
                            </Button>
                        </ModalFooter>
                    </Modal>
                </tr>
            </Fragment>
        )
    } else {
        return (
            <Fragment>
                <tr>
                    <td>
                        <Input type='number' name='editedFront' onChange={(e) => setEditedFront(e.target.value)} value={editedFront} />
                    </td>
                    <td>
                        <Input type='number' name='editedBack' onChange={(e) => setEditedBack(e.target.value)} value={editedBack} />
                    </td>
                    <td>
                        <input
                            style={{ display: 'none' }}
                            type='file'
                            onChange={imgFileSelectedHandler}
                            accept='.png, .jpg, .jpeg'
                            ref={(ref) => (imgInput = ref)}
                        />
                        <Button
                            style={{
                                backgroundColor: 'lightseagreen',
                                width: '100%',
                                fontSize: 'small'
                            }}
                            id='uploadImage'
                            onClick={() => imgInput?.click()}
                        >
                            <Image
                                src={uploadImageImage}
                                alt='Icon made by Pixel perfect from www.flaticon.com'
                                style={{ width: '25px', height: '25px' }}
                            />
                        </Button>
                        <Tooltip placement='top' isOpen={imgTooltipOpen} target='uploadImage' toggle={toggleImgTooltipOpen}>
                            Upload Image
                        </Tooltip>
                    </td>
                    <td>
                        <input
                            style={{ display: 'none' }}
                            type='file'
                            onChange={audioFileSelectedHandler}
                            accept='.ogg, .wav, .mp3'
                            ref={(ref) => (audioInput = ref)}
                        />
                        <Button
                            style={{
                                backgroundColor: 'lightseagreen',
                                width: '100%',
                                fontSize: 'small'
                            }}
                            id='uploadAudio'
                            onClick={() => audioInput?.click()}
                        >
                            <Image
                                src={uploadAudioImage}
                                alt='Icon made by Pixel perfect from www.flaticon.com'
                                style={{ width: '25px', height: '25px' }}
                            />
                        </Button>
                        <Tooltip placement='top' isOpen={audioTooltipOpen} target='uploadAudio' toggle={toggleAudioTooltipOpen}>
                            Upload Audio
                        </Tooltip>
                    </td>

                    <td>
                        <ButtonGroup>
                            <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => submitEdit()}>
                                <Image src={submitImage} alt='Icon made by Becris from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                            </Button>
                            <Button style={{ backgroundColor: 'lightcyan' }} onClick={() => handleCancelEdit()}>
                                <Image src={cancelImage} alt='Icon made by Freepik from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                            </Button>
                        </ButtonGroup>
                    </td>
                </tr>

                {(

                    <tr>
                        <td style={{ border: 'none' }}>
                            Record Audio:

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
                                        border: 'solid',
                                        borderWidth: '1px',
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
                                        border: 'solid',
                                        borderWidth: '1px',
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
                                        border: 'solid',
                                        borderWidth: '1px',
                                        margin: '5px'
                                    }}
                                >
                                    Upload
                                </button>
                            </div>

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
                        </td>
                    </tr>
                )}
            </Fragment>
        );
    }
}