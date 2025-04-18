import { Alert, Button, ButtonGroup, Collapse, Input, Modal, ModalBody, ModalFooter, ModalHeader, Tooltip } from 'reactstrap';
import { Module, ModuleQuestionAnswer } from '@/types/api/modules';
import React, { Fragment, useEffect, useState } from 'react';

import Autocomplete from './Autocomplete';
import Image from 'next/image';
import { Tag } from '@/types/api/terms';
import TagList from './TagList';
import axios from 'axios';
import cancelImage from '@/public/static/images/cancel.png';
import deleteImage from '@/public/static/images/delete.png';
import headphonesImage from '@/public/static/images/headphones.png';
// This is awful
import imageImage from '@/public/static/images/image.png';
import submitImage from '@/public/static/images/submit.png';
import toolsImage from '@/public/static/images/tools.png';
import uploadAudioImage from '@/public/static/images/uploadAudio.png';
import uploadImage from '@/public/static/images/uploadImage.png';
import { useUser } from '@/hooks/useAuth';
import { useAudioRecorder } from 'react-audio-voice-recorder';

export default function Term({
    card,
    currentClass,
    updateCurrentModule,
    curModule,
    addTag,
    allTags
}: {
    card: ModuleQuestionAnswer;
    currentClass: { value: number; label: string };
    updateCurrentModule: (module?: Module, task?: string) => void;
    curModule: Module;
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
}) {
    const { startRecording, stopRecording, recordingBlob, isRecording: isAudioRecording } = useAudioRecorder();

    const [modal, setModal] = useState(false);
    const [imgTooltipOpen, setImgTooltipOpen] = useState(false);
    const [audioTooltipOpen, setAudioTooltipOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedFront, setEditedFront] = useState(card.front);
    const [editedBack, setEditedBack] = useState(card.back);
    const [editedType, setEditedType] = useState(card.type === null ? '' : card.type);
    const [editedGender, setEditedGender] = useState(card.gender === null ? '' : card.gender);
    const [collapseTags, setCollapseTags] = useState(false);
    const [selectedImgFile, setSelectedImgFile] = useState(new File([], ''));
    const [selectedAudioFile, setSelectedAudioFile] = useState(new File([], ''));
    const [changedImage, setChangedImage] = useState(false);
    const [changedAudio, setChangedAudio] = useState(false);
    const [tags, setTags] = useState<Tag[]>([]);
    const [originalTags, setOriginalTags] = useState([]);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [blobURL, setBlobURL] = useState<string>('');
    const [isBlocked, setIsBlocked] = useState<boolean>(false);
    const [disable, setDisable] = useState<boolean>(true);
    const [file, setFile] = useState<File>(new File([], ''));
    const [didUpload, setDidUpload] = useState<boolean>(false);
    const { user, loading } = useUser();
    const permissionLevel = user?.permissionGroup;
    let imgInput: HTMLInputElement | null;
    let audioInput: HTMLInputElement | null;

    useEffect(() => {
        if (!loading && user) {
            let config = {
                headers: { Authorization: 'Bearer ' + user?.jwt },
                params: {
                    termID: card.termID
                }
            };

            axios
                .get('/elleapi/tags_in_term', config)
                .then((res) => {
                    setTags(res.data);
                    setOriginalTags(JSON.parse(JSON.stringify(res.data)));
                })
                .catch(function (error) {
                    console.log('getTermTags error: ', error);
                });
        }
    }, [card.termID, loading, user]);

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

    //TODO: handleAddTag and createTag kinda do the same thing. Maybe they should be one thing?
    //function that adds a tag to list of tags on this card(only available when editmode is true)
    const handleAddTag = (tag: Tag) => {
        let list = addTag(tags, tag);

        setTags(list);
    };

    //function that adds a new tag from user input to list of tags on this card(only when editmode is true)
    const createTag = (tag: Tag) => {
        let tempTags = tags;

        tempTags.push(tag);

        setTags(tempTags);
    };

    //function that gets called when the edit button is pushed. Sets editmode to true
    const editCard = () => {
        setEditMode(true);
        setCollapseTags(true);
    };

    //function that inputs image when user uploads a new image to the card
    const imgFileSelectedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            console.log('selectedImgFile: ', event.target.files[0].toString());
            setSelectedImgFile(event.target.files[0]);
            setChangedImage(true);
        }
    };

    //function that inputs audio when user uploads new audio to the card
    const audioFileSelectedHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedAudioFile(event.target.files[0]);
            setChangedAudio(true);
        }
    };

    //function that submits all of the edited data put on a card
    const submitEdit = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setEditMode(false);
        setDidUpload(false);

        const data = new FormData();
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        if (changedImage && selectedImgFile !== undefined) {
            data.append('image', selectedImgFile);
        }

        if (changedAudio && selectedAudioFile !== undefined) {
            data.append('audio', selectedAudioFile);
        }

        editedFront && data.append('front', editedFront);
        editedBack && data.append('back', editedBack);
        card.language && data.append('language', card.language); //not editable

        if (permissionLevel === 'ta') data.append('groupID', currentClass.value.toString());

        //map through all the tags and make a tag field object for them
        tags.map((label) => {
            return data.append('tag', JSON.stringify(label));
        });

        editedType && data.append('type', editedType); //editable
        data.append('gender', editedGender); //editable
        data.append('termID', card.termID.toString()); //not editable

        axios
            .post('/elleapi/term', data, header)
            .then((res) => {
                setChangedImage(false);
                setChangedAudio(false);

                let config = {
                    headers: { Authorization: 'Bearer ' + user?.jwt },
                    params: {
                        termID: card.termID
                    }
                };

                axios
                    .get('/elleapi/tags_in_term', config)
                    .then((res) => {
                        setTags(res.data);
                        setOriginalTags(JSON.parse(JSON.stringify(res.data)));
                    })
                    .catch(function (error) {
                        console.log('getTermTags error: ', error);
                    });
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
    const deleteCard = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setModal(!modal);

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
                console.log('deleteTerm in Card.js error: ', error.response);
            });
    };

    //function that deletes a tag from the list of tags
    const handleDeleteTag = (tag: Tag) => {
        let tempTagList = tags;
        let tagIndex = tempTagList.indexOf(tag);

        if (tagIndex !== -1) {
            tempTagList.splice(tagIndex, 1);
        }

        setTags(tempTagList);
    };

    //function that cancels the edit and sets everything back to what it was initially
    const handleCancelEdit = () => {
        setEditMode(false);
        setEditedFront(card.front);
        setEditedBack(card.back);
        setEditedType(card.type === null ? '' : card.type);
        setEditedGender(card.gender);
        setCollapseTags(false);
        setSelectedImgFile(new File([], ''));
        setSelectedAudioFile(new File([], ''));
        setChangedImage(false);
        setChangedAudio(false);
        setTags(JSON.parse(JSON.stringify(originalTags)));
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
                <tr onClick={() => setCollapseTags(!collapseTags)}>
                    <td>{editedBack}</td>
                    <td>{editedFront}</td>
                    <td>{editedType}</td>
                    <td>{editedGender}</td>
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
                                Deleting this term will remove it from all the users who are currently using this module as well.
                            </Alert>
                            <p style={{ paddingLeft: '20px' }}>Are you sure you want to delete the term: {editedFront}?</p>
                        </ModalBody>

                        <ModalFooter>
                            <Button onClick={() => setModal(!modal)}>Cancel</Button>
                            <Button color='danger' onClick={(e) => deleteCard(e)}>
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
                        colSpan={8}
                    >
                        <Collapse isOpen={collapseTags}>
                            <TagList tags={tags} handleDeleteTag={handleDeleteTag} deletable={false} />
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
                        <Input type='text' name='editedBack' onChange={(e) => setEditedBack(e.target.value)} value={editedBack} />
                    </td>

                    <td>
                        <Input type='text' name='editedFront' onChange={(e) => setEditedFront(e.target.value)} value={editedFront} />
                    </td>

                    <td>
                        <Input type='select' name='select' id='selectType' value={editedType} onChange={(e) => setEditedType(e.target.value)}>
                            <option value=''>Select</option>
                            <option value='NN'>NN (Noun)</option>
                            <option value='VR'>VR (Verb)</option>
                            <option value='AJ'>AJ (Adjective)+</option>
                            <option value='AV'>AV (Adverb)</option>
                        </Input>
                    </td>

                    <td>
                        <Input
                            type='select'
                            name='editedGender'
                            id='selectGender'
                            value={editedGender}
                            onChange={(e) => setEditedGender(e.target.value)}
                        >
                            <option value=''>Select</option>
                            <option value='M'>MA (Male)</option>
                            <option value='F'>FE (Female)</option>
                            <option value='N'>NA (Nongendered)</option>
                        </Input>
                    </td>

                    <td>
                        <input
                            style={{ display: 'none' }}
                            type='file'
                            onChange={(e) => imgFileSelectedHandler(e)}
                            accept='.png, .jpg, .jpeg'
                            ref={(ref) => (imgInput = ref)}
                        />
                        <Button
                            style={{
                                backgroundColor: 'lightseagreen',
                                width: '100%'
                            }}
                            id='uploadImage'
                            onClick={() => imgInput?.click()}
                        >
                            <Image
                                src={uploadImage}
                                alt='Icon made by Pixel perfect from www.flaticon.com'
                                style={{ width: '25px', height: '25px' }}
                            />
                        </Button>
                        <Tooltip placement='top' isOpen={imgTooltipOpen} target='uploadImage' toggle={() => setImgTooltipOpen(!imgTooltipOpen)}>
                            Upload Image
                        </Tooltip>
                    </td>

                    <td>
                        <input
                            style={{ display: 'none' }}
                            type='file'
                            onChange={(e) => audioFileSelectedHandler(e)}
                            accept='.ogg, .wav, .mp3'
                            ref={(ref) => (audioInput = ref)}
                        />
                        <Button
                            style={{
                                backgroundColor: 'lightseagreen',
                                width: '100%'
                            }}
                            id='uploadAudio'
                            onClick={() => audioInput?.click()}
                        >
                            <Image src={uploadAudioImage} alt='Icon made by Srip from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
                        </Button>               
                        <Tooltip placement='top' isOpen={audioTooltipOpen} target='uploadAudio' toggle={() => setAudioTooltipOpen(!audioTooltipOpen)}>
                            Upload Audio File
                        </Tooltip>
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

                {(

                    <tr>
                        <td style={{ border: 'none'}}>
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

                {
                tags && (
                    <tr>
                        <td style={{ border: 'none' }} colSpan={8}>
                            <TagList tags={tags} handleDeleteTag={handleDeleteTag} deletable={true} />
                            Add Tag:
                            <Autocomplete
                                name={'tags'}
                                id={'tags'}
                                placeholder={'Tag'}
                                handleAddTag={handleAddTag}
                                createTag={createTag}
                                renderButton={true}
                                suggestions={allTags}
                            />
                        </td>
                    </tr>
                )}
            </Fragment>
        );
    }
}
