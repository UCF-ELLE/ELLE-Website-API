import React from 'react';
import { Button, Form, FormGroup, Label, Input, CustomInput, Row, Col, Alert, Tooltip } from 'reactstrap';
import axios from 'axios';

import TagList from './TagList';
import Autocomplete from './Autocomplete';

import MicRecorder from 'mic-recorder-to-mp3';

class AddTerm extends React.Component {
	constructor(props) {
		super(props);

		this.change = this.change.bind(this);

		this.state = {
			front: "", //foreign version of the word
			back: "", //english translation of the word
			type: "", //NN, VR, AJ, AV, PH
			gender: "", //MA, FE, NA
			tags: [], //array of tags associated with word
			selectedImgFile: null, //file location of the picture selected
			selectedAudioFile: null, //file location of the audio selected

			imgLabel: "Pick an image for the term", 
			audioLabel: "Pick an audio for the term",

			tooltipOpen: false,
			tagInfoModalOpen: false, 
			error: false, 
			errMsg: "",

			Mp3Recorder: new MicRecorder({ bitRate: 128 }),
			isRecording: false,
			blobURL: '',
			isBlocked: false,
			disable: true,
			file: null,

			didUpload: false,
		};
	}

	componentDidMount() {
			// navigator.getUserMedia({ audio: true },

		try {
				console.log("currently not working in production because getUserMedia CANNOT be run over unsecure netowrk...we need SSL.")

				navigator.mediaDevices.getUserMedia({ audio: true },
						() => {
								console.log('Permission Granted');
								this.setState({ isBlocked: false });
						},
						() => {
								console.log('Permission Denied');
								this.setState({ isBlocked: true })
						},
				);

		} catch (err) {
				console.log("couldnt find mic.")
				console.log("currently not working in production because getUserMedia CANNOT be run over unsecure netowrk...we need SSL.")
				console.log(err)
		}

		// navigator.mediaDevices.getUserMedia({ audio: true },
		// 		() => {
		// 				console.log('Permission Granted');
		// 				this.setState({ isBlocked: false });
		// 		},
		// 		() => {
		// 				console.log('Permission Denied');
		// 				this.setState({ isBlocked: true })
		// 		},
		// );

	}

	start = () => {
			if (this.state.isBlocked) {
					console.log('Permission Denied');
			} else {
					this.state.Mp3Recorder
					.start()
					.then(() => {
							this.setState({ isRecording: true });
					}).catch((e) => console.error(e));

					// this.state.disable = true
		      this.setState({ disable: true });
			}
	}

	stop = () => {
			this.state.Mp3Recorder
			.stop()
			.getMp3()
			.then(([buffer, blob]) => {
					const blobURL = URL.createObjectURL(blob)
					this.setState({ blobURL, isRecording: false });

					const moduleIdentifier = document.getElementById('module-name').textContent.replace(/\s+/g, '-').toLowerCase();
					const termName = document.getElementById('back').value.replace(/\s+/g, '-').toLowerCase();

					// this.state.file = new File(buffer, `term_${moduleIdentifier}_${termName}.mp3`, {
					// 		type: blob.type,
					// 		lastModified: Date.now()
					// });

					this.setState({
						file: new File(buffer, `term_${moduleIdentifier}_${termName}.mp3`, { type: blob.type, lastModified: Date.now() }) 
					})
					
					console.log(this.state.file)
					
					
			}).catch((e) => console.log(e));
			
			// this.state.disable = false
    	this.setState({ disable: false });
	}
	
	upload = () => {
			this.state.selectedAudioFile = this.state.file
			// this.setState({ selectedAudioFile: this.state.file })

			this.setState({ didUpload: true });

			document.getElementById('audioFile').disabled = true;

			console.log(this.state.selectedAudioFile)
	}


	//function that sets the taglist on this form
	updateTagList = (tagList) => {
		this.setState({ tags: tagList });
	}

	//function never gets used, consider deleting it
	updateDeckID(newID) {
		this.setState({
			id: newID,
		});
	}

	imgFileChangedHandler = (event) => {
	  	this.setState({
			selectedImgFile: event.target.files[0],
			imgLabel: event.target.files[0] === undefined ? "Pick an image for the term" : event.target.files[0].name
		});
	}

	audioFileChangedHandler = (event) => {
		this.setState({
			selectedAudioFile: event.target.files[0],
			audioLabel: event.target.files[0] === undefined ? "Pick an audio for the term" : event.target.files[0].name
		});
	}

