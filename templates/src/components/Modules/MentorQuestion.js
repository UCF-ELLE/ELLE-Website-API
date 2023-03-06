import React, {Fragment} from 'react';
import { Alert, Button, ButtonGroup, Modal, ModalHeader, ModalBody, ModalFooter, Collapse, Input, Form, FormGroup } from 'reactstrap';
import axios from 'axios';

import AnswerButtonList from './AnswerButtonList';
import Autocomplete from './Autocomplete';
import AddAnswer from './AddAnswer'; 

class MentorQuestion extends React.Component {
  constructor(props){
    super(props);
    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.handleDelete = this.handleDelete.bind(this); 
    this.deleteQuestion = this.deleteQuestion.bind(this);
    this.toggleCollapsedAnswers = this.toggleCollapsedAnswers.bind(this);

    this.submitEdit = this.submitEdit.bind(this);
    this.change = this.change.bind(this);


    this.state = {
      question: this.props.question, //contains all of the data in the question
      modal: false,

      myAnswers : ["NA","NA2"],
      editMode: false, //determines whether or not the editable version of the question is showing
      editedQuestionText: this.props.question.questionText, //contains the English word that can be edited
      collapseAnswers: false, //determines whether or not the answers are displayed on the question

      //TODO: populate answers with API call instead of dummy data
      /*answers: this.props.question.answers.map((answer) => {return answer.front}), //contains the list of answers
      originalAnswers: this.props.question.answers.map((answer) => {return answer.front}),
      ids: this.props.question.answers.map((answer) => {return answer.termID}),

      newlyCreatedAnswers : [], //array of answers the user created via this form
      submittingAnswer: false, //determines whether or not the AddAnswer form will be shown
      userCreatedAnswer: "", //what the user put in the field when they clicked create answer*/
    }

  }


  //TODO: handleAddAnswer and createAnswer kinda do the same thing. Maybe they should be one thing?
  //function that adds a answer to list of answers on this question(only available when editmode is true)
  /*handleAddAnswer = (event) => {
    let ansList = this.state.answers; 
    let idList = this.state.ids; 

    ansList.push(event.answer); 
    idList.push(event.answerID); 

    this.setState({
      answers: ansList, 
      ids: idList
    })
  }*/


  //function that adds a new answer from user input to list of answers on this question(only when editmode is true)
  /*createAnswer = (answer) => {
    this.setState({
			submittingAnswer: true,
			userCreatedAnswer: answer
		});
  }*/

	//function that adds a newly created answer to the list of answers on this question
  /*addNewAnswerToList = (answer) => {
		let tempNewlyCreatedAnswers = this.state.newlyCreatedAnswers;
    tempNewlyCreatedAnswers.push(answer);
    
    let allAnswers = this.state.answers; 
    allAnswers.push(answer.front); 

		this.setState({
      newlyCreatedAnswers: tempNewlyCreatedAnswers,
      answers: allAnswers, 
			submittingAnswer: false
		});
	}*/

  	//function that allows user to cancel AddAnswer form
	cancelCreateAnswer = () => {
		this.setState({
			submittingAnswer: false
		});
	}

  /*handleDeleteAnswer = (event) => {
    let tempAnswerButtonList = this.state.answers;
    let idList = this.state.ids; 
    
    let answerObject = this.state.answers.find((answer) => {
      if(answer === event.answer){
        return true;
      } 
      else {
        return false;
      }
    });

    let answerIndex = tempAnswerButtonList.indexOf(answerObject);

    if(answerIndex !== -1){
      tempAnswerButtonList.splice(answerIndex, 1);
      idList.splice(answerIndex, 1); 
    }

    this.setState({
      answers: tempAnswerButtonList,
      ids: idList
    });

  }*/

  //function that gets called when the edit button is pushed. Sets editmode to true
  toggleEditMode = () => {
    this.setState({
      editMode: true,
      collapseAnswers: true
    });
  }

