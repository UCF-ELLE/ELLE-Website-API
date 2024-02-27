import React, { useCallback, useEffect, useState } from 'react';
import { Row, Col, Table, Card, Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import useAxios from 'axios-hooks';
import Spinner from '../Loading/Spinner';
import ThreeDots from '../Loading/ThreeDots';
import { Bar } from 'react-chartjs-2';
import { Chart } from 'chart.js';
import moreRegImage from '@/public/static/images/moreReg.png';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
import { Tooltip } from 'chart.js';

type ModulePerformanceType = {
    moduleID: string;
    name: string;
    averageScore: number;
    averageSessionLength: number;
};

type TermStats = {
    front: string;
    correctness: number;
};

export default function ModulePerformance() {
    Chart.register(Tooltip);
    const { user } = useUser();

    const [{ data: moduleResponse, loading: moduleLoading, error: moduleError }, refetchModuleStats] = useAxios<ModulePerformanceType[]>(
        {
            method: 'get',
            url: '/elleapi/allmodulestats',
            headers: { Authorization: 'Bearer ' + user?.jwt }
        },
        { manual: true }
    );

    const [moduleID, setModuleID] = useState<string>('0');

    const [{ data: termResponse, loading: termLoading, error: termError }, refetchTermStats] = useAxios<TermStats[]>(
        {
            method: 'get',
            url: '/elleapi/termsperformance',
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: { moduleID: moduleID }
        },
        { manual: true }
    );

    useEffect(() => {
        if (user?.jwt) {
            console.log('refetching');
            refetchModuleStats();
            if (moduleID) refetchTermStats();
        }
    }, [moduleID, refetchModuleStats, refetchTermStats, user?.jwt]);

    const [modules, setModules] = useState<ModulePerformanceType[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [showTermStats, setShowTermStats] = useState(false);

    const renderModulesTable = () => {
        // check if response exists and or if loading
        console.log('moduleError', moduleError);
        if (moduleError || moduleLoading || moduleResponse === undefined) {
            return <Spinner chart='performance' />;
        }

        const moduleData = moduleResponse;
        console.log('moduleData', moduleData);

        return moduleData.length !== 0 ? (
            <Table className='statsTable'>
                <thead>
                    <tr>
                        <th>Module ID</th>
                        <th>Module Name</th>
                        <th>Average Score</th>
                        <th>Average Duration</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {moduleData.map((module, i) => {
                        let avgScore = module.averageScore * 100;
                        return (
                            <tr key={i} style={{ color: getRangeColor(avgScore) }}>
                                <td>{module.moduleID}</td>
                                <td>{module.name}</td>
                                <td>{avgScore.toFixed(2)}%</td>
                                <td>{module.averageSessionLength}</td>
                                <td>
                                    <Button
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            padding: '0px'
                                        }}
                                        onClick={() => toggleModal(module.moduleID)}
                                    >
                                        <Image
                                            src={moreRegImage}
                                            alt='Icon made by xnimrodx from www.flaticon.com'
                                            style={{
                                                width: '20px',
                                                height: '20px'
                                            }}
                                        />
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        ) : (
            <p style={{ margin: '10px 15px' }}>There are currently no records.</p>
        );
    };

    const getRangeColor = (value: number) => {
        let color = '';
        if (value >= 90) {
            color = 'limegreen';
        } else if (value >= 80) {
            color = 'lawngreen';
        } else if (value >= 70) {
            color = 'yellow';
        } else if (value >= 60) {
            color = 'orange';
        } else {
            color = 'red';
        }

        return color;
    };

    const toggleModal = (id: string) => {
        setModalOpen(!modalOpen);

        if (modalOpen === false) {
            setShowTermStats(true);
            setModuleID(id);
        } else {
            setShowTermStats(false);
        }
    };

    const renderChart = useCallback(() => {
        // check if response exists and or if loading
        if (termError || termLoading || termResponse === undefined) {
            return <Spinner chart='performance' />;
        }

        const termData = termResponse;

        let terms = Object.entries(termData).map(([i, term]) => {
            return { front: term.front, percentage: term.correctness * 100 };
        });

        let chartColors = getColors(terms.length);

        let performanceData = {
            labels: terms.map((term) => term.front),
            datasets: [
                {
                    label: 'Correctness (%)',
                    data: terms.map((term) => term.percentage),
                    backgroundColor: chartColors
                }
            ]
        };

        console.log('performanceData', performanceData);

        return termData.length !== 0 ? (
            <Bar
                width={500}
                height={250}
                data={performanceData}
                options={{
                    responsive: true,
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 100,
                            ticks: {
                                stepSize: 5
                            }
                        }
                    }
                }}
            />
        ) : (
            <p>No records found.</p>
        );
    }, [termError, termLoading, termResponse]);

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

    return (
        <Row>
            <Col>
                <Card
                    style={{
                        backgroundColor: '#04354b',
                        color: 'aqua',
                        overflow: 'scroll',
                        height: '45vh',
                        borderTopLeftRadius: '0px'
                    }}
                >
                    {moduleResponse ? renderModulesTable() : <Spinner chart='performance' />}
                </Card>

                <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} style={{ maxWidth: '40%' }}>
                    <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Terms Performance</ModalHeader>
                    <ModalBody>{showTermStats ? renderChart() : <ThreeDots />}</ModalBody>
                </Modal>
            </Col>
        </Row>
    );
}
