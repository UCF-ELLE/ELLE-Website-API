import React from 'react';
import { Button, Form, FormGroup, Label, Input, Row, 
	     Col, Alert, Nav, NavItem, NavLink,
		TabContent, TabPane} from 'reactstrap';
import axios from 'axios';
import classnames from 'classnames';

class AddMentorQuestion extends React.Component {
	constructor(props) {
		super(props);

		this.change = this.change.bind(this);

		this.state = {
			questionText: "",//text of the longform question being asked
			selectedImgFile: null, //file location of the picture selected
			selectedAudioFile: null, //file location of the audio selected
			type: [],

			validAnswers: [], //all of the terms not in the module and not already added
			prevValidAnswers: [], //used to see if an answer was added or removed

			submittingAnswer: false, //determines whether or not the AddAnswer form will be shown
			userCreatedAnswer: "", //what the user put in the field when they clicked create answer

			questionID: "",

			isBlocked: false,
			disable: true,
			file: null,

			didUpload: false,
		};
	};

	componentDidMount() {

		this.toggle('1');

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

	}

	//function used by question field change state
	change(e) {
		this.setState({
			[e.target.name]: e.target.value
		});
	}

	submitMCQuestion = (e) => {
		e.preventDefault();
		let answers;
		if (e.target.answer5Text.value == "") {
			answers = [e.target.answer1Text.value,
				e.target.answer2Text.value,
				e.target.answer3Text.value,
				e.target.answer4Text.value];
		} else {
			answers = [e.target.answer1Text.value,
				e.target.answer2Text.value,
				e.target.answer3Text.value,
				e.target.answer4Text.value,
				e.target.answer5Text.value];
		}
		let data = {
			type : "MENTOR_MC",
			question_text : e.target.questionText.value,
			mc_options : answers
		};
		//console.log(data);

		let header = {
			headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
		};

		axios.post(this.props.serviceIP + '/creatementorquestions', data, header)
		.then(res => {
			this.resetFields();
			this.props.updateCurrentModule({ module: this.props.curModule });
		})
		.catch(error => {
			console.log("submitQuestion error: ", error.response);
		})
	}

	submitFRQuestion = (e) => {
		e.preventDefault();
		let data = {
			type : "MENTOR_FR",
			question_text : e.target.questionText.value,
			mc_options : {}
		};

		let header = {
			headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
		};

		axios.post(this.props.serviceIP + '/creatementorquestions', data, header)
		.then(res => {
			this.resetFields();
			this.props.updateCurrentModule({ module: this.props.curModule });
		})
		.catch(error => {
			console.log("submitQuestion error: ", error.response);
		})
	}

	//clears the input fields of the addQuestion form 
	//cannot however change questionID back to blank or else adding a newly created term as an answer would not work 
	//questionID itself will be updated correctly when the addQuestion API request is called
	resetFields = () => {
		this.setState({
			questionText: "",
			selectedImgFile: null, 
			selectedAudioFile: null, 
			type: [],

			submittingAnswer: false, 
			userCreatedAnswer: "", 
		});
	}

	toggle(tab) {
		if (this.state.activeTab !== tab) {
		  this.setState({
			activeTab: tab
		  });
		}
	  }

	render () {
	    return (
			<div>
				<Nav tabs>
					<NavItem>
						<NavLink
							className={classnames({ active: this.state.activeTab === '1' })}
							onClick={() => { this.toggle('1'); }}
						>
							Multiple Choice
						</NavLink>
					</NavItem>
					<NavItem>
						<NavLink
							className={classnames({ active: this.state.activeTab === '2' })}
							onClick={() => { this.toggle('2'); }}
						>
							Free Response
						</NavLink>
					</NavItem>
				</Nav>
				<TabContent activeTab={this.state.activeTab}>
    				<TabPane tabId="1">
						<Form onSubmit={e => this.submitMCQuestion(e)}>

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

											<Input type="text"
											name="answer1Text"
											id="answer1Text"
											placeholder="Answer 1" 
											autoComplete="off"/>

											<Input type="text"
											name="answer2Text"
											id="answer2Text"
											placeholder="Answer 2" 
											autoComplete="off"/>

											<Input type="text"
											name="answer3Text"
											id="answer3Text"
											placeholder="Answer 3" 
											autoComplete="off"/>

											<Input type="text"
											name="answer4Text"
											id="answer4Text"
											placeholder="Answer 4" 
											autoComplete="off"/>

											<Input type="text"
											name="answer5Text"
											id="answer5Text"
											placeholder="Answer 5 (optional)" 
											autoComplete="off"/>
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
					</TabPane>
					<TabPane tabId="2">
					<Form onSubmit={e => this.submitFRQuestion(e)}>

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
					</TabPane>
				</TabContent>
			</div>
	)
	}
}

export default AddMentorQuestion;