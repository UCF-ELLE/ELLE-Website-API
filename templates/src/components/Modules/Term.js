import React, {Fragment} from 'react'
import { Alert, Button, ButtonGroup, Modal, ModalHeader, ModalBody, ModalFooter, Collapse, Input, CustomInput, Tooltip } from 'reactstrap';
import axios from 'axios';

import TagList from './TagList';
import Autocomplete from './Autocomplete';

class Term extends React.Component {
  constructor(props){
    super(props);
    this.editCard = this.editCard.bind(this);
    this.handleDelete = this.handleDelete.bind(this); 
    this.deleteCard = this.deleteCard.bind(this);
    this.toggleCollapsedTags = this.toggleCollapsedTags.bind(this);

    this.toggleImgTooltipOpen = this.toggleImgTooltipOpen.bind(this); 
    this.toggleAudioTooltipOpen = this.toggleAudioTooltipOpen.bind(this); 

    this.submitEdit = this.submitEdit.bind(this);
    this.change = this.change.bind(this);


    this.state = {
      card: this.props.card, //contains all of the data in the card
      modal: false,
      imgTooltipOpen: false, 
      audioTooltipOpen: false, 

      editMode: false, //determines whether or not the editable version of the card is showing
      editedFront: this.props.card.front, //contains the foreign word that can be edited
      editedBack: this.props.card.back, //contains the English word that can be edited
      editedType: this.props.card.type === null ? "" : this.props.card.type, //contains the type of 
      editedGender: this.props.card.gender === null ? "" : this.props.card.gender, //contains the gender of the card in question
      collapseTags: false, //determines whether or not the tags are displayed on the card
      
      selectedImgFile: this.props.card.imageLocation, //contains the location of the image for the card
      selectedAudioFile: this.props.card.audioLocation, //contains the location of the audio for the card
      changedImage: false, //determines whether or not the image file was changed
      changedAudio: false, //determines whether or not the audio file was changed
      baseURL: (new URL(this.props.serviceIP)).protocol + "//" + (new URL(this.props.serviceIP)).hostname, // From e.g. "https://beans.com:5050/api", extracts the "https://beans.com" portion

      //TODO: populate tags with API call instead of dummy data
      tags: [], //contains the list of tags
      originalTags: []
    }

  }

  componentDidMount() {
    this.getTermTags(this.props.card.termID);
  }

  //TODO: handleAddTag and createTag kinda do the same thing. Maybe they should be one thing?
  //function that adds a tag to list of tags on this card(only available when editmode is true)
  handleAddTag = (event) => {
    let list = this.props.addTag(this.state.tags, event.tag);

    this.setState({
      tags: list
    });
  }


  //function that adds a new tag from user input to list of tags on this card(only when editmode is true)
  createTag = (tag) => {
    let tempTags = this.state.tags;

    tempTags.push(tag);

    this.setState({
      tags: tempTags
    });
  }

  //function that gets called when the edit button is pushed. Sets editmode to true
  editCard = () => {
    this.setState({
      editMode: true,
      collapseTags: true
    });
  }

