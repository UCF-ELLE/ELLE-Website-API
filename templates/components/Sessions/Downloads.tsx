import React, { useEffect, useState } from 'react';
import { Col } from 'reactstrap';
import { Button, Tooltip } from 'reactstrap';
import DownloadSpinner from '../Loading/DownloadSpinner';
import useAxios from 'axios-hooks';
import { useUser } from '@/hooks/useAuth';

export function Downloads() {
    return (
        <Col style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <DownloadSessionLogs />
            <DownloadGameLogs />
            <DownloadLoggedPastas />
            <DownloadLoggedUserItems />
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
                    padding: '2px 2px 0 2px',
                    minWidth: '50px'
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
                    padding: '2px 2px 0 2px',
                    minWidth: '50px'
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

export function DownloadLoggedPastas() {
    const { user } = useUser();
    const [loggedPastaTooltipOpen, setLoggedPastaTooltipOpen] = useState(false);
    const toggleLoggedPastaTooltip = () => setLoggedPastaTooltipOpen(!loggedPastaTooltipOpen);

    const [{ data, loading, error }, refetchCSV] = useAxios<string>(
        {
            method: 'get',
            url: '/elleapi/pastagame/loggedpasta/csv',
            headers: { Authorization: 'Bearer ' + user?.jwt }
        },
        { manual: true }
    );

    useEffect(() => {
        if (loading || error || !data) return;
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'logged_pastas.csv');
        document.body.appendChild(link);
        link.click();
    }, [data, loading, error]);

    return (
        <>
            <Button
                id='downloadLoggedPastas'
                style={{
                    backgroundColor: '#37f0f9',
                    color: 'black',
                    border: 'none',
                    marginRight: '15px',
                    display: 'grid',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 2px 0 2px',
                    minWidth: '50px'
                }}
                onClick={() => refetchCSV()}
            >
                <DownloadSpinner loading={loading} type='pastaBtn' />
            </Button>

            <Tooltip placement='top' isOpen={loggedPastaTooltipOpen} target='downloadLoggedPastas' toggle={() => toggleLoggedPastaTooltip()}>
                Download Logged Pastas
            </Tooltip>
        </>
    );
}

export function DownloadLoggedUserItems() {
    const { user } = useUser();
    const [loggedUserItemTooltipOpen, setLoggedUserItemTooltipOpen] = useState(false);
    const toggleLoggedUserItemTooltip = () => setLoggedUserItemTooltipOpen(!loggedUserItemTooltipOpen);

    const [{ data, loading, error }, refetchCSV] = useAxios<string>(
        {
            method: 'get',
            url: '/elleapi/store/user/items/logged/csv',
            headers: { Authorization: 'Bearer ' + user?.jwt }
        },
        { manual: true }
    );

    useEffect(() => {
        if (loading || error || !data) return;
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'logged_user_items.csv');
        document.body.appendChild(link);
        link.click();
    }, [data, loading, error]);

    return (
        <>
            <Button
                id='downloadLoggedUserItems'
                style={{
                    backgroundColor: '#37f0f9',
                    color: 'black',
                    border: 'none',
                    marginRight: '15px',
                    display: 'grid',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 2px 0 2px',
                    minWidth: '50px'
                }}
                onClick={() => refetchCSV()}
            >
                <DownloadSpinner loading={loading} type='itemBtn' />
            </Button>

            <Tooltip placement='top' isOpen={loggedUserItemTooltipOpen} target='downloadLoggedUserItems' toggle={() => toggleLoggedUserItemTooltip()}>
                Download Logged User Items
            </Tooltip>
        </>
    );
}
