import React, {Fragment} from 'react';
import { Alert, Button, ButtonGroup, Modal, ModalHeader, ModalBody, ModalFooter, Collapse, Input, Form, FormGroup } from 'reactstrap';
import axios from 'axios';

class MentorQuestion extends React.Component {
  constructor(props){
    super(props);
    this.toggleEditMode = this.toggleEditMode.bind(this);
    this.handleDelete = this.handleDelete.bind(this); 
    this.deleteQuestion = this.deleteQuestion.bind(this);
    this.toggleCollapsedAnswers = this.toggleCollapsedAnswers.bind(this);

    //this.submitEdit = this.submitEdit.bind(this);
    this.change = this.change.bind(this);


    this.state = {
      question: this.props.question, //contains all of the data in the question
      modal: false,

      myAnswers : ["", "", "", "", ""],
      editMode: false, //determines whether or not the editable version of the question is showing
      editedQuestionText: this.props.question.questionText, //contains the English word that can be edited
      newAnswer1: "",
      newAnswer2: "",
      newAnswer3: "",
      collapseAnswers: false, //determines whether or not the answers are displayed on the question
    }

  }

  	//function that allows user to cancel AddAnswer form
	cancelCreateAnswer = () => {
		this.setState({
			submittingAnswer: false
		});
	}

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

    let header = {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    };

    for (let i = 0; i < this.state.myAnswers.length; i++) {
      if (this.state.myAnswers[i].answerChoice == "") { //delete option
        let header = { 
          data: { 
            mc_id : this.state.myAnswers[i].multipleChoiceID
          },
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        };

        axios.delete(this.props.serviceIP + '/deletemultiplechoiceoptions', header)
        .then(res => {
            this.updateAnswers();
        })
        .catch(error => {
          console.log("deleteMCPtion error: ", error.response);
        })

      } else { //modify option
        let data = {
          updated_option : this.state.myAnswers[i].answerChoice,
          mc_id : this.state.myAnswers[i].multipleChoiceID
        };

        axios.post(this.props.serviceIP + '/modifymultiplechoiceoptions', data, header)
        .then(res => {
          if(i == this.state.myAnswers.length - 1) {
            this.updateAnswers();
          }
        })
        .catch(error => {
          console.log("editMCoption error: ", error.response);
        })


      }
    }

    if (this.state.newAnswer1 != "") {
      let data = {
        option : this.state.newAnswer1,
        question_id : this.state.question.questionID
      };

      axios.post(this.props.serviceIP + '/createmultiplechoiceoptions', data, header)
      .then(res => {
          this.updateAnswers();
          this.setState({
            newAnswer1: ""
          });
      })
      .catch(error => {
        console.log("createMCoption error: ", error.response);
      })
    }
    if (this.state.newAnswer2 != "") {
      let data = {
        option : this.state.newAnswer2,
        question_id : this.state.question.questionID
      };

      axios.post(this.props.serviceIP + '/createmultiplechoiceoptions', data, header)
      .then(res => {
          this.updateAnswers();
          this.setState({
            newAnswer2: ""
          });
      })
      .catch(error => {
        console.log("createMCoption error: ", error.response);
      })
    }
    if (this.state.newAnswer3 != "") {
      let data = {
        option : this.state.newAnswer3,
        question_id : this.state.question.questionID
      };

      axios.post(this.props.serviceIP + '/createmultiplechoiceoptions', data, header)
      .then(res => {
          this.updateAnswers();
          this.setState({
            newAnswer3: ""
          });
      })
      .catch(error => {
        console.log("createMCoption error: ", error.response);
      })
    }

    let data = {
      question_id : this.state.question.questionID,
      question_text : this.state.editedQuestionText
    };