	change(e) {
	    this.setState({
	      	[e.target.name]: e.target.value
		});
  	}

  	//function that submits the data
	submitTerm = (e) => {
		if (this.state.front.length !== 0 && this.state.back.length !== 0) {   
			e.preventDefault();
			const data = new FormData(); 
			let header = {
				headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
			};

			//required fields for adding a term
			data.append('front', this.state.front); 
			data.append('back', this.state.back); 
			data.append('moduleID', this.props.curModule.moduleID); 
			data.append('language', this.props.curModule.language); 

			if (this.props.permissionLevel === "ta") 
				data.append('groupID', this.props.currentClass.value); 

			//optional fields for adding a term
			if (this.state.type.length !== 0)
				data.append('type', this.state.type); 

			if (this.state.gender.length !== 0)
				data.append('gender', this.state.gender); 

			//map through all the tags and make a tag field object for them 
			this.state.tags.map((label) => {
				return ( data.append('tag', label) )
			})

			if (this.state.selectedImgFile !== null || this.state.selectedImgFile !== undefined)
				data.append('image', this.state.selectedImgFile);

			if (this.state.selectedAudioFile !== null || this.state.selectedAudioFile !== undefined)
				data.append('audio', this.state.selectedAudioFile);

			axios.post(this.props.serviceIP + '/term', data, header)
			.then(res => {
				this.resetFields(); 
				this.props.updateCurrentModule({ module: this.props.curModule });
			}) 
			.catch(error => {
				console.log("submitTerm error: ", error.response);
				if (error.response) {
					this.setState({
						error: true,
						errMsg: error.response.data
					});
				}
			});

		} 
		else {
			e.preventDefault();
			alert("Please fill out the English Word and Translated Word. Those fields are required!");
		}
  }

	resetFields = () => {
		this.setState({
			front: "", 
			back: "", 
			type: "", 
			gender: "", 
			tags: [], 
			selectedImgFile: null, 
			selectedAudioFile: null, 

			imgLabel: "Pick an image for the term", 
			audioLabel: "Pick an audio for the term",

			error: false,
			errMsg: ""
		});
	}

	//TODO: handleAddTag and createTag kinda do the same thing. Maybe they should be one thing?
	//function that adds a tag to list of tags on this form
	handleAddTag = (event) => {
		let list = this.props.addTag(this.state.tags, event.tag);

		this.setState({
			tags: list
		});
	}

	//function that adds a new tag from user input to list of tags on this form
	createTag = (tag) => {
		let tempTags = this.state.tags;

		tempTags.push(tag);

		this.setState({
			tags: tempTags
		});
	}

	//function that removes a tag from the list of tags on this form
	handleDeleteTag = (event) => {
		let list = this.props.deleteTag(this.state.tags, event.tag);

		this.setState({
			tags: list
		});
	}

	toggleTooltip = () => {
		this.setState({ tooltipOpen: !this.state.tooltipOpen });
	}

