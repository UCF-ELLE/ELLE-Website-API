import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import {
    Row,
    Col,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
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
import Image from 'next/image';
import moreImage from '@/public/static/images/more.png';
import { useUser } from '@/hooks/useUser';
import { UserGroup } from '@/types/api/group';
import ClassDetailsComponent from './ClassDetailsComponent';

type AdminViewProps = {
    email?: string;
    username: string;
    editEmail: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function AdminView(props: AdminViewProps) {
    const [classes, setClasses] = useState<UserGroup[]>([]);
    const [currentClassDetails, setCurrentClassDetails] = useState<UserGroup>({
        groupID: -1,
        groupName: '',
        groupCode: '',
        accessLevel: 'st',
        group_users: []
    });
    const [className, setClassName] = useState('');
    const [classCode, setClassCode] = useState('');
    const [editClass, setEditClass] = useState(false);
    const [classDetailModalOpen, setClassDetailModalOpen] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);
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
        if (user?.jwt) getClasses();
    }, [getClasses, user?.jwt]);

    const toggleTooltipOpen = () => {
        setTooltipOpen(!tooltipOpen);
    };

    const revealClassDetails = () => {
        return (
            <Modal isOpen={classDetailModalOpen} toggle={() => setClassDetailModalOpen(!classDetailModalOpen)}>
                <ModalHeader toggle={() => setClassDetailModalOpen(!classDetailModalOpen)}>Class Details</ModalHeader>
                <ModalBody>
                    <ClassDetailsComponent
                        item={currentClassDetails}
                        editClass={editClass}
                        handleOnEditName={handleOnEditName}
                        generateNewCode={generateNewCode}
                    />
                </ModalBody>
                <ModalFooter>
                    {editClass ? (
                        <Button color='primary' onClick={() => updateClassName()}>
                            Save
                        </Button>
                    ) : (
                        <Button color='primary' onClick={() => toggleEditClass()}>
                            Edit
                        </Button>
                    )}{' '}
                    <Button color='secondary' onClick={() => deleteClass()}>
                        Delete
                    </Button>
                </ModalFooter>
            </Modal>
        );
    };

    const toggleClassDetailModal = (item: UserGroup) => {
        setClassDetailModalOpen(!classDetailModalOpen);
        setCurrentClassDetails(item);
        setEditClass(false);
    };

    const toggleEditClass = () => {
        setEditClass(!editClass);
    };

    const handleOnEditName = (e: React.ChangeEvent<HTMLInputElement>) => {
        let temp = currentClassDetails;

        let newClassDetails = {
            accessLevel: temp.accessLevel,
            groupCode: temp.groupCode,
            groupID: temp.groupID,
            groupName: e.target.value,
            group_users: temp.group_users
        };

        setCurrentClassDetails(newClassDetails);
    };

    const updateClassName = () => {
        toggleEditClass();

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        let config = {
            groupID: currentClassDetails.groupID,
            groupName: currentClassDetails.groupName
        };

        axios
            .put('/elleapi/group', config, header)
            .then((res) => {
                getClasses();
            })
            .catch((error) => {
                console.log('updateClassName error: ', error);
            });
    };

    const generateNewCode = () => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: { groupID: currentClassDetails.groupID }
        };

        axios
            .get('/elleapi/generategroupcode', header)
            .then((res) => {
                let temp = currentClassDetails;

                let newClassDetails = {
                    accessLevel: temp.accessLevel,
                    groupCode: res.data.groupCode,
                    groupID: temp.groupID,
                    groupName: temp.groupName,
                    group_users: temp.group_users
                };

                setCurrentClassDetails(newClassDetails);
            })
            .catch((error) => {
                console.log('ERROR in generating new group code: ', error);
            });
    };

    const createClass = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        let config = {
            groupName: className
        };

        axios
            .post('/elleapi/group', config, header)
            .then((res) => {
                getClasses();
                setClassName('');
            })
            .catch((error) => {
                console.log('createClass error: ', error);
            });
    };

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

    const deleteClass = () => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            data: { groupID: currentClassDetails.groupID }
        };

        axios
            .delete('/elleapi/group', header)
            .then((res) => {
                toggleClassDetailModal({
                    groupID: -1,
                    groupName: '',
                    groupCode: '',
                    accessLevel: 'st',
                    group_users: []
                });
                getClasses();
            })
            .catch((error) => {
                console.log('delete class code error: ', error);
            });
    };

    return (
        <>
            <h3>
                <Badge style={{ backgroundColor: 'cadetblue' }}>Your Profile</Badge>
            </h3>
            <Row>
                <Col xs='3'>
                    <Card
                        style={{
                            backgroundColor: 'lightblue',
                            height: '65vh',
                            overflowY: 'auto'
                        }}
                    >
                        <CardBody>
                            <h6>Username:</h6>
                            <Card>
                                <Row>
                                    <Col
                                        xs='9'
                                        style={{
                                            paddingLeft: '35px',
                                            paddingTop: '5px'
                                        }}
                                    >
                                        {props.username}
                                    </Col>
                                    <Col xs='3'>
                                        <Password userType='pf' email={props.email} editEmail={props.editEmail} />
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
                                            return (
                                                <ListGroupItem key={i}>
                                                    {item.groupName}
                                                    <Button
                                                        style={{
                                                            float: 'right',
                                                            backgroundColor: 'white',
                                                            border: 'none',
                                                            padding: '0'
                                                        }}
                                                        onClick={() => toggleClassDetailModal(item)}
                                                    >
                                                        <Image
                                                            src={moreImage}
                                                            alt='Icon made by xnimrodx from www.flaticon.com'
                                                            style={{
                                                                width: '24px',
                                                                height: '24px'
                                                            }}
                                                        />
                                                    </Button>
                                                </ListGroupItem>
                                            );
                                        })
                                    )}
                                </ListGroup>
                            </Card>

                            {classDetailModalOpen ? revealClassDetails() : null}

                            <Form onSubmit={(e) => createClass(e)}>
                                <h5 style={{ marginTop: '8px' }}>Create a New Class</h5>
                                <FormGroup>
                                    <Label for='className'>Class Name: </Label>
                                    <Input
                                        type='text'
                                        name='className'
                                        id='className'
                                        onChange={(e) => setClassName(e.target.value)}
                                        value={className}
                                    />
                                </FormGroup>
                                <Button block type='submit'>
                                    Create
                                </Button>
                            </Form>

                            <Form onSubmit={(e) => submitClassCode(e)}>
                                <h5 style={{ marginTop: '8px' }}>Join a New Class</h5>
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
