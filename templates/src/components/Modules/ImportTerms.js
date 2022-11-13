import React, { Component } from 'react'
import { Button } from 'react-bootstrap'
import { Card, Label, Modal, ModalHeader, ModalBody, ModalFooter, Table, Row, Col, Badge, Alert, Tooltip } from 'reactstrap'
import Form from 'react-bootstrap/Form'
import { CSVReader } from 'react-papaparse'
import axios from 'axios';

import ImportTemplate from '../../Template.csv'
import TermFields from '../MassImport/TermFields'

const buttonRef = React.createRef()
 
export default class ImportTerms extends Component {
  constructor() {
    super()
    this.state={
      error: false, 
      modalOpen: false,
      tooltipOpen: false,
      terms: []
    }
  }

  handleOpenDialog = (e) => {
    // Note that the ref is set async, so it might be null at some point 
    if (buttonRef.current) {
      buttonRef.current.open(e)
    }
  }
  
  handleOnFileLoad = (data) => {
    if (data.length < 2){
      console.log("Provided CSV doesn't contain header")
    }
    
    for(var i = 0; i < data[0]["data"].length; i++){
      data[0]["data"][i] = data[0]["data"][i].toLocaleLowerCase()
    }
    var frontIndex = data[0]["data"].indexOf("front")
    var backIndex = data[0]["data"].indexOf("back")
    var typeIndex = data[0]["data"].indexOf("type")
    var genderIndex = data[0]["data"].indexOf("gender")

    var listTerms = [];
    for (var i=1; i < data.length; i++) {
      var formData = {};
      formData['front'] = data[i]['data'][frontIndex] === "" ? null : data[i]['data'][frontIndex]
      formData['back'] = data[i]['data'][backIndex] === "" ? null : data[i]['data'][backIndex]
      formData['type'] = data[i]['data'][typeIndex] === "" ? "" : data[i]['data'][typeIndex]
      formData['gender'] = data[i]['data'][genderIndex] === "" ? null : data[i]['data'][genderIndex]
      formData['selected'] = true

      if (formData['front'] !== null && formData['back'] !== null)
        listTerms.push(formData);
    }

    this.setState({
      terms: listTerms
    });
  }

  uploadTerms = () => {
    let listTerms = this.state.terms.filter((term) => term.selected === true); 
    let failure = false; 

    for(var item in listTerms) {
      if (listTerms[item]['front'].length !== 0 && listTerms[item]['back'].length !== 0) {
        var data = new FormData();
        data.append('front', listTerms[item]['front'])
        data.append('back', listTerms[item]['back'])
        data.append('language', this.props.module.language)
        data.append('type', listTerms[item]['type'])
        data.append('gender', listTerms[item]['gender'])
        data.append('moduleID', this.props.module.moduleID)

        //TODO: need to append groupID if the user is a ta 
        if (this.props.permissionLevel === "ta") {
          data.append('groupID', this.props.currentClass.value);  
        }

        var config = {
          method: 'post',
          url: this.props.serviceIP + '/term',
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('jwt')
          },
          data : data
        };

        axios(config)
        .then(res => {
          this.props.updateCurrentModule({ module: this.props.module });
        }).catch(error => {
          console.log(error);
          if (error.response) {
            this.setState({
              error: true 
            })
            failure = true; 
          }
        });
      }
    }