  //function that changes the state of front, back, type, and gender based off of the name given to the input objects
  change(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  //function that inputs image when user uploads a new image to the card
  imgFileSelectedHandler = (event) => {
    this.setState({ 
      selectedImgFile: event.target.files[0], 
      changedImage: true //remember to change it back to false later 
    }); 
  }

  //function that inputs audio when user uploads new audio to the card
  audioFileSelectedHandler = (event) => {
    this.setState({
      selectedAudioFile: event.target.files[0], 
      changedAudio: true //remember to change it back to false later 
    });
  }

  //function that submits all of the edited data put on a card 
  submitEdit = (event) => {
    this.setState({editMode: false});

    const data = new FormData(); 
    let header = {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    };

    data.append('image', this.state.changedImage && this.state.selectedImgFile !== undefined ? this.state.selectedImgFile : null); 
    data.append('audio', this.state.changedAudio && this.state.selectedAudioFile !== undefined ? this.state.selectedAudioFile : null); 
    data.append('front', this.state.editedFront); 
    data.append('back', this.state.editedBack); 
    data.append('language', this.props.card.language); //not editable 

    if (this.props.permissionLevel === "ta") 
      data.append('groupID', this.props.currentClass.value);

    //map through all the tags and make a tag field object for them 
    this.state.tags.map((label) => {
      return ( data.append('tag', label) )   
    })

    data.append('type', this.state.editedType); //editable
    data.append('gender', this.state.editedGender); //editable  
    data.append('termID', this.props.card.termID); //not editable
    
    axios.post(this.props.serviceIP + '/term', data, header)
    .then(res => {
      this.setState({
        changedImage: false, 
        changedAudio: false,   
      });

      this.getTermTags(this.props.card.termID); 
      this.props.updateCurrentModule({ module: this.props.curModule });  
    })
    .catch(error => {
      console.log("submitEdit in Card.js error: ", error.response);
    });
  }

  //toggling delete modal, is not related to delete card API 
  handleDelete = () => {
    this.toggleModal(); 
  }

  //function for deleting a card from the database
  deleteCard = (e) => {
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
        console.log("deleteTerm in Card.js error: ", error.response);
      });
  }

  //function that toggles whether or not tags a visible
  toggleCollapsedTags = () => {
    this.setState({ collapseTags: !this.state.collapseTags });
  }

  toggleModal = () => {
    this.setState({ modal: !this.state.modal });
  }

  toggleImgTooltipOpen = () => {
    this.setState({ imgTooltipOpen: !this.state.imgTooltipOpen }); 
  }

  toggleAudioTooltipOpen = () => {
    this.setState({ audioTooltipOpen: !this.state.audioTooltipOpen }); 
  }

  getTermTags = (id) => {
    let config = {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
      params: {
        termID: id
      }
    }

    axios.get(this.props.serviceIP + '/tags_in_term', config)
    .then( res => {
      this.setState({
        tags: res.data,
        originalTags: JSON.parse(JSON.stringify(res.data))
      })
    })
    .catch(function (error) {
      console.log("getTermTags error: ", error);
    });

  }

  //function that deletes a tag from the list of tags
  handleDeleteTag = (event) => {
    let tempTagList = this.state.tags;
    let tagIndex = tempTagList.indexOf(event.tag);

    if(tagIndex !== -1){
      tempTagList.splice(tagIndex, 1);
    }

    this.setState({
      tags: tempTagList
    });
  }

  //function that cancels the edit and sets everything back to what it was initially
  handleCancelEdit = () => {
    this.setState({
      card: this.props.card,
      modal: false,

      editMode: false,
      editedFront: this.props.card.front,
      editedBack: this.props.card.back,
      editedType: this.props.card.type, 
      editedGender: this.props.card.gender, 
      collapseTags: false,
      
      selectedImgFile: this.props.card.imageLocation, 
      selectedAudioFile: this.props.card.audioLocation, 
      changedImage: false, 
      changedAudio: false, 

      tags: JSON.parse(JSON.stringify(this.state.originalTags))
    })
  }


  render() {
    let {editedFront, editedBack, editedType, editedGender, selectedImgFile, selectedAudioFile} = this.state;

    let imgLink = this.state.baseURL + selectedImgFile;
    let audioLink = this.state.baseURL + selectedAudioFile;

    let disableImgButton = !selectedImgFile;
    let disableAudioButton = !selectedAudioFile;

    let imgButtonClass = disableImgButton ? 'disabled-btn' : 'enabled-btn';
    let audioButtonClass = disableAudioButton ? 'disabled-btn' : 'enabled-btn';

    if (this.state.editMode === false){
      return (
        <Fragment>
        <tr onClick={this.toggleCollapsedTags}>
          <td>{editedBack}</td>
          <td>{editedFront}</td>
          <td>{editedType}</td>
          <td>{editedGender}</td>
          <td style={{textAlign: 'center'}}>
            {/* Add disabled attribute to disable button if no image file found */}
            <Button className={`image-btn ${imgButtonClass}`} href={imgLink} download disabled={disableImgButton}>
              <img src={require('../../Images/image.png')} alt="frame icon" style={{ width: '25px', height: '25px' }} />
            </Button>
          </td>
          <td style={{textAlign: 'center'}}>
            {/* Add disabled attribute to disable button if no audio file found */}
            <Button className={`audio-btn ${audioButtonClass}`} href={audioLink} download disabled={disableAudioButton}>
              <img src={require('../../Images/headphones.png')} alt="headphones icon" style={{ width: '25px', height: '25px' }} />
            </Button>
          </td>

          {this.props.permissionLevel !== "st" 
          ? 
          <td>
            <ButtonGroup>
              <Button style={{backgroundColor: 'lightcyan'}} onClick={() => this.editCard()}>
                <img 
                  src={require('../../Images/tools.png')} 
                  alt="edit icon" 
                  style={{width: '25px', height: '25px'}}
                  />
              </Button>
              <Button style={{backgroundColor: 'lightcoral'}} onClick={this.handleDelete.bind()}>
                <img 
                  src={require('../../Images/delete.png')} 
                  alt="trash can icon" 
                  style={{width: '25px', height: '25px'}}
                  />
              </Button>
            </ButtonGroup>
          </td>
          : null}

            <Modal isOpen={this.state.modal} toggle={this.toggleModal}> 
              <ModalHeader toggle={this.toggleModal}>Delete</ModalHeader>
              
              <ModalBody>
                <Alert color="primary">
                  Deleting this term will remove it from all the users who are currently using this module as well.
                </Alert>
                <p style={{paddingLeft: "20px"}}>Are you sure you want to delete the term: {editedFront}?</p>
              </ModalBody>

              <ModalFooter>
                <Button onClick={this.toggleModal}>Cancel</Button>
                <Button color="danger" onClick={this.deleteCard.bind()}>Delete</Button>
              </ModalFooter>
            </Modal>
        </tr>

        <tr>
          <td style={{border:"none"}} colSpan="8">
            <Collapse isOpen={this.state.collapseTags}>
            <TagList 
              tags={this.state.tags} 
              handleDeleteTag={this.handleDeleteTag} 
              deletable={false}
              />
            </Collapse>
          </td>
        </tr>
        </Fragment>
      )
    } 
    else{
      return (
      <Fragment>
        
      <tr>
        <td>
        <Input 
          type="value" 
          name="editedBack"
          onChange={e => this.change(e)} 
          value={editedBack} 
          />
        </td>

        <td>
          <Input 
            type="value" 
            name="editedFront"
            onChange={e => this.change(e)} 
            value={editedFront} 
            />
        </td>

        <td>
          <CustomInput 
							type="select" 
							name="editedType" 
							id="selectType"
							value={editedType} 
							onChange={e => this.change(e)}>

							<option value="">Select</option>
							<option value="NN">NN (Noun)</option>
							<option value="VR">VR (Verb)</option>
							<option value="AJ">AJ (Adjective)+</option>
							<option value="AV">AV (Adverb)</option>
					</CustomInput>
        </td>

        <td>
          <CustomInput 
							type="select" 
							name="editedGender" 
							id="selectGender"
							value={editedGender} 
							onChange={e => this.change(e)}>

							<option value="">Select</option>
							<option value="M">MA (Male)</option>
							<option value="F">FE (Female)</option>
							<option value="N">NA (Nongendered)</option>
					</CustomInput>
        </td>

        <td>
          <input 
            style={{display: 'none'}}
            type="file" onChange={this.imgFileSelectedHandler}  
            accept=".png, .jpg, .jpeg" 
            ref={imgInput => this.imgInput = imgInput}
          />
          <Button 
            style={{backgroundColor: 'lightseagreen', width: '100%'}} 
            id="uploadImage"
            onClick={() => this.imgInput.click()}
            >
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
          <input 
            style={{display: 'none'}} 
            type="file" onChange={this.audioFileSelectedHandler}
            accept=".ogg, .wav, .mp3"
            ref={audioInput => this.audioInput = audioInput}
          />
          <Button 
            style={{backgroundColor: 'lightseagreen', width: '100%'}} 
            id="uploadAudio"
            onClick={() => this.audioInput.click()}
            >
            <img 
              src={require('../../Images/uploadAudio.png')} 
              alt="Icon made by Srip from www.flaticon.com" 
              style={{width: '25px', height: '25px'}}
            />
          </Button>
          <Tooltip placement="top" isOpen={this.state.audioTooltipOpen} target="uploadAudio" toggle={this.toggleAudioTooltipOpen}>
            Upload Audio
          </Tooltip>
        </td>

        <td>
          <ButtonGroup>
            <Button 
              style={{backgroundColor: 'lightcyan'}} 
              onClick = {() => this.submitEdit()}
              > 
              <img 
                src={require('../../Images/submit.png')} 
                alt="Icon made by Becris from www.flaticon.com" 
                style={{width: '25px', height: '25px'}}
              />
            </Button>
            <Button 
              style={{backgroundColor: 'lightcyan'}} 
              onClick = {() => this.handleCancelEdit()}
              > 
              <img 
                src={require('../../Images/cancel.png')} 
                alt="Icon made by Freepik from www.flaticon.com" 
                style={{width: '25px', height: '25px'}}
              />
            </Button>
          </ButtonGroup>
        </td>

      </tr>

      <tr>
        <td style={{border:"none"}} colSpan="8">
          <TagList 
            tags={this.state.tags} 
            handleDeleteTag={this.handleDeleteTag} 
            deletable={true}
            />
          Add Tag:
          <Autocomplete 
            name={"tags"}
            id={"tags"}
            placeholder={"Tag"}
            handleAddTag={this.handleAddTag}
            createTag={this.createTag}
            renderButton={true}

            suggestions={this.props.allTags} 
            />
        </td>

      </tr>
      </Fragment>
      );
    }
    
  }
}

export default Term
