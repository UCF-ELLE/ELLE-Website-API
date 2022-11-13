import React from 'react';
import { Input, Label, Row, Col, Table, Card, InputGroup, InputGroupAddon } from 'reactstrap';
import Select from 'react-select';
import axios from 'axios';

import ExistingModule from './ExistingModule';
import languageCodes from '../../languageCodes3.json';

class AddExistingModule extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            allModulesInDB: [],
            reusuableModules: [],
            class: "",
            searchName: "", 
            searchCreator: "", 
            languageCodes: [],
            selectedLanguage: ""
        }; 
    }

    componentDidMount() {
        this.getAllModulesInDB(); 
        let tempCodeList = []; 

        for (var key in languageCodes) {
            tempCodeList.push({label: key, value:key});
        }

        this.setState({languageCodes: tempCodeList});
    }

    getAllModulesInDB = () => {
        let config = {
            params: {groupID: this.props.currentClass.value}, 
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        }

        axios.get(this.props.serviceIP + '/retrievemodules', config)
        .then(res => {
            this.setState({ 
                allModulesInDB: res.data,
            });

            if (this.props.currentClass.value !== 0) {
                this.updateClass(this.props.currentClass); 
            }

        }).catch(error => {
            console.log("getAllModulesInDB error: ", error.message);
        })
    }

    updateClass = (value) => {
        if (value !== null) {
            let config = {
                params: {groupID: value.value}, 
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
            }

            axios.get(this.props.serviceIP + '/retrievegroupmodules', config)
            .then(res => {
                let modules = []; 

                let idList = res.data.map((module) => module.moduleID);
            
                this.state.allModulesInDB.map((module) => {
                    if (idList.indexOf(module.moduleID) === -1) {
                        modules.push(module);
                    }
                })
            
                this.setState({
                    class: value,
                    reusuableModules: modules
                }); 
            
            })
            .catch(function (error) {
                console.log("updateClass in addExistingModule.js error: ", error.message);
            });
        }
        else {
            this.setState({
                class: value,
                reusuableModules: []
            }); 
        }
    } 

    updateSearchName(e) {
        this.setState({ searchName: e.target.value.substr(0,20) });
    }

    updateSearchCreator(e) {
        this.setState({ searchCreator: e.target.value.substr(0,20) });
    }

    updateSelectedLanguage = (value) => {
        this.setState({ selectedLanguage: value }); 
    }

    render () {
        let classOptions = []; 

        classOptions = this.props.classOptions.filter((option) => option.value !== 0);

        let language = "";
        if (this.state.selectedLanguage !== null && this.state.selectedLanguage.value !== undefined) {
            language = this.state.selectedLanguage.value; 
        }

        let filteredModules = this.state.reusuableModules.filter(
            (module) => {  
                return (
                    (module.name.toLowerCase().indexOf(this.state.searchName.toLowerCase()) !== -1) &&
                    (module.language.toLowerCase().indexOf(language) !== -1) && 
                    (module.username.toLowerCase().indexOf(this.state.searchCreator.toLowerCase()) !== -1)
                );
            }
        );

        return (
        <div>
            <Row>
                <Col style={{display: "flex", justifyContent: "flex-end", padding: "5px 15px 10px 15px"}}>
                    <Label for="classContext" style={{margin: "12px 8px 0 0", fontSize: "large"}}>Class:</Label>
                    {this.props.currentClass.value === 0 
                    ?       
                    <Select
                        name="class"
                        options={classOptions}
                        className="basic-single"
                        classNamePrefix="select"
                        isClearable={true}
                        value={this.state.class}
                        onChange={this.updateClass}
                        styles={{ 
                            control: provided => ({...provided, marginTop: '7px'}),
                            valueContainer: provided => ({...provided, width: '400px'})
                        }}
                    />
                    :
                    <Label style={{margin: "12px 8px 0 0", fontSize: "large", display: "flex", justifyContent: "flex-end"}}>
                        {this.props.currentClass.label}
                    </Label>}
                </Col>
            </Row>

            <Row style={{marginBottom: "10px"}}>
                <Col>
                    <InputGroup>
                        <InputGroupAddon addonType="prepend" style={{margin: "5px"}}>
                            <img 
                                src={require('../../Images/module.png')} 
                                alt="Icon made by Freepik from www.flaticon.com" 
                                style={{width: '25px', height: '25px'}}
                            />
                        </InputGroupAddon>
                        <Input 
                            style={{borderStyle: "hidden", padding: "6px"}}
                            type="text" 
                            placeholder="Search Name" 
                            value={this.state.searchName} 
                            onChange={this.updateSearchName.bind(this)}
                        />
                    </InputGroup>
                </Col>
                
                <Col>
                    <InputGroup>
                        <InputGroupAddon addonType="prepend" style={{margin: "5px"}}>
                            <img 
                                src={require('../../Images/languages.png')} 
                                alt="Icon made by Smashicons from www.flaticon.com" 
                                style={{width: '25px', height: '25px'}}
                            />
                        </InputGroupAddon>
                        <Select
                            name="languageCode"
                            options={this.state.languageCodes}
                            className="basic-single"
                            classNamePrefix="select"
                            isClearable={true}
                            value={this.state.selectedLanguage}
                            onChange={this.updateSelectedLanguage}
                            styles={{ 
                                control: (provided, state) => ({...provided, width: state.isSelected ? '96px' : '96px', borderStyle: "hidden"}),
                                valueContainer: provided => ({...provided, width: '58px', fontSize: "12px"})
                            }}
                        />
                    </InputGroup>
                </Col>

                <Col>
                    <InputGroup>
                        <InputGroupAddon addonType="prepend" style={{margin: "5px"}}>
                            <img 
                                src={require('../../Images/creator.png')} 
                                alt="Icon made by Freepik from www.flaticon.com" 
                                style={{width: '25px', height: '25px'}}
                            />
                        </InputGroupAddon>
                        <Input 
                            style={{borderStyle: "hidden", padding: "6px"}}
                            type="text" 
                            placeholder="Search Creator" 
                            value={this.state.searchCreator} 
                            onChange={this.updateSearchCreator.bind(this)}
                        />
                    </InputGroup>
                </Col>
            </Row>

            <Card style={{height:"50vh", borderRadius: "6px", borderStyle: "hidden"}} className="moduleTable">
                {(this.props.currentClass.value === 0 && this.state.class === "") || 
                (this.props.currentClass.value === 0 && this.state.class === null) 
                ? 
                <Card color="info" style={{height: "100%", textAlign: "center", color: "white"}}>
                    Please select a class first.
                </Card> 
                :
                <Table hover>
                    <thead>
                        <tr>
                        <th style={{borderTopLeftRadius: "5px"}}>Name</th>
                        <th>Language</th>
                        <th>Creator</th>
                        <th style={{borderTopRightRadius: "5px"}}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredModules.map((module) => {
                            return (
                                <ExistingModule 
                                    key={module.moduleID} 
                                    module={module} 
                                    selectedClass={this.props.currentClass.value === 0 ? this.state.class : this.props.currentClass}
                                    serviceIP={this.props.serviceIP}
                                    updateModuleList={this.props.updateModuleList}
                                />
                            )
                        })}
                    </tbody>
                </Table>
                }
            </Card>
        </div>
        )
    }
}

export default AddExistingModule