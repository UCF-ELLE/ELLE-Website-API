import React, { useState } from 'react';
import { Button, Tooltip } from 'reactstrap'; 
import axios from 'axios';
import { trackPromise } from 'react-promise-tracker';
import DownloadSpinner from '../Loading/DownloadSpinner';

const DownloadSessionLogs = (props) => {   
    const [sessionTooltipOpen, setSessionTooltipOpen] = useState(false);
    const toggleSessionTooltip = () => setSessionTooltipOpen(!sessionTooltipOpen);

    const downloadSessions = () => {
        trackPromise(
            axios({
                url: props.serviceIP + '/getsessioncsv',
                method: 'GET',
                responseType: 'blob', 
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
            }).then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'sessions.csv');
                document.body.appendChild(link);
                link.click();
            }), 'sessionBtn'
        );
    }

    return (
        <>
            <Button 
                id="downloadSessions"
                style={{backgroundColor: "#37f0f9", color: "black", border: "none", marginRight: "15px", 
                    display: "grid", fontSize: "10px", fontWeight: "700", padding: "2px 2px 0 2px"}} 
                onClick={() => downloadSessions()}
            >
                <DownloadSpinner area="sessionBtn"/>

            </Button>

            <Tooltip placement="top" isOpen={sessionTooltipOpen} target="downloadSessions" toggle={() => toggleSessionTooltip()}>
                Download Sessions 
            </Tooltip>
        </>
    );
}

export default DownloadSessionLogs