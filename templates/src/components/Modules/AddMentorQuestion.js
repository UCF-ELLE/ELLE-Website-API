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
			answer1Text: "",
			answer2Text: "",
			answer3Text: "",
			answer4Text: "",
			answer5Text: "",
			type: [],

			questionID: ""
		};
	};

	componentDidMount() {

		this.toggle('1');

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
			answers = [[e.target.answer1Text.value,
				e.target.answer2Text.value,
				e.target.answer3Text.value,
				e.target.answer4Text.value]];
		} else {
			answers = [[e.target.answer1Text.value,
				e.target.answer2Text.value,
				e.target.answer3Text.value,
				e.target.answer4Text.value,
				e.target.answer5Text.value]];
		}
		let data = {
			type : "MENTOR_MC",
			question_text : e.target.questionText.value,
			mc_options : answers,
			moduleID : this.props.curModule.moduleID
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
			mc_options : {},
			moduleID : this.props.curModule.moduleID
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
			answer1Text: "",
			answer2Text: "",
			answer3Text: "",
			answer4Text: "",
			answer5Text: "",
			type: []
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

										<Input type="value"
										name="questionText"
										onChange={e => this.change(e)}
										value={this.state.questionText}
										id="questionText"
										placeholder="Question (required)" />
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

											<Input type="value"
											name="answer1Text"
											id="answer1Text"
											value={this.state.answer1Text}
											onChange={e => this.change(e)}
											placeholder="Answer 1 (required)" />

											<Input type="value"
											name="answer2Text"
											id="answer2Text"
											value={this.state.answer2Text}
											onChange={e => this.change(e)}
											placeholder="Answer 2 (required)" />

											<Input type="value"
											name="answer3Text"
											id="answer3Text"
											value={this.state.answer3Text}
											onChange={e => this.change(e)}
											placeholder="Answer 3 (required)" />

											<Input type="value"
											name="answer4Text"
											id="answer4Text"
											value={this.state.answer4Text}
											onChange={e => this.change(e)}
											placeholder="Answer 4 (required)" />

											<Input type="value"
											name="answer5Text"
											id="answer5Text"
											value={this.state.answer5Text}
											onChange={e => this.change(e)}
											placeholder="Answer 5 (optional)" />
										</FormGroup>
								</Col>
				
							</Row>		
							
							<Row>
								<Col>
									{this.state.questionText == "" || this.state.answer1Text == "" || this.state.answer2Text == "" || this.state.answer3Text == "" || this.state.answer4Text == ""
									?
									<Button disabled style={{backgroundColor: '#004085', border: "none"}} type="submit" block>
										Create (please fill in required fields)
									</Button>
									:
									<Button style={{backgroundColor: '#004085', border: "none"}} type="submit" block>
										Create
									</Button>
									}
									
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
										placeholder="Question (required)" 
										autoComplete="off"/>
									</FormGroup>
								</Col>
							</Row>		
							
							<Row>
								<Col>
									{this.state.questionText == ""
									?
									<Button disabled style={{backgroundColor: '#004085', border: "none"}} type="submit" block>
										Create (please fill in question text)
									</Button>
									:
									<Button style={{backgroundColor: '#004085', border: "none"}} type="submit" block>
										Create
									</Button>
									}

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