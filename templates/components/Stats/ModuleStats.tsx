import useAxios from 'axios-hooks';
import moreRegImage from '@/public/static/images/moreReg.png';
import languageCodes from '@/public/static/json/languageCodes.json';
import axios from 'axios';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Button, Card, Col, Modal, ModalBody, ModalHeader, Table } from 'reactstrap';
import Wave from '../Loading/Wave';
import { useUser } from '@/hooks/useUser';
import styles from '../Profile/SuperAdminView.module.css';

type ModuleStatsType = {
    moduleID: number;
    name: string;
    averageScore: number;
    averageSessionLength: string;
};

type LanguageStatsType = {
    [key: string]: number;
};

type Term = {
    front: string;
    correctness: number;
};

type LanguageCodesType = typeof languageCodes;

export function ModuleStats() {
    const { user } = useUser();

    const [{ response: moduleResponse, error: moduleError, loading: moduleLoading }, refetchModuleStats] = useAxios<ModuleStatsType[]>(
        {
            url: '/elleapi/allmodulestats',
            method: 'get',
            headers: { Authorization: 'Bearer ' + user?.jwt }
        },
        { manual: true }
    );

    const [{ response: languageResponse, error: languageError, loading: languageLoading }, refetchLanguageStats] = useAxios<LanguageStatsType>(
        {
            url: '/elleapi/languagestats',
            method: 'get',
            headers: { Authorization: 'Bearer ' + user?.jwt }
        },
        { manual: true }
    );

    useEffect(() => {
        if (user?.jwt) {
            refetchModuleStats();
            refetchLanguageStats();
        }
    }, [refetchModuleStats, refetchLanguageStats, user?.jwt]);

    const [modalOpen, setModalOpen] = useState(false);
    const [termStats, setTermStats] = useState<Term[]>([]);

    const renderModulesChart = () => {
        // check if response exists and or if loading
        if (moduleError || moduleLoading || moduleResponse === undefined) {
            return <Wave chart='modules' />;
        }

        const moduleData = moduleResponse.data;
        console.log('moduleData', moduleData);

        return (
            <Card
                style={{
                    overflow: 'scroll',
                    height: '25vh',
                    backgroundColor: 'transparent',
                    border: 'none'
                }}
            >
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
                            return (
                                <tr key={i}>
                                    <td>{module.moduleID}</td>
                                    <td>{module.name}</td>
                                    <td>{(module.averageScore * 100).toFixed(2)}%</td>
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
            </Card>
        );
    };

    const toggleModal = (id: number) => {
        setModalOpen(!modalOpen);

        if (modalOpen === false) getTermStats(id);
    };

    const getTermStats = (id: number) => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: { moduleID: id }
        };

        axios
            .get('elleapi/termsperformance', header)
            .then((res) => {
                if (res.data.Message) setTermStats([]);
                else setTermStats(res.data);
            })
            .catch((error) => {
                console.log(error.response);
            });
    };

    const renderBarChart = () => {
        let terms = Object.entries(termStats).map(([i, term]) => {
            return { front: term.front, percentage: term.correctness * 100 };
        });

        let chartColors = getColors(terms.length);

        let performanceData = {
            labels: terms.map((term) => term.front),
            datasets: [
                {
                    label: 'Correctness (%)',
                    data: terms.map((term) => term.percentage.toFixed(2)),
                    backgroundColor: chartColors
                }
            ]
        };

        return termStats.length !== 0 ? (
            <Bar
                data={performanceData}
                options={{
                    scales: {
                        yAxis: {
                            min: 0,
                            max: 100,
                            ticks: {
                                color: 'black'
                            }
                        },
                        xAxis: {
                            ticks: {
                                color: 'black'
                            }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: 'black' } }
                    }
                }}
            />
        ) : (
            <p>No records found.</p>
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

    const renderLanguageChart = () => {
        // check if response exists and or if loading
        if (languageError || languageLoading || languageResponse === undefined) {
            return <Wave chart='language' />;
        }

        const languages = languageResponse.data;

        let languageData = {
            labels: Object.keys(languages).map((item) => languageCodes[item as keyof LanguageCodesType]) as string[],
            datasets: [
                {
                    label: 'Platforms',
                    data: Object.keys(languages).map((item) => (languages[item] * 100).toFixed(2)),
                    backgroundColor: [
                        '#96384e',
                        '#eda48e',
                        '#eed284',
                        '#CD5C5C',
                        '#F08080',
                        '#E9967A',
                        '#FA8072',
                        '#20B2AA',
                        '#2F4F4F',
                        '#008080',
                        '#008B8B',
                        '#4682B4',
                        '#6495ED',
                        '#00BFFF',
                        '#1E90FF',
                        '#8B008B',
                        '#9400D3',
                        '#9932CC',
                        '#BA55D3',
                        '#C71585',
                        '#DB7093',
                        '#FF1493',
                        '#FF69B4'
                    ]
                }
            ]
        };

        return (
            <Card
                style={{
                    overflow: 'scroll',
                    backgroundColor: 'transparent',
                    border: 'none'
                }}
            >
                <Pie
                    data={languageData}
                    height={198}
                    width={396}
                    options={{
                        cutout: 50,
                        responsive: false,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                align: 'start',
                                labels: {
                                    color: 'white',
                                    boxWidth: 10
                                },
                                display: true
                            }
                        }
                    }}
                />
            </Card>
        );
    };

    return (
        <>
            <Col className='Module Left Columns' xs='7'>
                <div className={styles.suCardGreen} style={{ height: 'fit-content' }}>
                    Module Performance
                    {renderModulesChart()}
                </div>
                <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
                    <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Terms Performance</ModalHeader>
                    <ModalBody>{renderBarChart()}</ModalBody>
                </Modal>
            </Col>
            <Col className='Module Right Columns' xs='5' style={{ paddingLeft: '0px' }}>
                <div className={styles.suCardBlue}>
                    Module Languages
                    {renderLanguageChart()}
                </div>
            </Col>
        </>
    );
}

export default ModuleStats;
