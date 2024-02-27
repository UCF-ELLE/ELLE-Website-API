import React, { useEffect, useState } from 'react';
import { Col } from 'reactstrap';
import { Button, Tooltip } from 'reactstrap';
import DownloadSpinner from '../Loading/DownloadSpinner';
import useAxios from 'axios-hooks';
import { useUser } from '@/hooks/useUser';

export function Downloads() {
    return (
        <Col style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <DownloadSessionLogs />
            <DownloadGameLogs />
        </Col>
    );
}

export function DownloadGameLogs() {
    const { user } = useUser();
    const [loggedAnsTooltipOpen, setLoggedAnsTooltipOpen] = useState(false);
    const toggleLoggedAnsTooltip = () => setLoggedAnsTooltipOpen(!loggedAnsTooltipOpen);

    const [{ data, loading, error }, refetchCSV] = useAxios<string>(
        {
            method: 'get',
            url: '/elleapi/getloggedanswercsv',
            headers: { Authorization: 'Bearer ' + user?.jwt }
        },
        { manual: true }
    );

    useEffect(() => {
        if (loading || error || !data) return;
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'logged_answers.csv');
        document.body.appendChild(link);
        link.click();
    }, [data, loading, error]);

    return (
        <>
            <Button
                id='downloadLoggedAnswers'
                style={{
                    backgroundColor: '#37f0f9',
                    color: 'black',
                    border: 'none',
                    marginRight: '15px',
                    display: 'grid',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 2px 0 2px'
                }}
                onClick={() => refetchCSV()}
            >
                <DownloadSpinner loading={loading} />
            </Button>

            <Tooltip placement='top' isOpen={loggedAnsTooltipOpen} target='downloadLoggedAnswers' toggle={() => toggleLoggedAnsTooltip()}>
                Download Logged Answers
            </Tooltip>
        </>
    );
}

export function DownloadSessionLogs() {
    const { user } = useUser();
    const [sessionTooltipOpen, setSessionTooltipOpen] = useState(false);
    const toggleSessionTooltip = () => setSessionTooltipOpen(!sessionTooltipOpen);

    const [{ data, loading, error }, refetchCSV] = useAxios<string>(
        {
            method: 'get',
            url: '/elleapi/getsessioncsv',
            headers: { Authorization: 'Bearer ' + user?.jwt }
        },
        { manual: true }
    );

    useEffect(() => {
        if (loading || error || !data) return;
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sessions.csv');
        document.body.appendChild(link);
        link.click();
    }, [data, loading, error]);

    return (
        <>
            <Button
                id='downloadSessions'
                style={{
                    backgroundColor: '#37f0f9',
                    color: 'black',
                    border: 'none',
                    marginRight: '15px',
                    display: 'grid',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 2px 0 2px'
                }}
                onClick={() => refetchCSV()}
            >
                <DownloadSpinner loading={loading} type='sessionBtn' />
            </Button>

            <Tooltip placement='top' isOpen={sessionTooltipOpen} target='downloadSessions' toggle={() => toggleSessionTooltip()}>
                Download Sessions
            </Tooltip>
        </>
    );
}
