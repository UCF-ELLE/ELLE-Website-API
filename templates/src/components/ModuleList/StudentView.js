import React from 'react'; 
import { Card } from 'reactstrap'; 
import SplitDeckBtn from '../../pages/SplitDeckBtn';

const StudentView = (props) => {

    return (
        <Card color="info" style={{overflow:"scroll", height:"60vh"}}>
        {
            props.modules.map((deck, i)=> (
                <SplitDeckBtn 
                    key={i}
                    permissionLevel={props.currentPermissionLevel}
                    curModule={deck} 
                    updateCurrentModule={props.updateCurrentModule}
                />
            ))
        }
        </Card>
    );
}

export default StudentView