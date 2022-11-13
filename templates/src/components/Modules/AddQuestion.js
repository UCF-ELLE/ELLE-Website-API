import React from 'react';
import { Button, Form, FormGroup, Label, Input, 
	CustomInput, Row, Col, Alert, Modal, ModalHeader, ModalBody} from 'reactstrap';
import axios from 'axios';

import Autocomplete from './Autocomplete';
import AnswerButtonList from './AnswerButtonList';
import AddAnswer from './AddAnswer';
import SearchAnswersByTag from './SearchAnswersByTag'

import MicRecorder from 'mic-recorder-to-mp3';

class AddQuestion extends React.Component {
	constructor(props) {
		super(props);

		this.change = this.change.bind(this);

		this.state = {
			questionText: "",//text of the longform question being asked
			front: "", //english translation of the word
			answers: [], //array of answers associated with word
			newlyCreatedAnswers : [], //array of answers the user created via this form
			newlyCreatedAnswersIDArray: [], //array that stores IDs of new answers after they're added
			selectedImgFile: null, //file location of the picture selected
			selectedAudioFile: null, //file location of the audio selected
			type: [],

			validAnswers: [], //all of the terms not in the module and not already added
			prevValidAnswers: [], //used to see if an answer was added or removed

			imgLabel: "Pick an image for the question", 
			audioLabel: "Pick an audio for the question",

			submittingAnswer: false, //determines whether or not the AddAnswer form will be shown
			userCreatedAnswer: "", //what the user put in the field when they clicked create answer

			searchingByTag: false,

			questionID: "",

			Mp3Recorder: new MicRecorder({ bitRate: 128 }),

			isRecording: false,
			blobURL: '',
			isBlocked: false,
			disable: true,
			file: null,

			didUpload: false,
		};
	};

	// componentDidMount() {
	// 	this.setValidAnswers();
	// }