  //function that changes the state of front, back, type, and gender based off of the name given to the input objects
  change(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  updateAnswers() {
    var data = {
      question_id: this.props.question.questionID
    }

    var header = {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    }

    axios.post(this.props.serviceIP + '/getmultiplechoiceoptions', data, header)
    .then( res => {
      let answers = res.data;

      this.setState({
        myAnswers: answers
      });
    })
    .catch(function (error) {
      console.log("getMCoptions error: ", error);
    });
  }

  submitQuestionEdit() {
    this.setState({editMode: false});

    let data = {
      question_id : this.state.question.questionID,
      question_text : this.state.editedQuestionText
    };

    let header = {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    };

    axios.post(this.props.serviceIP + '/modifymentorquestions', data, header)
    .then(res => {
      this.props.updateCurrentModule({ module: this.props.curModule });
    })
    .catch(error => {
      console.log("submitQuestionEdit error: ", error.response);
    })
  }


  submitEdit = (e) => {
    e.preventDefault();
    this.setState({editMode: false});

    //iterate through answers and make appropriate changes, may not happen in order
    for (let i = 0; i < e.target.length - 1; i++) {

      let header = {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
      };

      if (e.target[i].value == "") { //delete option
        let data = {
          mc_id : e.target[i].id
        };

        axios.delete(this.props.serviceIP + '/deletemultiplechoiceoptions', data, header)
        .then(res => {
          this.props.updateCurrentModule({ module: this.props.curModule });
        })
        .catch(error => {
          console.log("deleteMCPtion error: ", error.response);
        })

      } else { //modify option
        let data = {
          updated_option : e.target[i].value,
          mc_id : e.target[i].id
        };

        axios.post(this.props.serviceIP + '/modifymultiplechoiceoptions', data, header)
        .then(res => {
          this.props.updateCurrentModule({ module: this.props.curModule });
        })
        .catch(error => {
          console.log("editMCoption error: ", error.response);
        })


      }

    }

    this.updateAnswers();

		/*

		axios.post(this.props.serviceIP + '/creatementorquestions', data, header)
		.then(res => {
			this.resetFields();
			this.props.updateCurrentModule({ module: this.props.curModule });
		})
		.catch(error => {
			console.log("submitQuestion error: ", error.response);
		})*/
    
    /*
    this.setState({editMode: false});

    let NewlyCreatedAnswerJSONList = this.state.newlyCreatedAnswers.map((answer) => {
      return {
        "front": answer.front,
        "back": answer.back,
        "language": this.props.curModule.language,
        "tags": answer.tags
      }
    });

    let stringyAnswerList = JSON.stringify(NewlyCreatedAnswerJSONList.map((entry) => {return entry})); 

    let stringifyIDList = JSON.stringify(this.state.ids.map((entry) => {return entry})); 

    const data = new FormData(); 
    let header = {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    };

    data.append('image', this.state.changedImage && this.state.selectedImgFile !== undefined ? this.state.selectedImgFile : null); 
    data.append('audio', this.state.changedAudio && this.state.selectedAudioFile !== undefined ? this.state.selectedAudioFile : null); 

    data.append('questionText', this.state.editedQuestionText); 
    data.append('questionID', this.props.question.questionID); //not editable
    data.append('new_answers', stringifyIDList); 
    data.append('arr_of_terms', stringyAnswerList); 
    data.append('type', "LONGFORM");

    this.props.permissionLevel === "ta" ? data.append('groupID', this.props.currentClass.value) : data.append('groupID', null);
    
    axios.post(this.props.serviceIP + '/modifyquestion', data, header)
    .then(res => {
      this.setState({
        changedImage: false, 
        changedAudio: false
      });

      this.props.updateCurrentModule({ module: this.props.curModule });  
    })
    .catch(error => {
      console.log("submitEdit in question.js error: ", error);
    });*/
  }

  //toggling delete modal, is not related to delete question API 
  handleDelete = () => {
    this.toggleModal(); 
  }

  //function for deleting a question from the database
  deleteQuestion = (e) => {
    this.toggleModal(); 
    
    let header = { 
      data: { 
        question_id: this.state.question.questionID,
      },
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    };
    

    axios.delete(this.props.serviceIP + '/deletementorquestions', header)
    .then( res => {
      this.props.updateCurrentModule({ module: this.props.curModule });  
    })
    .catch(error => {
      console.log("deleteQuestion in MentorQuestion.js error: ", error.message);
    });
  }

  //function that toggles whether or not answers a visible
  toggleCollapsedAnswers = () => {
    this.setState({ collapseAnswers: !this.state.collapseAnswers });
  }

  toggleModal = () => {
    this.setState({ modal: !this.state.modal });
  }

  //function that cancels the edit and sets everything back to what it was initially
  handleCancelEdit = () => {
    this.setState({
      question: this.props.question,
      modal: false,
      collapseAnswers: false,

      editMode: false
    });
  }

  componentDidMount() {
    if (this.props.question.type === "MENTOR_MC"){
      var data = {
        question_id: this.props.question.questionID
      }
  
      var header = {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
      }

      /*axios.post(this.props.serviceIP + '/getmultiplechoiceoptions', data, header)
      .then( res => {
        let answers = res.data;

        this.setState({
          myAnswers: answers
        });
      })
      .catch(function (error) {
        console.log("getMCoptions error: ", error);
      });*/
      this.updateAnswers();
    } else {
      this.setState({
        myAnswers: "NA"
      });
    }
  }

  render() {
    let {question} = this.props;

    if (this.state.editMode === false){
      return (
        <Fragment>
        <tr onClick={this.toggleCollapsedAnswers}>
          <td>{question.questionText}</td>

          {this.props.permissionLevel !== "st"
          ?
            <td>
              <ButtonGroup>
                <Button style={{backgroundColor: 'lightcyan'}} onClick={() => this.toggleEditMode()}>
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
                Deleting this custom question will remove it from all the users who are currently using this module as well.
              </Alert>
              <p style={{paddingLeft: "20px"}}>Are you sure you want to delete this question?</p>
            </ModalBody>

            <ModalFooter>
              <Button onClick={this.toggleModal}>Cancel</Button>
              <Button color="danger" onClick={this.deleteQuestion.bind()}>Delete</Button>
            </ModalFooter>
          </Modal>
        </tr>

        <tr>
          <td style={{border:"none"}} colSpan="8">
            <Collapse isOpen={this.state.collapseAnswers}>
            <b>Answers: </b>
            <br/><br/>
            {question.type === "MENTOR_MC" 
            ?
            <div>
            {this.state.myAnswers.map((answer) => {
              return(
                <p key={answer.multipleChoiceID} id={answer.multipleChoiceID}> - {answer.answerChoice}</p>
              )
            })}
            </div>
          :
          <p>Free response, no answers</p>}
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
            name="editedQuestionText"
            id="editedQuestionText"
            onChange={e => this.change(e)} 
            value={this.state.editedQuestionText} 
            />
          </td>

          <td>
            <ButtonGroup>
              <Button 
                style={{backgroundColor: 'lightcyan'}} 
                onClick = {() => this.submitQuestionEdit()}
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
        {question.type === "MENTOR_MC" 
            ?
        <tr>
          <td style={{border:"none"}} colSpan="8">
          
            <div>
              <b>Answers: </b>
              <br/><br/>
              <Form onSubmit={e => this.submitEdit(e)}>
                <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                  {this.state.myAnswers.map((answer) => {
                    return(
                      <div>
                      <Input type="text" key={answer.multipleChoiceID} id={answer.multipleChoiceID} defaultValue={answer.answerChoice} />
                      <br></br>
                      </div>
                    )
                  })}
                </FormGroup>
                <br/>
                <Button>Submit</Button>
              </Form>
              
            </div>
          </td>

        </tr>
        :
        <p></p>}
      </Fragment>
      );
      
    }
    
  }
}

export default MentorQuestion
