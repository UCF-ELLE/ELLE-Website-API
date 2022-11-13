import React from 'react'
import { Container, Row, Col, Input, InputGroup, InputGroupAddon, InputGroupText, Button,
    ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem,
    Collapse, Card, CardHeader, Alert } from 'reactstrap';

import Badge from 'react-bootstrap/Badge'

import CardList from './CardList'
import axios from 'axios';

import AddTerm from './AddTerm';
import AddExistingTerm from './AddExistingTerm';

import AddQuestion from './AddQuestion';   
import AddPhrase from './AddPhrase'; 
import ImportTerms from './ImportTerms';
import Manual from './Manual';


class Module extends React.Component {
  constructor(props) {
    super(props);
    this.toggleTab = this.toggleTab.bind(this); 

    this.state = {
      searchCard: "", //what gets typed in the search bar that filters the card lists
      collapseNewCard: false, //determines whether or not the new card form is open
      collapseNewPhrase: false,
      collapseNewQuestion: false,
      collapseExistingCard: false,

      addTermButtonOpen: false,

      collapseTab: -1, //determines whether or not a tab is collapsed, maybe should be a number
      tabs: [0,1,2],
      openForm: 0, //determines which input form is open. Is 0 if no form is open

      allTags: [], //contains all the tags in the database. for autocomplete purposes
      

      //state properties below this point are never used, and we should probably delete them
      id: this.props.curModule.moduleID,
      name: this.props.curModule.name,
      language: this.props.curModule.language
    };

  }

  componentDidMount() {
    this.getAllTags();
  }

  //TODO: consider moving this stub of a function into the components that use them
  //function for adding a tag to a list of tags
  addTag = (tagList, tag) => {
    let tempTagList = tagList;

    tempTagList.push(tag);

    return tempTagList;
  }


  //TODO: consider moving this into the components that actually have access to the tags in question
  //fumction for deleting a tag from a list of tags
  deleteTag = (tagList, tag) => {

    if(tagList === undefined){
      return;
    }

    let tempTagList = tagList;

    let tagIndex = tempTagList.indexOf(tag);

    if(tagIndex !== -1){
      tempTagList.splice(tagIndex, 1);
    }

    return tempTagList;
  }


  //function for changing the searchbar for cards
  updateSearchCard(e) {
    this.setState({ searchCard: e.target.value.substr(0,20) });
  }



  toggleTab(e) {
    let event = e.target.dataset.event; 

    //if the accordion clicked on is equal to the current accordion that's open then close the current accordion,
    //else open the accordion you just clicked on 
    this.setState({ collapseTab: this.state.collapseTab === Number(event) ? -1 : Number(event) }) 
  }

  //function that determines if the Add Term button is open
  toggleAddTermButton = () => {
    this.setState({
      addTermButtonOpen: !this.state.addTermButtonOpen
    })
  }


  //gets all the tags in the database
  getAllTags = () => {

    let allTagsInDB = [];

    let header = {
      headers: {'Authorization': 'Bearer ' + localStorage.getItem('jwt')}
    };

    axios.get(this.props.serviceIP + '/tags', header)
      .then(res => {

        allTagsInDB = res.data;

        this.setState({
          allTags: allTagsInDB.tags
        });

      })
      .catch(error => {
        console.log("error in getAllTags(): ", error);
      })
  }

  //function that determines which form is open
  setOpenForm = (openedForm) => {
    //if the form is open at the moment then close it by setting it back to form 0, which is the closed state
    if(this.state.openForm === openedForm){
      this.setState({ openForm: 0 })
    }
    else { //else set the state of the open form to the form # that you want to open
      this.setState({ openForm: openedForm })
    }

  }


