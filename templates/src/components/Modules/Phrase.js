import React from 'react'
import { Alert, Button, ButtonGroup, Input, Modal, ModalHeader, ModalBody, ModalFooter, Tooltip } from 'reactstrap';
import axios from 'axios';

class Phrase extends React.Component {
    constructor(props) {
        super(props);

        this.change = this.change.bind(this);
        this.editPhrase = this.editPhrase.bind(this); 
        this.submitEdit = this.submitEdit.bind(this);
        this.handleDelete = this.handleDelete.bind(this); 
        this.deletePhrase = this.deletePhrase.bind(this);

        this.toggleImgTooltipOpen = this.toggleImgTooltipOpen.bind(this); 
        this.toggleAudioTooltipOpen = this.toggleAudioTooltipOpen.bind(this); 

        this.state = {
            card: this.props.card, 
            editedFront: this.props.card.front,
            editedBack: this.props.card.back, 
            selectedImgFile: this.props.card.imageLocation, 
            selectedAudioFile: this.props.card.audioLocation, 
            id: this.props.card.termID,

            modal: false, 
            editMode: false, 
            changedImage: false, 
            changedAudio: false,
            imgTooltipOpen: false, 
            audioTooltipOpen: false, 
		};
    }

    editPhrase = () => {
        this.setState({ editMode: true }); 
    }

    submitEdit = () => {
        this.setState({editMode: false});

        const data = new FormData(); 

        let header = {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        };

        //TYPEOF this 'term' will always be ph, so we will not allow the user to edit or see the type 

        data.append('image', this.state.changedImage && this.state.selectedImgFile !== undefined ? this.state.selectedImgFile : null); 
        data.append('audio', this.state.changedAudio && this.state.selectedAudioFile !== undefined ? this.state.selectedAudioFile : null); 

        data.append('front', this.state.editedFront); 
        data.append('back', this.state.editedBack); 
        data.append('language', this.props.card.language); //not editable 
        data.append('termID', this.props.card.termID); //not editable

        if (this.props.permissionLevel === "ta") 
            data.append('groupID', this.props.currentClass.value);

        axios.post(this.props.serviceIP + '/term', data, header)
        .then(res => {
          this.setState({
            changedImage: false, 
            changedAudio: false
          });
          
          this.props.updateCurrentModule({ module: this.props.curModule });  
        }).catch(error => {
          console.log("submitEdit in Phrase.js error: ", error.response); 
        });
    }

    handleCancelEdit = () => {
        this.setState({
          card: this.props.card,
          editedFront: this.props.card.front,
          editedBack: this.props.card.back,
          selectedImgFile: this.props.card.imageLocation, 
          selectedAudioFile: this.props.card.audioLocation, 
          id: this.props.card.termID,

          modal: false,
          editMode: false,
          changedImage: false, 
          changedAudio: false, 
        });
    }
      
    handleDelete = () => {
        this.toggleModal(); 
    }

    deletePhrase = () => {
        this.toggleModal(); 

        let header = { 
          data: { 
              termID: this.state.card.termID, 
              groupID: this.props.permissionLevel === "ta" ? this.props.currentClass.value : null 
          },
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        };
    
        axios.delete(this.props.serviceIP + '/term', header)
        .then( res => {
            this.props.updateCurrentModule({ module: this.props.curModule });  
        })
        .catch(error => {
            console.log("deletePhrase error: ", error.response);
        });

    }

    change(e) {
	    this.setState({
	        [e.target.name]: e.target.value
		});
    }
    
    imgFileSelectedHandler = (event) => {
        this.setState({ 
            selectedImgFile: event.target.files[0], 
            changedImage: true //remember to change it back to false later 
        }); 
    }

    audioFileSelectedHandler = (event) => {
        this.setState({
            selectedAudioFile: event.target.files[0], 
            changedAudio: true //remember to change it back to false later 
        });
    }

    toggleImgTooltipOpen = () => {
        this.setState({ imgTooltipOpen: !this.state.imgTooltipOpen }); 
    }
    
    toggleAudioTooltipOpen = () => {
        this.setState({ audioTooltipOpen: !this.state.audioTooltipOpen }); 
    }

    toggleModal = () => {
        this.setState({ modal: !this.state.modal });
    }

