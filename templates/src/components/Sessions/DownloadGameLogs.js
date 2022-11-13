import React, { useState } from 'react';
import { Button, Tooltip } from 'reactstrap'; 
import axios from 'axios';
import { trackPromise } from 'react-promise-tracker';
import DownloadSpinner from '../Loading/DownloadSpinner';


const DownloadGameLogs = (props) => {   
    const [loggedAnsTooltipOpen, setLoggedAnsTooltipOpen] = useState(false);
    const toggleLoggedAnsTooltip = () => setLoggedAnsTooltipOpen(!loggedAnsTooltipOpen);
    
    const downloadLoggedAnswers = () => {
        trackPromise(
            axios({
                url: props.serviceIP + '/getloggedanswercsv',
                method: 'GET',
                responseType: 'blob', 
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
            }).then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'logged_answers.csv');
                document.body.appendChild(link);
                link.click();
            }), 'gameLogsBtn'
        );
    }

    return (
        <>
            <Button 
                id="downloadLoggedAnswers"
                style={{backgroundColor: "#37f0f9", color: "black", border: "none", marginRight: "15px", 
                    display: "grid", fontSize: "10px", fontWeight: "700", padding: "2px 2px 0 2px"}} 
                onClick={() => downloadLoggedAnswers()}
            >
                <DownloadSpinner area="gameLogsBtn"/>

            </Button>

            <Tooltip placement="top" isOpen={loggedAnsTooltipOpen} target="downloadLoggedAnswers" toggle={() => toggleLoggedAnsTooltip()}>
                Download Logged Answers
            </Tooltip>
        </>
    );
}

export default DownloadGameLogs