  render () {

      //Variables that store the differnt types of cards in the module
      let terms = this.props.cards
        .filter(card => card.type.toLowerCase() === "match" && card.answers[0] !== undefined)
          .map((card, i) => {return card.answers[0]});

      let phrases = this.props.cards
        .filter(card => card.type.toLowerCase() === "phrase")
          .map((card, i) => {return card.answers[0]}); 
      
      let questions = this.props.cards
        .filter(card => card.type.toLowerCase() === "longform")
          .map((card, i) => {return card}); 

      //Gets all answers not in this module
      let termIDArray = terms.map(term => term.termID);

      let allAnswersNotInThisModule = this.props.allAnswers.filter(answer => {                                   
        if (termIDArray.indexOf(answer.id) === -1) {
          return true;
        } 
        else{
          return false;
        }
      });

      ////Variable that stores all of the terms that contain a substring that matches searchCard
      let filteredTerms = terms.filter(
          (term) => { 
            if (term) 
              return ((term.front.toLowerCase().indexOf(this.state.searchCard.toLowerCase()) !== -1) || 
              (term.back.toLowerCase().indexOf(this.state.searchCard.toLowerCase()) !== -1));
            else 
              return null; 
          }
      );


      //Variable that stores all of the phrases that contain a substring that matches searchCard
      let filteredPhrases = phrases.filter(
        (phrase) => { 
          if (phrase) 
            return ((phrase.front.toLowerCase().indexOf(this.state.searchCard.toLowerCase()) !== -1) || 
            (phrase.back.toLowerCase().indexOf(this.state.searchCard.toLowerCase()) !== -1));
          else 
            return null; 
        }
     );

      //Variable that stores all of the questions that contain a substring that matches searchCard
      let filteredQuestions = questions.filter(
        (question) => {
          if(question){
            return(question.questionText.toLowerCase().indexOf(this.state.searchCard.toLowerCase()) !== -1)
          } else
            return null;
        }
      );

      return (
        <Container className='Deck'>
          <Row className='Header' style={{marginBottom: '15px'}}>
            
            {/*Search Bar for all cards in a deck, with the buttons for adding new items as appendages*/}
            <InputGroup style={{borderRadius: '12px'}}>          
              <InputGroupAddon addonType="prepend">
                <InputGroupText id="module-name" style={{border: "none"}}>
                  {this.props.curModule.name}
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupAddon addonType="prepend" style={{margin: "10px"}}>
                <img 
                  src={require('../../Images/search.png')} 
                  alt="Icon made by Freepik from www.flaticon.com" 
                  style={{width: '15px', height: '15px'}}
                />
              </InputGroupAddon>
              <Input style={{border: "none"}}
                type="text" 
                placeholder="Search" 
                value={this.state.searchCard} 
                onChange={this.updateSearchCard.bind(this)}
              />
              
              {this.props.permissionLevel !== "st" 
              ?
              <>
                {/* The button for the Add Term forms */}
                <InputGroupAddon addonType="append">
                  <ButtonDropdown  
                    isOpen={this.state.addTermButtonOpen}
                    toggle={this.toggleAddTermButton}
                    >
                    <DropdownToggle style={{backgroundColor:'#3e6184', borderRadius: '0px'}} caret>
                      Add Term
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem onClick={() => this.setOpenForm(1)}> Add Existing</DropdownItem>
                      <DropdownItem onClick={() => this.setOpenForm(2)}> Add New</DropdownItem>
                    </DropdownMenu>
                  </ButtonDropdown>
                </InputGroupAddon>

                {/* The button for the Add Phrase form */}
                <InputGroupAddon addonType="append">
                  <Button style={{backgroundColor:'#3e6184'}} onClick={() => this.setOpenForm(3)}>
                    Add Phrase
                  </Button>
                </InputGroupAddon>

                {/* The button for the Add Question form */}
                <InputGroupAddon addonType="append">
                  <Button style={{backgroundColor:'#3e6184'}} onClick={() => this.setOpenForm(4)}>
                    Add Question
                  </Button>
                </InputGroupAddon>
            </>
            : null}
            </InputGroup>
          </Row>
          
          <Row style={{marginBottom: "8px"}}>
            <Col>
              <Badge pill variant="info">
                Module ID: {this.props.curModule.moduleID}
              </Badge>{' '}
              <Badge pill variant="info">
                Language: {this.props.curModule.language}
              </Badge>
            </Col>
            {this.props.permissionLevel !== "st" ?
              <Col style={{display: "flex", justifyContent: "flex-end"}}>
                <Manual />
                <ImportTerms 
                  serviceIP={this.props.serviceIP} 
                  permissionLevel={this.props.permissionLevel}
                  module={this.props.curModule} 
                  updateCurrentModule={this.props.updateCurrentModule}
                  currentClass={this.props.currentClass}
                />
              </Col>
            : null}
          </Row>

          <Row>
            <Col>
              {/*Form for adding a new Term*/}
              <Collapse isOpen={this.state.openForm === 2}>     
                <AddTerm
                  currentClass={this.props.currentClass}
                  curModule={this.props.curModule} 
                  updateCurrentModule={this.props.updateCurrentModule}
                  serviceIP={this.props.serviceIP}
                  permissionLevel={this.props.permissionLevel}
                  deleteTag={this.deleteTag}
                  addTag={this.addTag}
                  allTags={this.state.allTags}
                  setOpenForm={this.setOpenForm}
                  />        
              </Collapse>

              {/*Form for adding an existing Term*/}
              <Collapse isOpen={this.state.openForm === 1}>     
                <AddExistingTerm
                  currentClass={this.props.currentClass}
                  curModule={this.props.curModule} 
                  updateCurrentModule={this.props.updateCurrentModule}
                  serviceIP={this.props.serviceIP}
                  permissionLevel={this.props.permissionLevel}
                  deleteTag={this.deleteTag}
                  addTag={this.addTag}
                  allTags={this.state.allTags}
                  allAnswers={allAnswersNotInThisModule}
                  setOpenForm={this.setOpenForm}
                />        
              </Collapse>

            {/*Form for adding a new Phrase*/}
              <Collapse isOpen={this.state.openForm === 3}>
                <AddPhrase
                  currentClass={this.props.currentClass}
                  curModule={this.props.curModule} 
                  updateCurrentModule={this.props.updateCurrentModule}
                  serviceIP={this.props.serviceIP}
                  permissionLevel={this.props.permissionLevel}
                  setOpenForm={this.setOpenForm}
                />
              </Collapse>

            {/*Form for adding a new Question*/}
              <Collapse isOpen={this.state.openForm === 4}>
                <AddQuestion
                  currentClass={this.props.currentClass}
                  curModule={this.props.curModule} 
                  updateCurrentModule={this.props.updateCurrentModule}
                  permissionLevel={this.props.permissionLevel}
                  serviceIP={this.props.serviceIP}
                        
                  allAnswers={this.props.allAnswers}
                  allAnswersNotInThisModule={allAnswersNotInThisModule}
                  
                  deleteTag={this.deleteTag}
                  addTag={this.addTag}
                  allTags={this.state.allTags}
                  setOpenForm={this.setOpenForm}
                  getAllTags={this.getAllTags}
                  />
              </Collapse>
            </Col>
          </Row>

          <Row>
            <Alert color="info" style={{marginLeft: "15px"}} isOpen={this.props.modificationWarning} toggle={this.props.toggleModificationWarning}>
                Modifying anything in this module will affect all the users who are currently using this module as well. 
            </Alert>
          </Row>

          {this.state.tabs.map((index,i) => { 
            if (index === 0) {
              //Terms Accordion
              return (
                <Card  key={i} style={{ marginBottom: '1rem' }}>
                  <CardHeader onClick={this.toggleTab} data-event={index}>
                    Terms
                  </CardHeader>

                  <Collapse isOpen={this.state.collapseTab === index}>
                    <CardList 
                      type={0} 
                      currentClass={this.props.currentClass}
                      permissionLevel={this.props.permissionLevel}
                      cards = {filteredTerms} 
                      serviceIP={this.props.serviceIP} 
                      curModule={this.props.curModule} 
                      updateCurrentModule={this.props.updateCurrentModule}
                      deleteTag={this.deleteTag} 
                      addTag={this.addTag} 
                      allTags={this.state.allTags}/>
                  </Collapse>
                </Card>
              )
            }
            else if (index === 1) {
              //Phrases Accordion
              return (                
                <Card key={i} style={{ marginBottom: '1rem' }}>
                  <CardHeader onClick={this.toggleTab} data-event={index}>
                    Phrases
                  </CardHeader>

                  <Collapse isOpen={this.state.collapseTab === index}>
                    <CardList 
                      type={1} 
                      currentClass={this.props.currentClass}
                      permissionLevel={this.props.permissionLevel}
                      cards={filteredPhrases} 
                      serviceIP={this.props.serviceIP}
                      curModule={this.props.curModule} 
                      updateCurrentModule={this.props.updateCurrentModule}/>
                  </Collapse>
                </Card>
              )
            }
            else {
              //Questions Accordion
              return (
                <Card key={i} style={{ marginBottom: '1rem' }}>
                  <CardHeader onClick={this.toggleTab} data-event={index}>
                    Questions
                  </CardHeader>
                  
                  <Collapse isOpen={this.state.collapseTab === index}>
                    <CardList 
                        type={2} 
                        currentClass={this.props.currentClass}
                        permissionLevel={this.props.permissionLevel}
                        cards={filteredQuestions} 
                        serviceIP={this.props.serviceIP}
                        curModule={this.props.curModule} 
                        updateCurrentModule={this.props.updateCurrentModule}
                        allAnswers={this.props.allAnswers}
                        deleteTag={this.deleteTag} 
                        addTag={this.addTag} 
                        allTags={this.state.allTags}
                    />
                  </Collapse>
                </Card>
              )
            }
          })
          }

          <Row>
            <br/>
          </Row>
        </Container>
      );
    };
  }

export default Module
