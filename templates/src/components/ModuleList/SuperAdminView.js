import React from 'react'; 
import { Card } from 'reactstrap'; 
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import SplitDeckBtn from '../../pages/SplitDeckBtn';

const SuperAdminView = (props) => {

    return (
        <Tabs defaultActiveKey="own" id="moduleList-tabs">
            <Tab eventKey="own" title="Own">
                <Card color="info" style={{overflow:"scroll", height:"60vh", borderTopLeftRadius: "0px"}}>
                    {props.modules.filter((module) => module.userID == localStorage.getItem('id')).map((deck, i)=> (
                        <SplitDeckBtn 
                            key={i}
                            permissionLevel={props.currentPermissionLevel}
                            curModule={deck} 
                            updateCurrentModule={props.updateCurrentModule}
                            deleteModule={props.deleteModule}
                            editModule={props.editModule}
                        />
                    ))}
                </Card>
            </Tab>
            <Tab eventKey="database" title="Database">
                <Card color="info" style={{overflow:"scroll", height:"60vh", borderTopLeftRadius: "0px"}}>
                    {props.modules.filter((module) => module.userID != localStorage.getItem('id')).map((deck, i)=> (
                        <SplitDeckBtn 
                            key={i}
                            permissionLevel={props.currentPermissionLevel}
                            curModule={deck} 
                            updateCurrentModule={props.updateCurrentModule}
                            deleteModule={props.deleteModule}
                            editModule={props.editModule}
                        />
                    ))}
                </Card>
            </Tab>
        </Tabs>
    );
}

export default SuperAdminView