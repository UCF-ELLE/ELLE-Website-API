import React, { useEffect, useState } from 'react';
import { Col } from 'reactstrap';
import { Button, Tooltip } from 'reactstrap';
import { Input, FormGroup, Label, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import DownloadSpinner from '../Loading/DownloadSpinner';
import useAxios from 'axios-hooks';
import { useUser } from '@/hooks/useAuth';

export function Downloads({ earliestDate }: DownloadsProps) {
    return (
        <Col style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <DownloadSessionLogs earliestDate={earliestDate} />
            <DownloadGameLogs />
            <DownloadLoggedPastas />
            <DownloadLoggedUserItems />
        </Col>
    );
}
interface DownloadsProps {
    earliestDate: string; 
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

interface DownloadsProps {
    earliestDate: string;
}


export function DownloadSessionLogs({earliestDate}: DownloadsProps) {
    const { user } = useUser();
    const [sessionTooltipOpen, setSessionTooltipOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState(''); 
    const [sortOrder, setSortOrder] = useState('desc'); 
    const [error, setError] = useState('');

    useEffect(() => {
        if (earliestDate) {
            setStartDate(earliestDate); 
        }
        const today = new Date().toISOString().split('T')[0]; 
        setEndDate(today); 
    }, [earliestDate]);


    const toggleSessionTooltip = () => setSessionTooltipOpen(!sessionTooltipOpen);
    const toggleModal = () => setModalOpen(!modalOpen);

    // Axios request for CSV download
    const [{ data, loading, error: fetchError}, refetchCSV] = useAxios<string>(
        {
            method: 'get',
            url: '/elleapi/getsessioncsv',
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: {
                startDate, 
                endDate,
                order: sortOrder 
            }
        },
        { manual: true }
    );

    // Handle CSV file download
    useEffect(() => {
        if (loading || fetchError || !data) return;
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sessions_${startDate || 'all'}_${endDate || 'all'}_${sortOrder}.csv`);
        document.body.appendChild(link);
        link.click();
    }, [data, loading, fetchError]);

    const handleDownload = () => {
        if (new Date(startDate) > new Date(endDate)) {
            setError('The start date must be before the end date.');
            return;
        }
        refetchCSV(); 
        toggleModal(); 
    };

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
                onClick={toggleModal}
            >
                <DownloadSpinner loading={loading} type='sessionBtn' />
            </Button>

            <Tooltip
                placement='top'
                isOpen={sessionTooltipOpen}
                target='downloadSessions'
                toggle={toggleSessionTooltip}
            >
                Download Sessions
            </Tooltip>

            {/* Modal for Date Range and Sorting Options */}
            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Download Options</ModalHeader>
                <ModalBody>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <Label for='startDate'>Start Date</Label>
                    <Input
                        type='date'
                        id='startDate'
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />

                    <Label for='endDate' className='mt-2'>End Date</Label>
                    <Input
                        type='date'
                        id='endDate'
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />

                    {/* Sorting Order Selection */}
                    <Label for='sortOrder' className='mt-3'>Sort Order</Label>
                    <Input
                        type='select'
                        id='sortOrder'
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value='desc'>Descending (Newest First)</option>
                        <option value='asc'>Ascending (Oldest First)</option>
                    </Input>
                </ModalBody>
                <ModalFooter>
                    <Button color='primary' onClick={handleDownload}>
                        Download
                    </Button>
                    <Button color='secondary' onClick={toggleModal}>
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>
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
