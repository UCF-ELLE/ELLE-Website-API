import React from 'react';
import { Button, Form, FormGroup, Label, Input, Row, Col, Alert} from 'reactstrap';
import Select from 'react-select';
import axios from 'axios';
import languageCodes from '../../languageCodes3.json';

class AddModule extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        name: "",
        language: "", 
        status : false, 
        success : false, 
        languageCodes: [], 
        class: ""
      }; 

      this.submitModule = this.submitModule.bind(this); 
      this.updateName = this.updateName.bind(this); 
      this.updateLanguage = this.updateLanguage.bind(this); 
}

  componentDidMount() {
    let tempCodeList = []; 

    for (var key in languageCodes) {
        tempCodeList.push({label: languageCodes[key], value:key});
    }

    this.setState({languageCodes: tempCodeList});
  }

  submitModule = (e) => {
    e.preventDefault();

    if (this.props.permissionLevel === 'su'){
      var data = {
        name: this.state.name,
        language: this.state.language.value,
        complexity: 2
      }
    } else {
      var data = {
        name: this.state.name,
        language: this.state.language.value, 
        complexity: 2, 
        groupID: this.props.currentClass.value === 0 ? this.state.class.value : this.props.currentClass.value
      }
    }
        
    let header = {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    }

    axios.post(this.props.serviceIP + '/module', data, header)
    .then(res => {
      this.setState({
        success: true
      }); 
      this.onShowStatus(); 
      this.props.updateModuleList("add", res.data.moduleID);  
    }).catch(error => {
      if (error.message !== undefined) {
        console.log("Add Module error", error.message); 
        this.onShowStatus();
      }
    });
  }

  updateName = (e) => {
    this.setState({name: e.target.value}); 
  } 

  updateLanguage = (value) => {
    this.setState({language: value}); 
  } 

  updateClass = (value) => {
    this.setState({class: value}); 
  } 

  onShowStatus = () => {
    this.setState({ status: true }, ()=>{
      window.setTimeout(()=>{
        this.setState({ 
          status: false, 
          name: "", 
          language: "", 
          class: "", 
          success: false, 
        })
      },2000)
    }); 
  }

  renderStatus = () => {
    if (this.state.status && this.state.success) {
        return  <Alert color="success" isOpen={this.state.status}>{this.state.name} has been added successfully! </Alert>
    }
    else if (this.state.status && !this.state.success) {
        return <Alert color="danger" isOpen={this.state.status}>Failure to add {this.state.name}</Alert>
    }
  } 

  render () {
    let classOptions = []; 

    classOptions = this.props.classOptions.filter((option) => option.value !== 0);
    return (
      <div>
        <Alert color="none" style={{color: '#004085', backgroundColor: 'aliceblue'}}>
        <Form onSubmit={this.submitModule}> 
          {this.renderStatus()}
          <Row>
          <Col>
            <FormGroup>
              <Label for="moduleName">Module Name:</Label>
              <Input type="text" placeholder="Module Name" 
                     value={this.state.name} onChange={this.updateName}/>
            </FormGroup>
          </Col>
          </Row>
          <Row>
          <Col>
            <FormGroup>
              <Label for="moduleLang">Language:</Label>
              <Select
                name="languageCode"
                options={this.state.languageCodes}
                className="basic-single"
                classNamePrefix="select"
                isClearable={true}
                value={this.state.language}
                onChange={this.updateLanguage}
              />
            </FormGroup>
          </Col>
          </Row>
          {this.props.currentClass.value === 0 && this.props.permissionLevel !== "su" ? 
            <Row>
            <Col>
              <FormGroup>
                <Label for="classContext">Class:</Label>
                <Select
                  name="class"
                  options={classOptions}
                  className="basic-single"
                  classNamePrefix="select"
                  isClearable={true}
                  value={this.state.class}
                  onChange={this.updateClass}
                />
              </FormGroup>
            </Col>
            </Row>
          : null}
          <Row>
          <Col>
            <Button style={{backgroundColor: '#004085', border: "none"}} type="submit" block>
              Create
            </Button>
          </Col>
          </Row>
          </Form>
          </Alert> 
      </div>
    )
  }
}

export default AddModule