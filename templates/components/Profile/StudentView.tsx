import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import {
    Row,
    Col,
    Badge,
    Button,
    Card,
    CardBody,
    ListGroup,
    ListGroupItem,
    Form,
    FormGroup,
    Label,
    Input,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane
} from 'reactstrap';
import axios from 'axios';
import Password from './Password';
import ModulePerformance from '../Stats/ModulePerformance';
import TermPerformance from '../Stats/TermPerformance';
import { useUser } from '@/hooks/useUser';
import { UserGroup } from '@/types/api/group';

type StudentViewProps = {
    email?: string;
    username: string;
    editEmail: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function StudentView(props: StudentViewProps) {
    const [classes, setClasses] = useState<UserGroup[]>([]);
    const [classCode, setClassCode] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const { user } = useUser();

    const getClasses = useCallback(() => {
        axios
            .get('/elleapi/searchusergroups', {
                headers: {
                    Authorization: 'Bearer ' + user?.jwt
                }
            })
            .then((res) => {
                setClasses(res.data);
            })
            .catch((error) => {
                console.log(error.response);
            });
    }, [user?.jwt]);

    useEffect(() => {
        getClasses();
    }, [getClasses]);

    const submitClassCode = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let data = {
            groupCode: classCode
        };

        const headers = {
            Authorization: 'Bearer ' + user?.jwt
        };

        axios
            .post('/elleapi/groupregister', data, { headers: headers })
            .then((res) => {
                getClasses();
                setClassCode('');
            })
            .catch((error) => {
                console.log(error.response);
            });
    };

    return (
        <>
            <h3>
                <Badge style={{ backgroundColor: 'cadetblue' }}>Your Profile</Badge>
            </h3>
            <Row>
                <Col xs='3'>
                    <Card style={{ backgroundColor: 'lightblue', height: '65vh' }}>
                        <CardBody>
                            <h6>Username:</h6>
                            <Card>
                                <Row>
                                    <Col
                                        xs='8'
                                        style={{
                                            marginLeft: '15px',
                                            paddingLeft: '15px',
                                            paddingTop: '5px',
                                            display: 'flex',
                                            overflowX: 'scroll'
                                        }}
                                    >
                                        {props.username}
                                    </Col>
                                    <Col xs='3' style={{ paddingRight: '9px' }}>
                                        <Password userType='st' email={props.email} editEmail={props.editEmail} />
                                    </Col>
                                </Row>
                            </Card>

                            <br />

                            <h6>Classes:</h6>
                            <Card style={{ overflow: 'scroll', height: '20vh' }}>
                                <ListGroup flush>
                                    {classes.length === 0 ? (
                                        <ListGroupItem> You currently are not part of any classes. </ListGroupItem>
                                    ) : (
                                        classes.map((item, i) => {
                                            return <ListGroupItem key={i}>{item.groupName}</ListGroupItem>;
                                        })
                                    )}
                                </ListGroup>
                            </Card>

                            <Form onSubmit={(e) => submitClassCode(e)}>
                                <h4 style={{ marginTop: '8px' }}>Join a New Class</h4>
                                <FormGroup>
                                    <Label for='classCode'>Class Code: </Label>
                                    <Input
                                        type='text'
                                        name='classCode'
                                        id='classCode'
                                        onChange={(e) => setClassCode(e.target.value)}
                                        value={classCode}
                                    />
                                </FormGroup>
                                <Button block type='submit'>
                                    Join
                                </Button>
                            </Form>
                        </CardBody>
                    </Card>
                </Col>

                <Col xs='9'>
                    <Card style={{ backgroundColor: 'cadetblue', height: '65vh' }}>
                        <CardBody style={{ color: '#04354b' }}>
                            <h1>Welcome back {props.username}!</h1>
                            <Row>
                                <Col>
                                    <Nav tabs>
                                        <NavItem>
                                            <NavLink href='#' active={activeTab === 0} onClick={() => setActiveTab(0)}>
                                                Module Performance
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink href='#' active={activeTab === 1} onClick={() => setActiveTab(1)}>
                                                Term Performance
                                            </NavLink>
                                        </NavItem>
                                    </Nav>
                                    <TabContent activeTab={activeTab}>
                                        <TabPane tabId={0}>
                                            <ModulePerformance />
                                        </TabPane>
                                        <TabPane tabId={1}>
                                            <TermPerformance classes={classes} />
                                        </TabPane>
                                    </TabContent>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </>
    );
}
