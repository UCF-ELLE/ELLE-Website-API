import { useUser } from '@/hooks/useUser';
import { LoggedAnswer } from '@/types/api/logged_answer';
import { StudentResponse } from '@/types/api/mentors';
import { Question } from '@/types/api/question';
import { Session } from '@/types/api/sessions';
import axios from 'axios';
import React, { useState } from 'react';
import { Badge, Card, Col, Modal, ModalBody, ModalHeader, Row, Table } from 'reactstrap';

export default function SessionComponent({ sessions }: { sessions: Session[] }) {
    const [currentSession, setCurrentSession] = useState<Session>();
    const [loggedAnswers, setLoggedAnswers] = useState<LoggedAnswer[]>([]);
    const [noAnsMsg, setNoAnsMsg] = useState('');
    const [noRespMsg, setNoRespMsg] = useState('');
    const [noQuesMsg, setNoQuesMsg] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [mentorResponses, setMentorResponses] = useState<StudentResponse[]>([]);
    const [mentorQuestions, setMentorQuestions] = useState<Question[]>([]);
    const [questionID, setQuestionID] = useState('');
    const { user } = useUser();

    const convertTimetoDecimal = (time: string) => {
        let hoursMinutes = time.split(/[.:]/);
        let hours = parseInt(hoursMinutes[0], 10);
        let minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
        return hours + minutes / 60;
    };

    const calculateTimeDiff = (start: number, end: number) => {
        let result = end - start;

        // If negative duration is added, correct it
        if (result < 0) {
            result += 24;
        }
        // Format number to 2 decimal places
        return result.toFixed(2);
    };

    const showLoggedAnswers = async (session: Session) => {
        await getLoggedAnswers(session.sessionID);
        await getMentorResponses(session.sessionID);
        await getMentorQuestion();
        setCurrentSession(session);
        setModalOpen(true);
    };

    const getLoggedAnswers = async (sessionID: number) => {
        console.log('sessionId: ', sessionID);

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: { sessionID: sessionID }
        };

        axios
            .get<LoggedAnswer[] | { Message: string }>('/elleapi/loggedanswer', header)
            .then((res) => {
                console.log('logged answer: ', res.data);

                if ('Message' in res.data) {
                    setNoAnsMsg(res.data.Message);
                } else {
                    setLoggedAnswers(res.data);
                }
            })
            .catch((error) => {
                console.log('get logged answer error: ', error);
            });
    };

    const getMentorResponses = async (session_id: number) => {
        let header = {
            headers: {
                Authorization: 'Bearer ' + user?.jwt,
                'Content-Type': 'application/json'
            },
            params: { session_id: session_id }
        };

        await axios
            .get<StudentResponse[] | { Message: string }>('/elleapi/studentresponses', header)
            .then((res) => {
                console.log('mentor responses: ', res.data);

                if ('Message' in res.data) {
                    setNoRespMsg(res.data.Message);
                } else {
                    setMentorResponses(res.data);
                }
            })
            .catch((error) => {
                console.log('get mentor responses error: ', error);
            });
    };

    const getMentorQuestion = async () => {
        const responses = mentorResponses;
        const mentorQuestions: Question[] = [];

        for (let i = 0; i < responses.length; i++) {
            const questionID = responses[i].questionID;

            let header = {
                headers: { Authorization: 'Bearer ' + user?.jwt },
                params: { questionID: questionID }
            };

            await axios
                .get<Question | { Message: string }>('/elleapi/question', header)
                .then((res) => {
                    console.log('mentor response question: ', res.data);

                    if ('Message' in res.data) {
                        setNoQuesMsg(res.data.Message);
                    } else {
                        mentorQuestions.push(res.data);
                    }
                })
                .catch((error) => {
                    console.log('get mentor response question error: ', error);
                });
        }

        setMentorQuestions(mentorQuestions);
    };

    const toggleModal = () => {
        if (modalOpen) {
            setLoggedAnswers([]);
            setNoAnsMsg('');
            setMentorResponses([]);
            setMentorQuestions([]);
            setNoRespMsg('');
            setNoQuesMsg('');
            setQuestionID('');
        }

        setModalOpen(!modalOpen);
    };

    console.log('length: ', loggedAnswers);
    return (
        <div>
            <Card style={{ border: 'none', height: '56vh', overflow: 'scroll' }}>
                <Table hover className='minimalisticTable'>
                    <thead>
                        <tr>
                            <th>Session ID</th>
                            <th>Date</th>
                            <th>User ID</th>
                            <th>Score</th>
                            <th>Duration</th>
                            <th>Module ID</th>
                            <th>Module Name</th>
                            <th>Platform</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((session, i) => {
                            return (
                                <tr key={i} onClick={() => showLoggedAnswers(session)}>
                                    <td>{session.sessionID}</td>
                                    <td>{session.sessionDate}</td>
                                    <td>{session.userID}</td>
                                    <td>{session.playerScore}</td>
                                    <td>
                                        {session.endTime !== null && session.startTime !== null
                                            ? calculateTimeDiff(
                                                  convertTimetoDecimal(session.startTime || '0:00'),
                                                  convertTimetoDecimal(session.endTime || '0:00')
                                              ) + ' hrs'
                                            : 'invalid values'}
                                    </td>
                                    <td>{session.moduleID}</td>
                                    <td>{session.moduleName}</td>
                                    <td>{session.platform}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Card>

            <Modal size='lg' isOpen={modalOpen} toggle={() => toggleModal()}>
                <ModalHeader toggle={() => toggleModal()} style={{ paddingBottom: '0px' }}>
                    Logged Answers
                    <Row style={{ paddingTop: '10px' }}>
                        <Col>
                            <h6>
                                <Badge> Module ID: {currentSession?.moduleID}</Badge>
                            </h6>
                        </Col>
                        <Col>
                            <h6>
                                <Badge>Module Name: {currentSession?.moduleName}</Badge>
                            </h6>
                        </Col>
                        <Col>
                            <h6>
                                <Badge>Mode: {currentSession?.mode}</Badge>
                            </h6>
                        </Col>
                    </Row>
                </ModalHeader>
                <ModalBody>
                    {loggedAnswers.length !== 0 ? (
                        <div>
                            <Row>
                                <Col style={{ textDecoration: 'underline' }}>Term ID</Col>
                                <Col style={{ textDecoration: 'underline' }}>Term</Col>
                                <Col style={{ textDecoration: 'underline' }}>Answer</Col>
                            </Row>
                            <Card
                                style={{
                                    overflow: 'scroll',
                                    height: '35vh',
                                    border: 'none'
                                }}
                            >
                                {loggedAnswers.map((ans, i) => {
                                    return (
                                        <Row key={i}>
                                            <Col>{ans.termID}</Col>
                                            <Col>{ans.front}</Col>
                                            <Col>
                                                {ans.correct ? (
                                                    <a
                                                        style={{
                                                            color: 'green'
                                                        }}
                                                    >
                                                        correct
                                                    </a>
                                                ) : (
                                                    <a style={{ color: 'red' }}>incorrect</a>
                                                )}
                                            </Col>
                                        </Row>
                                    );
                                })}
                                <Row>
                                    <br />
                                </Row>
                                <div style={{ fontSize: '24px' }}>
                                    <strong>Mentor Questions/Responses</strong>
                                </div>
                                <Row>
                                    <br />
                                </Row>
                                <Row>
                                    <Col style={{ textDecoration: 'underline' }}>Question</Col>
                                    <Col style={{ textDecoration: 'underline' }}>Response</Col>
                                </Row>

                                {mentorResponses.length !== 0 ? (
                                    mentorResponses.map((ans, i) => {
                                        const question = mentorQuestions[i];
                                        return (
                                            <React.Fragment key={i}>
                                                <Row>
                                                    <Col>{question ? question.questionText : ''}</Col>
                                                    <Col>{ans.response}</Col>
                                                </Row>
                                                <Row>
                                                    <Col>
                                                        <div className='my-3 border-bottom'></div>
                                                    </Col>
                                                </Row>
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <Row>
                                        <Col>{noRespMsg}</Col>
                                    </Row>
                                )}
                            </Card>
                        </div>
                    ) : (
                        <p>{noAnsMsg}</p>
                    )}
                </ModalBody>
            </Modal>
        </div>
    );
}
