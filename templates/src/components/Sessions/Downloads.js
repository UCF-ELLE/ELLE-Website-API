import React from 'react';
import { Col } from 'reactstrap'; 
import DownloadGameLogs from './DownloadGameLogs';
import DownloadSessionLogs from './DownloadSessionLogs';


const Downloads = (props) => {   

    return (
        <Col style={{display: "flex", justifyContent: "flex-end"}}>
            <DownloadSessionLogs serviceIP={props.serviceIP}/>
            <DownloadGameLogs serviceIP={props.serviceIP}/>
        </Col>
    );
}

export default Downloads