	render () {
		return (
			<div>
			
			<Form onSubmit={e => this.submitTerm(e)}>
				<input type="hidden" value="prayer" />
				{this.state.error ? <Alert color="danger">{this.state.errMsg}</Alert> : null}
				<Alert style={{color: '#004085', backgroundColor: 'lightskyblue', border: "none"}}>
				<Row>
					<Col>
						<FormGroup>			
							<Label for="back">
								English Word:
							</Label>

							<Input type="text"
							name="back"
							onChange={e => this.change(e)}
							value={this.state.back}
							id="back"
							placeholder="English Word" 
							autoComplete="off"/>
						</FormGroup>
					</Col>
				</Row>
				
				<Row>
					<Col>
						<FormGroup>
							<Label for="front">
								Translated Word:
							</Label>

							<Input type="text"
							name="front"
							onChange={e => this.change(e)}
							value={this.state.front}
							id="front"
							placeholder="Translated Word"
							autoComplete="off" />
						</FormGroup>
					</Col>
				</Row>

				<Row>
					<Col>
						<FormGroup>
							<Label for="selectType">
								Type:
							</Label>

							<CustomInput 
								type="select" 
								name="type" 
								id="selectType"
								value={this.state.type} 
								onChange={e => this.change(e)}>

								<option value="">Select</option>
								<option value="NN">NN (Noun)</option>
								<option value="VR">VR (Verb)</option>
								<option value="AJ">AJ (Adjective)+</option>
								<option value="AV">AV (Adverb)</option>
								{/* <option value="PH">PH (Phrase)</option> */}

							</CustomInput>
						</FormGroup>
					</Col>

					<Col>
						<FormGroup>
							<Label for="selectGender">
								Gender:
							</Label>
							
							<CustomInput 
								type="select" 
								name="gender" 
								id="selectGender" 
								value={this.state.gender} 
								onChange={e => this.change(e)}>

								<option value="">Select</option>
								<option value="MA">MA (Male)</option>
								<option value="FE">FE (Female)</option>
								<option value="NA">NA (Nongendered)</option>

							</CustomInput>
						</FormGroup>
					</Col>
				</Row>
				
				<Row>
					<Col>
						<Label for="tags">
							Tags: {' '}
							<img 
								style={{width: "15px", height: "15px", cursor: "pointer"}} 
								src={require('../../Images/info.png')}
								id="infoLbl"
								onClick={this.toggleTagInfoModal}
							/>
						</Label>

						<Tooltip placement="right" isOpen={this.state.tooltipOpen} target="infoLbl" toggle={this.toggleTooltip}>
							<p style={{textAlign: "left"}}>Tags:</p>
							<p style={{textAlign: "left"}}>Adding a tag to a term allows you to associate it with a category.</p>
							<p style={{textAlign: "left"}}>This can be really helpful when you are trying to make a module based on a specific category by using the add existing term form.</p>
							<p style={{textAlign: "left"}}>i.e. The term "apple" can have the tags: "fruit" and "food".</p>
						</Tooltip>

						<br/>
						
						<FormGroup width="50%">
							<Autocomplete 
								name={"tags"}
								id={"tags"}
								placeholder={"Tag"}
								handleAddTag={this.handleAddTag}
								createTag={this.createTag}
								renderButton={true}
								autoCompleteStyle={{borderWidth: '0px', borderStyle: "none", width: "40%"}}

								suggestions={this.props.allTags} 
							/>
						</FormGroup>
						
						{/*Lists all of the tags on this term, displayed as buttons*/}
						<Alert color="warning">
							<TagList 
								tags={this.state.tags} 
								handleDeleteTag={this.handleDeleteTag} 
								updateTagList={this.updateTagList} 
								deletable={true}
							/>
						</Alert>
						
					</Col>
				</Row>

				<Row>
					<Col>
						<FormGroup>
							<Label for="imgFile">
								Image:
							</Label>

							<CustomInput 
								type="file" 
								accept=".png, .jpg, .jpeg" 
								id="imgFile" 
								label={this.state.imgLabel} 
								onChange={this.imgFileChangedHandler}
							/>
						</FormGroup>
					</Col>
					
					<Col>
						<FormGroup>
							<Label for="audioFile">
								Audio:
							</Label>

							<br></br>
							<div style={{paddingBottom: '5px', display: 'flex',  justifyContent:'center', alignItems:'center'}}>
									<button type="button" onClick={this.start} disabled={this.state.isRecording} style={{border: "none", margin: '5px'}}>
											Record
									</button>
									<button type="button" onClick={this.stop} disabled={!this.state.isRecording} style={{border: "none", margin: '5px'}}>
											Stop
									</button>

									<button type="button" onClick={this.upload} disabled={this.state.disable} style={{border: "none", margin: '5px'}}>
											Upload
									</button>
							</div>

							{this.state.didUpload ? <div style={{color: 'red', paddingBottom: '5px', display: 'flex',  justifyContent:'center', alignItems:'center', fontSize: '12px'}}>Successfully uploaded recorded audio file!</div> : '' }  

							<div style={{paddingBottom: '5px', display: 'flex',  justifyContent:'center', alignItems:'center'}}>
									<audio src={this.state.blobURL} controls="controls" />
							</div>

							<CustomInput 
								type="file" 
								accept=".ogg, .wav, .mp3" 
								id="audioFile" 
								label={this.state.audioLabel} 
								onChange={this.audioFileChangedHandler}
							/>
						</FormGroup>
					</Col>
				</Row>
				<Row>
					<Col>
						<Button style={{backgroundColor: 'rgb(0, 64, 133)', border: "none"}} type="submit" block>
							Create
						</Button>
						<Button style={{backgroundColor: 'steelblue', border: "none"}} onClick={() => this.props.setOpenForm(0)} block>
							Cancel
						</Button>
					</Col>
				</Row>
				</Alert>
			</Form>
			</div>
		)
	}
}

export default AddTerm;