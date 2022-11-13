import React from 'react';
import { Button, Form, FormGroup, Label, Input, Row, Col, Alert, Card } from 'reactstrap';
import axios from 'axios';

import TagList from './TagList';
import Autocomplete from './Autocomplete';
import AnswerButtonList from './AnswerButtonList'

class AddExistingTerm extends React.Component {
	constructor(props) {
		super(props);

		this.change = this.change.bind(this);

		this.state = {
			search: "",
			tags: [], //array of tags associated with word
			previousTags: [],
			addedTerms: [],
			tagFilteredTerms: []
		};
	}

	//function that sets the taglist on this form
	updateTagList = (tagList) => {
		this.setState({tags: tagList})
	}

	change(e) {
	    this.setState({
	      [e.target.name]: e.target.value
		})
  	}

  	//function that submits the data
	submitExistingTerms = (e) => {
		e.preventDefault();

		let header = {
	      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
		}

		let groupID = null; 
		
		if (this.props.permissionLevel === "ta")
			groupID = this.props.currentClass.value; 

	    for (let i = 0; i < this.state.addedTerms.length; i++) {
	    	let data = {
	    		termID: this.state.addedTerms[i].id,
				moduleID: this.props.curModule.moduleID,
				groupID: groupID
	    	}
	    	
	    	axios.post(this.props.serviceIP + '/attachterm', data, header)
	    	.then( res => {
	    		if (i === (this.state.addedTerms.length - 1)) {
	    			this.props.updateCurrentModule({module: this.props.curModule});
	    		}
	    	})
	    	.catch( error => {
	    		console.log("submitExistingTerms error: ", error.response)
	    	})
	    	.then(() => {
	    		this.resetFields();
	    	})
	    }
  	}

	resetFields = () => {
		this.setState({
			search: "",
			addedTerms: [],
		})

		this.props.updateCurrentModule({module: this.props.curModule});
	}

	//TODO: handleAddTag and createTag kinda do the same thing. Maybe they should be one thing?
	//function that adds a tag to list of tags on this form
	handleAddTag = (event) => {
		let list = this.props.addTag(this.state.tags, event.tag);

		this.setState({
			tags: list
		})
		this.updateTagFilteredTerms();
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

		this.updateTagFilteredTerms();
	}

  	handleDeleteAnswer = (event) => {
		let tempAnswerButtonList = this.state.addedTerms;
		
		let answerObject = this.state.addedTerms.find((answer) => {
			if(answer.front === event.answer){
				return true;
			} else {
				return false;
			}
		});

		let answerIndex = tempAnswerButtonList.indexOf(answerObject);

		if(answerIndex !== -1){
		  tempAnswerButtonList.splice(answerIndex, 1);
		}

		this.setState({
			addedTerms: tempAnswerButtonList
		});
	}

	handleAddExistingTerm = (event) => {
		let tempAddedTerms = this.state.addedTerms;

		tempAddedTerms.push({front: event.front, id: event.id});
		
		this.setState({
			addedTerms: tempAddedTerms
		});
	}

	updateTagFilteredTerms = () => {
		this.setState({
			tagFilteredTerms: []
		});

		for(let i = 0; i < this.state.tags.length; i++){
			let header = {
				headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
				params: {'tag_name': this.state.tags[i]}
			}

			axios.get(this.props.serviceIP + '/tag_term', header)
			.then( res => {
				let tempTagFilteredTerms = this.state.tagFilteredTerms;

				res.data.map((term) => {
					if(tempTagFilteredTerms.indexOf(term.front) === -1){
						tempTagFilteredTerms.push(term.front)
					}
				});
				
				this.setState({
					tagFilteredTerms: tempTagFilteredTerms
				});
			})
			.catch(error => {console.log("updateTagFilteredTerms error: ", error.response)})
		}
	}

	updatePreviousTags = (currentTagList) => {
		this.setState({previousTags: currentTagList});
	}

	render () {
		let filterFunction = (term) => {
			let frontPrefix = term.front.trim().substr(0,this.state.search.length);

			if(frontPrefix.toLowerCase() === this.state.search.toLowerCase()) {

				if(this.state.tagFilteredTerms.indexOf(term.front) !== -1 || this.state.tagFilteredTerms.length === 0){
					return true;
				} else {
					return false;
				}

			} else {
				return false;
			}
		}

		let dynamicTerms = "";

		let currentTagList = this.state.tags;
		
		if (currentTagList.length !== this.state.previousTags.length){
			
			this.updatePreviousTags(currentTagList)
			this.updateTagFilteredTerms()
		}


		if (this.props.allAnswers !== []){
			dynamicTerms = this.props.allAnswers.filter(filterFunction);
		}


		let tempAddedTermsIDArray = this.state.addedTerms.map((term) => {return (term.id)});
		let validTerms = dynamicTerms.filter((answer) => {
			return(tempAddedTermsIDArray.indexOf(answer.id) === -1);
		})

		return (
			<div>
			
			<Form onSubmit={e => this.submitExistingTerms(e)}>
				<input type="hidden" value="prayer" />
				
				<Alert style={{color: '#004085', backgroundColor: 'lightskyblue', border: "none"}}>
				<Row>
					<Col>
						<FormGroup>			
							<Label for="search">
								Search:
							</Label>

							<Input type="text"
							name="search"
							onChange={e => this.change(e)}
							value={this.state.search}
							id="search"
							placeholder="Search" 
							autoComplete="off"/>
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
								renderButton={false}
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
						<h5 style={{color:"black", fontWeight: "300"}}>All Terms:</h5>
						<Card color="info" style={{overflow:"scroll", height:"35vh", width:"100%"}}>
							{validTerms.map((answer) => { 
								return (
									<Button 
										style={{backgroundColor:"#2b7e8a", border: "none", borderRadius: "0px"}} 
										key={answer.id}
										onClick={() => this.handleAddExistingTerm({front:answer.front, id:answer.id})}
									>
										{answer.front}
									</Button>
								)
							})}
						</Card>
					</Col>
					<Col>
						<h5 style={{color:"black", fontWeight: "300"}}>Added Terms:</h5>
						<Alert style={{backgroundColor:"#17A2B7", overflow:"scroll", height:"35vh", width:"100%", border: "none"}}>
							
								<AnswerButtonList
									answers={this.state.addedTerms.map((answer) => { 
											return(answer.front)}
									)}
									
									handleDeleteAnswer={this.handleDeleteAnswer}
									deletable={true}
								/>
							
						</Alert>
					</Col>
				</Row>

				<Row>
					<Col>
						<Button style={{backgroundColor: 'rgb(0, 64, 133)', border: "none"}} type="submit" block>
							Add
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

export default AddExistingTerm;