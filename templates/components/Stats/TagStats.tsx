import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Row, Col, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import Wave from '../Loading/Wave';
import Image from 'next/image';
import moreRegImage from '@/public/static/images/moreReg.png';
import { useUser } from '@/hooks/useUser';
import useAxios from 'axios-hooks';
import styles from '../Profile/SuperAdminView.module.css';

type TagStatsType = {
    [key: string]: number;
};

export default function TagStats() {
    Chart.register(ArcElement, Tooltip, Legend);

    const { user } = useUser();
    const [{ response, loading, error }, refetch] = useAxios<TagStatsType>(
        {
            url: '/elleapi/tagcount',
            method: 'get',
            headers: { Authorization: 'Bearer ' + user?.jwt }
        },
        { manual: true }
    );

    const [modalOpen, setModalOpen] = useState(false);
    const [numTerms, setNumTerms] = useState(0);

    useEffect(() => {
        if (response !== undefined && response.data !== undefined) {
            let count = 0;
            Object.values(response.data).map((tag) => (count += tag));
            setNumTerms(count);
        }
    }, [response]);

    useEffect(() => {
        if (user?.jwt) refetch();
    }, [refetch, user?.jwt]);

    const renderTagStats = useMemo(() => {
        // check if response exists and or if loading
        if (error || loading || response === undefined) {
            return <Wave chart='tag' />;
        }

        const tagData = response.data;

        let numTerms = 0;
        Object.values(tagData).map((tag) => (numTerms += tag));

        return (
            <Card
                style={{
                    overflow: 'scroll',
                    height: '23vh',
                    backgroundColor: 'transparent'
                }}
            >
                <Table hover className='statsTable' style={{ color: 'black' }}>
                    <thead style={{ color: 'white' }}>
                        <tr>
                            <th>Tag</th>
                            <th># of Times Tagged</th>
                            <th>% Relative to Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(tagData).map((item, i) => {
                            return (
                                <tr key={i}>
                                    <td style={{ fontSize: '14px' }}>{item}</td>
                                    <td style={{ fontSize: '14px' }}>{tagData[item]}</td>
                                    <td style={{ fontSize: '14px' }}>{((tagData[item] / numTerms) * 100).toFixed(2)}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Card>
        );
    }, [response, error, loading]);

    const renderPieChart = () => {
        // check if response exists and or if loading
        if (error || loading || response === undefined) {
            return <Wave chart='tag' />;
        }

        const tagData = response.data;

        let chartColors = getColors(Object.keys(tagData).length);

        let frequencyData = {
            labels: Object.keys(tagData),
            datasets: [
                {
                    label: 'tags',
                    data: Object.values(tagData),
                    backgroundColor: chartColors
                }
            ]
        };

        return (
            <>
                <Card
                    style={{
                        height: '20vh',
                        backgroundColor: 'transparent',
                        border: 'none'
                    }}
                >
                    <Pie
                        data={frequencyData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            }
                        }}
                    />
                </Card>
            </>
        );
    };

    const getColors = (len: number) => {
        let list = [];
        let possibleColors = [
            '#abc9cd',
            '#658e93',
            '#7abe80',
            '#ecf8b1',
            '#c7eab4',
            '#7fcdbb',
            '#40b6c4',
            '#1e91c0',
            '#225ea8',
            '#263494',
            '#091d58'
        ];

        let index = 0;
        for (let i = 0; i < len; i++) {
            list.push(possibleColors[index]);

            index++;
            if (index >= possibleColors.length) index = 0;
        }

        return list;
    };

    const toggleModal = () => {
        setModalOpen(!modalOpen);
    };

    return (
        <>
            <div className={styles.suCardBlue}>
                Tags
                {response && Object.keys(response.data).length !== 0 ? (
                    <>
                        {renderPieChart()}
                        <Row>
                            <Col xs='11' style={{ padding: '0px' }}>
                                <span style={{ fontSize: '12px' }}># of Terms with Tags: {numTerms}</span>
                            </Col>
                            <Col xs='1' style={{ padding: '0px' }}>
                                <Button
                                    style={{
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        padding: '0px'
                                    }}
                                    onClick={() => toggleModal()}
                                >
                                    <Image
                                        style={{
                                            width: '20px',
                                            height: '20px'
                                        }}
                                        src={moreRegImage}
                                        alt='More Reg Image'
                                    />
                                </Button>
                            </Col>
                        </Row>
                    </>
                ) : (
                    <Wave chart='tag' />
                )}
            </div>

            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Tag Stats</ModalHeader>
                <ModalBody>
                    {renderPieChart()}
                    <Row style={{ margin: '12px 0 0 0' }}>
                        <Col>
                            <p style={{ fontSize: '12px' }}># of Terms with Tags: {numTerms}</p>
                        </Col>
                        <Col>
                            <p style={{ fontSize: '12px' }}># of Tag Types: {response && Object.keys(response.data).length}</p>
                        </Col>
                    </Row>
                    {renderTagStats}
                </ModalBody>
            </Modal>
        </>
    );
}
