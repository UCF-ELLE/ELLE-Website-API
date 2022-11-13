import React from 'react'; 
import { Card } from 'reactstrap'; 
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import SplitDeckBtn from '../../pages/SplitDeckBtn';

const AdminView = (props) => {

    return (   
        <Tabs defaultActiveKey={"own"} id="moduleList-tabs">
            <Tab eventKey="own" title="Own">
                <Card color="info" style={{overflow:"scroll", height:"60vh", borderTopLeftRadius: "0px"}}>
                    {props.modules.filter((module) => module.owned === true).map((deck, i)=> (
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
            <Tab eventKey="linked" title="Linked">
                <Card color="info" style={{overflow:"scroll", height:"60vh", borderTopLeftRadius: "0px"}}>
                    {props.modules.filter((module) => module.owned === false).map((deck, i)=> (
                        <SplitDeckBtn 
                            key={i}
                            permissionLevel={props.currentPermissionLevel}
                            currentClassView={props.currentClassView}
                            curModule={deck} 
                            updateCurrentModule={props.updateCurrentModule}
                            deleteModule={props.deleteModule}
                            editModule={props.editModule}
                            unlinkModule={props.unlinkModule}
                        />
                    ))}
                </Card>
            </Tab>
        </Tabs>
    );
}

export default AdminView