    axios.post(this.props.serviceIP + '/modifymentorquestions', data, header)
    .then(res => {
      this.props.updateCurrentModule({ module: this.props.curModule });
    })
    .catch(error => {
      console.log("submitQuestionEdit error: ", error.response);
    })
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
      editedQuestionText : this.props.question.questionText,
      modal: false,
      collapseAnswers: false,

      editMode: false
    });
    this.updateAnswers();
  }

  changeAnswer(e) {
    let newAnswers = [...this.state.myAnswers];
    newAnswers[e.target.id].answerChoice = e.target.value;

    this.setState({
      myAnswers: newAnswers
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

      this.updateAnswers();
    } else {
      this.setState({
        myAnswers: ""
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
                Deleting this question will remove it from all the users who are currently using this module as well.
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
            {this.state.myAnswers.map((answer, index) => {
              return(
                <p key={answer.multipleChoiceID + " " + index} id={answer.multipleChoiceID}> - {answer.answerChoice}</p>
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
          {this.state.editedQuestionText.trim() === "" || this.state.editedQuestionText.length > 200
          ?
          <Input invalid
            type="value" 
            name="editedQuestionText"
            id="editedQuestionText"
            placeholder = "Required"
            onChange={e => this.change(e)} 
            value={this.state.editedQuestionText} 
            />
          :
          <Input 
            type="value" 
            name="editedQuestionText"
            id="editedQuestionText"
            onChange={e => this.change(e)} 
            value={this.state.editedQuestionText} 
            />
          }
          </td>

          <td>
            <ButtonGroup>
              {this.state.editedQuestionText.trim() === "" || this.state.editedQuestionText.length > 200 // question invalid
              || (question.type === "MENTOR_MC" // question is MC
              && ( //whatever is wrong the with MC options
                (this.state.myAnswers[0].answerChoice.trim() == "" || this.state.myAnswers[1].answerChoice.trim() == "" || this.state.myAnswers[0].answerChoice.length > 30 || this.state.myAnswers[1].answerChoice.length > 30) //check for these no matter # of MC options, there will always be 2
                || (this.state.myAnswers.length > 2 && ((this.state.myAnswers[2].answerChoice.trim() == "" && this.state.myAnswers[2].answerChoice != "") || this.state.myAnswers[2].answerChoice.length > 30)) //at least a third answer
                || (this.state.myAnswers.length > 3 && ((this.state.myAnswers[3].answerChoice.trim() == "" && this.state.myAnswers[3].answerChoice != "") || this.state.myAnswers[3].answerChoice.length > 30)) //at least a fourth answer
                || (this.state.myAnswers.length > 4 && ((this.state.myAnswers[4].answerChoice.trim() == "" && this.state.myAnswers[4].answerChoice != "") || this.state.myAnswers[4].answerChoice.length > 30)) //at least a fifth answer. Note if there are 5 answers, the third and fourth answers will also be checked since 5 > 2 and 5 > 3
                || (((this.state.newAnswer1.trim() == "" && this.state.newAnswer1 != "") || this.state.newAnswer1.length > 30) || ((this.state.newAnswer2.trim() == "" && this.state.newAnswer2 != "") || this.state.newAnswer2.length > 30) || ((this.state.newAnswer3.trim() == "" && this.state.newAnswer3 != "") || this.state.newAnswer3.length > 30)) //can check newAnswers no matter what as they are always nonnull and empty is not a fail case
                 ) 
                )
              ?
              <Button 
                style={{backgroundColor: 'lightcoral'}} 
                disabled
                > 
                <img 
                  src={require('../../Images/submit.png')} 
                  alt="Icon made by Becris from www.flaticon.com" 
                  style={{width: '25px', height: '25px'}}
                />
              </Button>
              :
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
              }
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
              <Form>
                <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                  {this.state.myAnswers.map((answer, index) => {
                    if (index == 2 || index == 3 || index == 4) {
                      if ((answer.answerChoice.trim() == "" && answer.answerChoice != "") || answer.answerChoice.length > 30) {
                        return(
                          <div key={index}>
                          <Input invalid 
                            type="value" 
                            id={index} 
                            name = {"answer" + index}
                            value={answer.answerChoice} 
                            onChange={e => this.changeAnswer(e)} 
                            placeholder="Optional" />
                          <br></br>
                          </div>
                        )
                      } else {
                        return(
                          <div key={index}>
                          <Input type="value" 
                            id={index} 
                            name = {"answer" + index}
                            value={answer.answerChoice} 
                            onChange={e => this.changeAnswer(e)} 
                            placeholder="Optional" />
                          <br></br>
                          </div>
                        )
                      }
                      
                    } else {
                      if (answer.answerChoice.trim() == "" || answer.answerChoice.length > 30) {
                        return(
                          <div key={index}>
                          <Input invalid
                            type="value" 
                            id={index} 
                            name = {"answer" + index}
                            value={answer.answerChoice} 
                            onChange={e => this.changeAnswer(e)} 
                            placeholder="Required" />
                          <br></br>
                          </div>
                        )
                      } else {
                        return(
                          <div key={index}>
                          <Input type="value"
                            id={index} 
                            name = {"answer" + index}
                            value={answer.answerChoice} 
                            onChange={e => this.changeAnswer(e)} />
                          <br></br>
                          </div>
                        )
                      }
                    }
                    
                  })}
                  {
                  this.state.myAnswers.length <= 2
                  ?
                    (this.state.newAnswer1.trim() == "" && this.state.newAnswer1 != "") || this.state.newAnswer1.length > 30
                    ?
                    <div>
                    <Input invalid
                            type="value" 
                            id={2} 
                            name = {"newAnswer1"}
                            value={this.state.newAnswer1} 
                            onChange={e => this.change(e)}
                            placeholder="Optional" />
                          <br></br>
                    </div>
                    :
                    <div>
                    <Input type="value" 
                            id={2} 
                            name = {"newAnswer1"}
                            value={this.state.newAnswer1} 
                            onChange={e => this.change(e)}
                            placeholder="Optional" />
                          <br></br>
                    </div>
                  :
                  <div></div>
                  }
                  {
                  this.state.myAnswers.length <= 3
                  ?
                    (this.state.newAnswer2.trim() == "" && this.state.newAnswer2 != "") || this.state.newAnswer2.length > 30
                    ?
                    <div>
                    <Input invalid
                            type="value" 
                            id={3} 
                            name = {"newAnswer2"}
                            value={this.state.newAnswer2} 
                            onChange={e => this.change(e)}
                            placeholder="Optional" />
                          <br></br>
                    </div>
                    :
                    <div>
                    <Input type="value" 
                            id={3} 
                            name = {"newAnswer2"}
                            value={this.state.newAnswer2} 
                            onChange={e => this.change(e)}
                            placeholder="Optional" />
                          <br></br>
                    </div>
                  :
                  <div></div>
                  }
                  {
                  this.state.myAnswers.length <= 4 
                  ?
                    (this.state.newAnswer3.trim() == "" && this.state.newAnswer3 != "") || this.state.newAnswer3.length > 30
                    ?
                    <div>
                    <Input invalid
                            type="value" 
                            id={4} 
                            name = {"newAnswer3"}
                            value={this.state.newAnswer3} 
                            onChange={e => this.change(e)}
                            placeholder="Optional" />
                          <br></br>
                    </div>
                    :
                    <div>
                    <Input type="value" 
                            id={4} 
                            name = {"newAnswer3"}
                            value={this.state.newAnswer3} 
                            onChange={e => this.change(e)}
                            placeholder="Optional" />
                          <br></br>
                    </div>
                  :
                  <div></div>
                  }
                  
                </FormGroup>
                <br/>
              </Form>
              
            </div>
          </td>

        </tr>
        :
        <tr></tr>}
      </Fragment>
      );
      
    }
    
  }
}

export default MentorQuestion