    if (!failure) {
      this.toggleModal(); 
    }
  }
 
  handleOnError = (err, file, inputElem, reason) => {
    console.log(err, file, inputElem, reason); 
  }

  toggleModal = () => {
    this.setState({ 
      modalOpen: !this.state.modalOpen,
      terms: []
    })
  }

  handleOnCheck = (ind) => {
    let tempList = this.state.terms;
    let tempTerm = this.state.terms[ind];

    tempList[ind] = {
      'front': tempTerm.front, 
      'back': tempTerm.back,
      'type': tempTerm.type,
      'gender': tempTerm.gender,
      'selected': !tempTerm.selected
    }

    this.setState({ terms: tempList });
  }

  handleOnSelectAll = (e) => {
    let tempList = [];

    tempList = this.state.terms.map(
      (term) => {
        return (
          {      
            'front': term.front, 
            'back': term.back,
            'type': term.type,
            'gender': term.gender,
            'selected': e.target.checked
          }
        )
      }
    )

    this.setState({ terms: tempList }); 
  }

  handleOnFieldChange = (ind, term) => {
    let tempList = this.state.terms;

    tempList[ind] = {
      'front': term.front, 
      'back': term.back,
      'type': term.type,
      'gender': term.gender,
      'selected': this.state.terms[ind].selected
    }

    this.setState({ terms: tempList });
  }

  toggleTooltip = () => {
    this.setState({ tooltipOpen: !this.state.tooltipOpen });
  }

  render() {
    return (
      <>
      <Modal isOpen={this.state.modalOpen} toggle={() => this.toggleModal()}>
        <ModalHeader style={{paddingBottom: "0px", border: "none"}} toggle={() => this.toggleModal()}>
          Mass Import Terms
          <Row>
            <Col>
              <Badge>Module Name: {this.props.module.name}</Badge>
            </Col>
            <Col>
              <Badge> Module Language: {this.props.module.language}</Badge>
            </Col>
          </Row>
        </ModalHeader>
        <ModalBody>
          <CSVReader
            ref={buttonRef}
            onFileLoad={this.handleOnFileLoad}
            onError={this.handleOnError}
            noClick
            noDrag
          >
            {({ file }) => (
              <div style={{marginBottom: "10px"}}>
                <Button id="fileUploader" style={{padding: "5px", border: "none", backgroundColor: "cadetblue"}} onClick={this.handleOpenDialog}>            
                  <img 
                    src={require('../../Images/uploadCSV.png')} 
                    alt="Icon made by Smashicons from www.flaticon.com" 
                    style={{width: '25px', height: '25px', marginRight: "5px"}}
                  />
                  Upload
                </Button>
                <Label style={{margin: "10px"}}>
                  {file && file.name}
                </Label>
              </div>
            )}
          </CSVReader>

          {this.state.error ? 
            <Alert color="danger">
              Failure to add terms.  
            </Alert>
          : null}

          <Card style={{marginTop: "15px", height: "40vh", overflow: "scroll"}}> 
            {this.state.terms.length !== 0 ?
            <Table hover className="minimalisticTable">
              <thead>
                <tr>
                  <th style={{zIndex: "1"}}>   
                    <Form.Group style={{margin: "0px"}}>
                      <Form.Check 
                        type="checkbox" 
                        checked={this.state.terms.find((term) => term.selected === false) ? false : true}
                        onChange={(e) => this.handleOnSelectAll(e)}
                      />
                    </Form.Group>
                  </th>
                  <th>Front</th>
                  <th>Back</th>
                  <th>Type</th>
                  <th>Gender</th>
                </tr>
              </thead>
              <tbody>
                {this.state.terms.map((term, i) => {
                  return (
                    <tr key={i}>
                      <td style={{paddingTop: "20px"}}>
                        <Form.Group style={{margin: "0px"}}>
                          <Form.Check type="checkbox" checked={term.selected} onChange={() => this.handleOnCheck(i)}/>
                        </Form.Group>
                      </td>
                      <TermFields term={term} index={i} handleOnFieldChange={this.handleOnFieldChange}/>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
            : <p style={{display: "flex", justifyContent: "center"}}>No terms could be found at the moment.</p>}
          </Card>
        </ModalBody>
        <ModalFooter style={{display: "inline"}}>
          <Row>
            <Col style={{padding: "5px 15px 0 0"}}>
              <p style={{margin: "0px 15px"}}>Need the template? Click {' '}
                <a
                  style={{textDecoration: "underline", color: "blue"}} 
                  href={ImportTemplate}
                  download="template.csv"
                >
                  here
                </a> 
              {' '} to download.</p>
            </Col>
            <Col xs="3" style={{paddingLeft: "30px"}}>
              <Button style={{padding: "5px", border: "none", backgroundColor: "cadetblue"}} onClick={() => this.uploadTerms()}>
                <img 
                  src={require('../../Images/import.png')} 
                  alt="Icon made by Smashicons from www.flaticon.com" 
                  style={{width: '25px', height: '25px', marginRight: "5px"}}
                />
                Import
              </Button>
            </Col>
          </Row>
        </ModalFooter>
      </Modal>

      <Button
        id="importBtn"
        onClick={() => this.toggleModal()}
        size="sm"
        style={{border: "none", backgroundColor: "#5faeb4"}}
      >
        <img 
          src={require('../../Images/import.png')} 
          alt="Icon made by Smashicons from www.flaticon.com" 
          style={{width: '25px', height: '25px'}}
        />
      </Button>

      <Tooltip placement="right" isOpen={this.state.tooltipOpen} target="importBtn" toggle={() => this.toggleTooltip()}>
        Mass Import
      </Tooltip>
    </>
    )
  }
}