    render () {
        let {editedFront, editedBack, selectedImgFile, selectedAudioFile, id, editMode} = this.state;

        let imgLink = "https://endlesslearner.com" + selectedImgFile;
        let audioLink = "https://endlesslearner.com" + selectedAudioFile;

        // let audioLink = "http://localhost:3000" + selectedAudioFile;

        return (
            <>
            {editMode === false ? 
                <tr>
                    <td>{editedFront}</td>
                    <td>{editedBack}</td>
                    <td>
                        {/* favicon is just a placeholder for now more testing needs to be done after deployment */}
                        <Button style={{backgroundColor: 'white', width: '100%'}} href={imgLink} download>
                        <img src={require('../../Images/image.png')} alt="frame icon" style={{width: '25px', height: '25px'}}/>
                        </Button>
                    </td>
                    <td>
                        {/* audio has to be in the same domain */}
                        <Button style={{backgroundColor: 'white', width: '100%'}} href={audioLink} download> 
                        <img src={require('../../Images/headphones.png')} alt="headphones icon" style={{width: '25px', height: '25px'}}/>
                        </Button>
                    </td>
                    
                    {this.props.permissionLevel !== "st" 
                    ? 
                        <td>
                            <ButtonGroup>
                            <Button style={{backgroundColor: 'lightcyan'}} onClick={() => this.editPhrase()}><img src={require('../../Images/tools.png')} alt="edit icon" style={{width: '25px', height: '25px'}}/></Button>
                            <Button style={{backgroundColor: 'lightcoral'}} onClick={this.handleDelete.bind()}><img src={require('../../Images/delete.png')} alt="trash can icon" style={{width: '25px', height: '25px'}}/></Button>
                            </ButtonGroup>
                        </td>
                    : null}

                        <Modal isOpen={this.state.modal} toggle={this.toggleModal}> 
                        <ModalHeader toggle={this.toggleModal}>Delete</ModalHeader>
                        <ModalBody>
                            <Alert color="primary">
                                Deleting this phrase will remove it from all the users who are currently using this module as well.
                            </Alert>
                            <p style={{paddingLeft: "20px"}}>Are you sure you want to delete the phrase: {editedFront}?</p>
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={this.toggleModal}>Cancel</Button>
                            <Button color="danger" onClick={this.deletePhrase.bind()}>Delete</Button>
                        </ModalFooter>
                        </Modal>
                </tr>
            : //else
                <tr>
                    <td><Input type="value" name="editedFront" onChange={e => this.change(e)} value={this.state.editedFront} /></td>
                    <td><Input type="value" name="editedBack" onChange={e => this.change(e)} value={this.state.editedBack} /></td>
                    <td>
                        <input style={{display: 'none'}} type="file" onChange={this.imgFileSelectedHandler}
                            ref={imgInput => this.imgInput = imgInput}/>
                        <Button style={{backgroundColor: 'lightseagreen', width: '100%', fontSize: 'small'}} 
                            id="uploadImage" onClick={() => this.imgInput.click()}>
                            <img 
                                src={require('../../Images/uploadImage.png')} 
                                alt="Icon made by Pixel perfect from www.flaticon.com" 
                                style={{width: '25px', height: '25px'}}
                            />
                        </Button>
                        <Tooltip placement="top" isOpen={this.state.imgTooltipOpen} target="uploadImage" toggle={this.toggleImgTooltipOpen}>
                            Upload Image
                        </Tooltip>
                    </td>
                    <td>
                        <input style={{display: 'none'}} type="file" onChange={this.audioFileSelectedHandler}
                            ref={audioInput => this.audioInput = audioInput}/>
                        <Button style={{backgroundColor: 'lightseagreen', width: '100%', fontSize: 'small'}} 
                            id="uploadAudio" onClick={() => this.audioInput.click()}>
                            <img 
                                src={require('../../Images/uploadAudio.png')} 
                                alt="Icon made by Pixel perfect from www.flaticon.com" 
                                style={{width: '25px', height: '25px'}}
                            />
                        </Button>
                        <Tooltip placement="top" isOpen={this.state.audioTooltipOpen} target="uploadAudio" toggle={this.toggleAudioTooltipOpen}>
                            Upload Audio
                        </Tooltip>
                    </td>

                    <td>
                    <ButtonGroup>
                        <Button style={{backgroundColor: 'lightcyan'}} onClick = {() => this.submitEdit()}>
                        <img 
                            src={require('../../Images/submit.png')} 
                            alt="Icon made by Becris from www.flaticon.com" 
                            style={{width: '25px', height: '25px'}}
                        />
                        </Button>
                        <Button style={{backgroundColor: 'lightcyan'}} onClick = {() => this.handleCancelEdit()}>
                        <img 
                            src={require('../../Images/cancel.png')} 
                            alt="Icon made by Freepik from www.flaticon.com" 
                            style={{width: '25px', height: '25px'}}
                        />
                        </Button>
                    </ButtonGroup>
                    </td>
                </tr>
            }
            </>
        )
    }
}

export default Phrase