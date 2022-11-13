import React from 'react';
import { Button, Form, FormGroup, Label, Input, Row, Col, Alert } from 'reactstrap';

import TagList from './TagList';
import Autocomplete from './Autocomplete';

class AddAnswer extends React.Component {
	constructor(props) {
		super(props);

		this.change = this.change.bind(this);

		this.state = {
			
			front: this.props.initialFront, //foreign version of the word
			back: "", //english translation of the word
			tags: [], //array of tags associated with word

		};
	}

	componentDidMount() {
		this.setState({
			front: this.props.front
		});
	}


	//function that sets the taglist on this form
	updateTagList = (tagList) => {
		this.setState({ tags: tagList });
	}


	change(e) {
	    this.setState({
	      [e.target.name]: e.target.value
		});
  	}

  	changeFront(e) {
  		this.setState({
  			front: this.state.front
  		});
  	}


  	//TODO: Make this submit the answer and then add that answer to the list of answers
  	//on the question that called it

  	//function that submits the data
	submitTerm = (e) => {
		e.preventDefault();

		if (this.state.front.length !== 0 && this.state.back.length !== 0) {   
			this.props.addNewAnswerToList(this.state);
		} 
		else {
			e.preventDefault();
			alert("Please fill all inputs!");
		}
  	}


	//TODO: handleAddTag and createTag kinda do the same thing. Maybe they should be one thing?
	//function that adds a tag to list of tags on this form
	handleAddTag = (event) => {
		let list = this.props.addTag(this.state.tags, event.tag);

		this.setState({
			tags: list
		})
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

	render () {
	    return (
			<div>
			{this.state.id !== "" ? 
			<Form onSubmit={e => this.submitTerm(e)}>
				<input type="hidden" value="prayer" />

				<Alert style={{color: '#004085', backgroundColor: 'lightskyblue', border: "none", borderRadius: "0px"}}>
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
								placeholder={this.props.back} 
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
							<Label for="tags">
								Tags:
							</Label>

							<br/>
							
							<FormGroup width="50%">
								<Autocomplete 
									name={"tags"}
									id={"tags"}
									placeholder={"Tag"}
									handleAddTag={this.handleAddTag}
									createTag={this.createTag}
									renderButton={true}

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
							<Button 
								style={{backgroundColor: '#004085', border: "none"}} 
								type="submit" 
								block
								>
								Create
							</Button>
							<Button 
								style={{backgroundColor: 'steelblue', border: "none"}} 
								onClick={this.props.cancelCreateAnswer} 
								block
								>
								Cancel
							</Button>
						</Col>
					</Row>
				</Alert>
			</Form> : null  }
			</div>
		);
	}
}

export default AddAnswer;