	componentDidMount() {
		this.setValidAnswers();

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
		// 	() => {
		// 			console.log('Permission Granted');
		// 			this.setState({ isBlocked: false });
		// 	},
		// 	() => {
		// 			console.log('Permission Denied');
		// 			this.setState({ isBlocked: true })
		// 	},
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
			const phraseName = document.getElementById('questionText').value.replace(/\s+/g, '-').toLowerCase();

			// this.state.file = new File(buffer, `question_${moduleIdentifier}_${phraseName}.mp3`, {
			// 		type: blob.type,
			// 		lastModified: Date.now()
			// });

			this.setState({
				file: new File(buffer, `question_${moduleIdentifier}_${phraseName}.mp3`, { type: blob.type, lastModified: Date.now() }) 
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

		document.getElementById('qstAudioFile').disabled = true;

		console.log(this.state.selectedAudioFile)
	}

	//function that sets the image file to the one selected
	imgFileChangedHandler = (event) => {
		this.setState({
			selectedImgFile: event.target.files[0],
			imgLabel: event.target.files[0] === undefined ? "Pick an image for the question" : event.target.files[0].name
		});
	}

	//function that sets the audio file to the one selected
	audioFileChangedHandler = (event) => {
		this.setState({
			selectedAudioFile: event.target.files[0],
			audioLabel: event.target.files[0] === undefined ? "Pick an audio for the question" : event.target.files[0].name
		});
	}

	//function used by question field change state
	change(e) {
		this.setState({
			[e.target.name]: e.target.value
		});
	}

	submitQuestion = (e) => {
		if(this.state.questionText.length !== 0){
			e.preventDefault();
			let data = new FormData();
			let header = {
				headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
			};

			data.append('questionText', this.state.questionText);		
			data.append('type', "LONGFORM"); 
			data.append('moduleID', this.props.curModule.moduleID);

			this.props.permissionLevel === "ta" ? data.append('groupID', this.props.currentClass.value) : data.append('groupID', null);

			if (this.state.selectedImgFile !== null || this.state.selectedImgFile !== undefined)
				data.append('image', this.state.selectedImgFile);

			if (this.state.selectedAudioFile !== null || this.state.selectedAudioFile !== undefined)
				data.append('audio', this.state.selectedAudioFile);

			data.append('answers', JSON.stringify(this.state.answers.map((answer) => {return answer.id})))

			let NewlyCreatedAnswerJSONList = this.state.newlyCreatedAnswers.map((answer) => {
		      return {
		        "front": answer.front,
		        "back": answer.back,
		        "language": this.props.curModule.language,
		        "tags": answer.tags
		      }
		    })

    		let stringyAnswerList = JSON.stringify(NewlyCreatedAnswerJSONList.map((entry) => {return entry}));

    		data.append('arr_of_terms', stringyAnswerList);

			axios.post(this.props.serviceIP + '/question', data, header)
			.then(res => {
				this.resetFields();
				this.props.updateCurrentModule({ module: this.props.curModule });
			})
			.catch(error => {
				console.log("submitQuestion error: ", error.response);
			})

		}
	}

	
	//TODO: handleAddAnswer and createAnswer kinda do the same thing. Maybe they should be one thing?
	//function that takes a string and adds the corresponding answer object to this.state.answers
	handleAddAnswer = (event) => {
		let list = this.state.answers;
		
		let answerObject = this.props.allAnswers.find(
			(answer) => {
				if(answer.front === event.answer){
					return true;
				} else{
					return false;
				}
			}
		);

		if(answerObject === undefined){
			answerObject = this.props.allAnswers.find(
				(answer) => {
					if(answer.back === event.answer){
						return true;
					} else{
						return false;
					}
				}
			)
		}

		if(answerObject !== undefined){
			list.push(answerObject);
		}

		this.setState({
			answers: list
		});

		this.setValidAnswers();
	}

	//sets this.state.validAnswers to be all of the answers not already added to this form
	setValidAnswers = () => {
		let tempValidAnswers = this.props.allAnswers;

		let frontArray = this.state.answers.map(answer => {return answer.front});
		let backArray = this.state.answers.map(answer => {return answer.back});

		tempValidAnswers = tempValidAnswers.filter(
			(answer) => {
				if (frontArray.indexOf(answer.front) === -1 && backArray.indexOf(answer.back) === -1){
					return true;
				} 
				else {
					return false;
				}
			}
		)

		this.setState({
			validAnswers: tempValidAnswers,
		});
	}

	//function that adds a new answer from user input to list of answers on this form
	createAnswer = (answer) => {
		this.setState({
			submittingAnswer: true,
			userCreatedAnswer: answer
		});
	}

	toggleSearchByTagForm = () => {
		this.setValidAnswers();
		this.props.getAllTags();

		this.setState({
			searchingByTag: !this.state.searchingByTag
		});
	}

	//function that allows user to cancel AddAnswer form
	cancelCreateAnswer = () => {
		this.setState({
			submittingAnswer: false
		});
	}

	//function that adds a newly created answer to the list of answers on this question
	addNewAnswerToList = (answer) => {
		let tempNewlyCreatedAnswers = this.state.newlyCreatedAnswers;
		tempNewlyCreatedAnswers.push(answer);

		this.setState({
			newlyCreatedAnswers: tempNewlyCreatedAnswers,
			submittingAnswer: false
		});
	}

	//function that removes a answer from the list of answers on this form
	handleDeleteAnswer = (event) => {
		let tempAnswerButtonList = this.state.answers;
		
		let answerObject = this.state.answers.find((answer) => {
			if(answer.front === event.answer) {
				return true;
			} 
			else {
				return false;
			}
		});

		let answerIndex = tempAnswerButtonList.indexOf(answerObject);

		if(answerIndex !== -1){
		  	tempAnswerButtonList.splice(answerIndex, 1);
		}

		this.setState({
			answers: tempAnswerButtonList
		});

		this.setValidAnswers();

	}

	handleDeleteNewAnswer = (event) => {
		let tempAnswerButtonList = this.state.newlyCreatedAnswers;
		
		let answerObject = this.state.newlyCreatedAnswers.find((answer) => {
			if(answer.front === event.answer) {
				return true;
			} 
			else {
				return false;
			}
		});

		let answerIndex = tempAnswerButtonList.indexOf(answerObject);

		if(answerIndex !== -1){
		  tempAnswerButtonList.splice(answerIndex, 1);
		}

		this.setState({
			newlyCreatedAnswers: tempAnswerButtonList
		});

	}

	//clears the input fields of the addQuestion form 
	//cannot however change questionID back to blank or else adding a newly created term as an answer would not work 
	//questionID itself will be updated correctly when the addQuestion API request is called
	resetFields = () => {
		this.setState({
			questionText: "",
			front: "", 
			answers: [], 
			newlyCreatedAnswers : [], 
			newlyCreatedAnswersIDArray: [], 
			selectedImgFile: null, 
			selectedAudioFile: null, 
			type: [],

			imgLabel: "Pick an image for the question", 
			audioLabel: "Pick an audio for the question",

			submittingAnswer: false, 
			userCreatedAnswer: "", 
		});

		this.setValidAnswers();
	}

	render () {
	    return (
			<div>
			<Form onSubmit={e => this.submitQuestion(e)}>
				<input type="hidden" value="prayer" />

				<Alert style={{color: '#004085', backgroundColor: 'lightskyblue', border: "none"}}>
				<Row>
					<Col>
						<FormGroup>			
							<Label for="questionText">
								Question:
							</Label>

							<Input type="text"
							name="questionText"
							onChange={e => this.change(e)}
							value={this.state.questionText}
							id="questionText"
							placeholder="Question" 
							autoComplete="off"/>
						</FormGroup>
					</Col>
				</Row>

				<Row>

					<Col>
						<Label for="answers">
							Answers:
						</Label>

						<br/>
						
							<FormGroup width="200%">
								<Autocomplete 
									name={"answers"}
									id={"answers"}
									placeholder={"Answer"}
									handleAddAnswer={this.handleAddAnswer}
									createAnswer={this.createAnswer}
									renderButton={true}
									autoCompleteStyle={{borderWidth: '0px', borderStyle: "none", width: "100%"}}
									needID={0}
									suggestions={this.state.validAnswers
												.map((answer) => {return(answer.front)})
													.concat(this.state.validAnswers
														.map((answer) => {return(answer.back)})
														)
														.filter((answer, i, validAnswers) => {
															if(validAnswers.indexOf(answer) !== i){
																return false;
															} else{
																return true;
															}
														})
												}
							    />
						    </FormGroup>
					</Col>
						    
					<Col>
						<br/>
						    <Button onClick={this.toggleSearchByTagForm}>
						    	Search By Tag
						    </Button>
				   	</Col>
	
				</Row>

				<Row>
					<Col>
						<Alert color="warning">
							<Label> Answers: </Label>
							<AnswerButtonList 
							answers={this.state.answers.map((answer) => { 
									return(answer.front)}
									)} 
							handleDeleteAnswer={this.handleDeleteAnswer} 
							deletable={true}
							/>
							
							<AnswerButtonList
							answers={this.state.newlyCreatedAnswers.map((answer) =>{
									return(answer.front)}
									)}
							handleDeleteAnswer={this.handleDeleteNewAnswer}
							deletable={true}
							/>
						</Alert>
					</Col>
				</Row>

				<Row>
					<Col>
						<FormGroup>
							<Label for="qstImgFile">
								Image:
							</Label>

							<CustomInput 
							type="file" 
							accept=".png, .jpg, .jpeg" 
							id="qstImgFile" 
							label={this.state.imgLabel} 
							onChange={this.imgFileChangedHandler}
							/>
						</FormGroup>
					</Col>
					
					<Col>
						<FormGroup>
							<Label for="qstAudioFile">
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
								id="qstAudioFile" 
								label={this.state.audioLabel} 
								onChange={this.audioFileChangedHandler}
								/>
						</FormGroup>
					</Col>
				</Row>
				
				
				<Row>
					<Col>
						<Button style={{backgroundColor: '#004085', border: "none"}} type="submit" block>
							Create
						</Button>
						<Button style={{backgroundColor: 'steelblue', border: "none"}} onClick={() => this.props.setOpenForm(0)} block>
							Cancel
						</Button>
					</Col>
				</Row>
				</Alert>
			</Form> 

		{/*TODO: make the screen focus on this after it gets opened*/}
			<Modal isOpen={this.state.submittingAnswer}>
				   
				<ModalHeader>
					Add Answer: 
				</ModalHeader>
				<ModalBody>
					<AddAnswer
						curModule={this.props.curModule} 
						updateCurrentModule={this.props.updateCurrentModule}
						serviceIP={this.props.serviceIP}
						deleteTag={this.props.deleteTag}
						addTag={this.props.addTag}
						allTags={this.props.allTags}
						front={this.state.userCreatedAnswer}
						initialFront={this.state.userCreatedAnswer}

						cancelCreateAnswer={this.cancelCreateAnswer}
						addNewAnswerToList={this.addNewAnswerToList}
					/>
				</ModalBody>
							
			</Modal>

			<Modal isOpen={this.state.searchingByTag}>

				<ModalHeader toggle={this.toggleSearchByTagForm}>
					Search By Tag
				</ModalHeader>

				<ModalBody style={{padding: "0px"}}>   
					<SearchAnswersByTag
						curModule={this.props.curModule} 
						updateCurrentModule={this.props.updateCurrentModule}
						serviceIP={this.props.serviceIP}
						deleteTag={this.props.deleteTag}
						addTag={this.props.addTag}
						allTags={this.props.allTags}
						allAnswers={this.state.validAnswers}
						handleAddAnswer={this.handleAddAnswer}
						toggleSearchByTagForm={this.toggleSearchByTagForm}   
					>
					</SearchAnswersByTag>
				</ModalBody>

			</Modal>
			</div>
	)
	}
}

export default AddQuestion;