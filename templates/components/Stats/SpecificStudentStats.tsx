import React, { useCallback, useEffect } from 'react';
import { Row, Col, Label, Card, Button } from 'reactstrap';
import Select from 'react-select';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import ThreeDots from '../Loading/ThreeDots';
import TermStats from './TermStats';
import TermBarChart from './TermBarChart';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { useUser } from '@/hooks/useUser';
import { TermPerformance } from '@/types/api/stats';

export default function SpecificStudentStats({ groupID }: { groupID?: string }) {
    const [students, setStudents] = React.useState([]);
    const [selectedStudent, setSelectedStudent] = React.useState<string>();
    const [threshold, setThreshold] = React.useState(50);
    const { user, loading: userLoading } = useUser();

    const [{ response: termStatsResponse, loading: termStatsLoading, error: termStatsError }, refreshTermStats] = useAxios<TermPerformance>(
        {
            method: 'get',
            url: '/elleapi/termsperformance',
            headers: { Authorization: `Bearer ${user?.jwt}` },
            params: { userID: selectedStudent, groupID: groupID }
        },
        { manual: true }
    );

    const getStudents = useCallback(() => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: { groupID: groupID }
        };

        axios
            .get('/elleapi/usersingroup', header)
            .then((res) => {
                let students = res.data
                    .filter((entry: any) => entry.accessLevel === 'st')
                    .map((student: any) => {
                        return {
                            label: student.username,
                            value: student.userID
                        };
                    });

                setStudents(students);
            })
            .catch((error) => {
                console.log(error.response);
            });
    }, [groupID, user?.jwt]);

    useEffect(() => {
        if (user?.jwt) {
            getStudents();
        }
    }, [getStudents, user?.jwt]);

    const changeThreshold = (value: number | number[]) => {
        if (typeof value === 'number') setThreshold(value);
        else setThreshold(value[0]);
    };

    return (
        <div>
            <Row>
                <Col xs='3' style={{ paddingRight: '0px', margin: '8px' }}>
                    <Label>Student:</Label>
                </Col>
                <Col xs='6' style={{ marginLeft: '-35px', padding: '0px' }}>
                    <Select
                        name='students'
                        options={students}
                        className='basic-single'
                        classNamePrefix='select'
                        isClearable={true}
                        value={selectedStudent}
                        onChange={(e) => {
                            console.log('selected student', e);
                            setSelectedStudent(e || undefined);
                        }}
                    />
                </Col>
                <Col xs='3'>
                    <Button onClick={() => refreshTermStats()}>Search</Button>
                </Col>
            </Row>
            <br />
            <Card style={{ border: 'none' }}>
                {termStatsResponse && !termStatsLoading && !termStatsError ? (
                    termStatsResponse.data ? (
                        <div>
                            <TermBarChart termStats={termStatsResponse.data} threshold={threshold} />
                            <Slider value={threshold} style={{ width: '90%', margin: '5px 30px' }} onChange={changeThreshold} />
                            <p
                                style={{
                                    textAlign: 'end',
                                    padding: '0px 20px',
                                    fontSize: '10px'
                                }}
                            >
                                Threshold: {threshold}%
                            </p>
                            <Card style={{ height: '25vh', overflow: 'scroll' }}>
                                <TermStats termStats={termStatsResponse.data} />
                            </Card>
                        </div>
                    ) : (
                        <p>No records found.</p>
                    )
                ) : (
                    <ThreeDots />
                )}
            </Card>
        </div>
    );
}
