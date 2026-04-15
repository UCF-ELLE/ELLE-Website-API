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
    TabPane,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from 'reactstrap';
import axios from 'axios';
import Password from './Password';
import ModulePerformance from '../Stats/ModulePerformance';
import TermPerformance from '../Stats/TermPerformance';
import { useUser } from '@/hooks/useAuth';
import { UserGroup } from '@/types/api/group';

type StudentViewProps = {
    email?: string;
    username: string;
    editEmail: (e: ChangeEvent<HTMLInputElement>) => void;
};

export default function StudentView(props: StudentViewProps) {
    const [classes, setClasses] = useState<UserGroup[]>([]);
    const [classCode, setClassCode] = useState('');
    const [friends, setFriends] = useState<any[]>([]);
    const [friendUsername, setFriendUsername] = useState('');
    const [friendRequestMessage, setFriendRequestMessage] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [activeMainTab, setActiveMainTab] = useState('Profile');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const { user } = useUser();

    const toggleModal = () => setModalOpen(!modalOpen);

    const openActionModal = (username: string) => {
        setSelectedUser(username);
        toggleModal();
    };

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

    const submitFriendRequest = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFriendRequestMessage('');

        let data = {
            target_username: friendUsername,
            action: 'send' 
        };

        const headers = {
            Authorization: 'Bearer ' + user?.jwt
        };

        axios
            .post('/elleapi/friendship', data, { headers: headers }) 
            .then((res) => {
                setFriendUsername('');
                setFriendRequestMessage('Request sent');
                getFriends(); 
            })
            .catch((error) => {
                console.log(error.response);
                if (friendUsername === props.username || error.response?.status === 400) {
                    setFriendRequestMessage('Unable to add yourself as a friend');
                } else {
                    setFriendRequestMessage('Unable to send request to this user');
                }
            });
    };

    const getFriends = useCallback(() => {
        axios.get('/elleapi/friendship', {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        })
        .then(res => setFriends(res.data))
        .catch(err => console.log(err.response));
    }, [user?.jwt]);

    const handleFriendAction = (targetUsername: string, action: 'send' | 'decline') => {
        axios.post('/elleapi/friendship', 
            { target_username: targetUsername, action: action }, 
            { headers: { Authorization: 'Bearer ' + user?.jwt }}
        )
        .then(() => {
            getFriends();
            setModalOpen(false);
        })
        .catch(err => {
            console.log(err.response)
            setModalOpen(false);
        });
    };

    const handleUnsend = (targetUsername: string) => {
        axios.put('/elleapi/friendship',
            { target_username: targetUsername },
            { headers: { Authorization: 'Bearer ' + user?.jwt } }
        )
        .then(() => {
            getFriends();
            setModalOpen(false);
        })
        .catch((err) => {
            console.log(err.response);
            setModalOpen(false);
        });
    };

    useEffect(() => {
        if (user?.jwt) getFriends();
    }, [getFriends, user?.jwt]);

    useEffect(() => {
        if (activeMainTab === 'Profile') {
            setActiveTab(0);
        } else if (activeMainTab === 'Friends') {
            setActiveTab(2);
        }
    }, [activeMainTab]);

    return (
        <>
            <Modal isOpen={modalOpen} toggle={toggleModal}>
                <ModalHeader toggle={toggleModal}>Friendship Action</ModalHeader>
                <ModalBody>
                    Do you want to allow this user to send friend requests again in the future? 
                    If not, select <strong>Block</strong> and they will be unable to send you further requests. To undo this action, send them a new friend request. 
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggleModal}>Cancel</Button>
                    <Button color="danger" onClick={() => handleFriendAction(selectedUser, 'decline')}>Block</Button>
                    <Button color="primary" onClick={() => handleUnsend(selectedUser)}>Allow</Button>
                </ModalFooter>
            </Modal>
            <Nav tabs>
                <NavItem>
                    <NavLink href='#' active={activeMainTab === 'Profile'} onClick={() => setActiveMainTab('Profile')}>
                        Your Profile
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink href='#' active={activeMainTab === 'Friends'} onClick={() => setActiveMainTab('Friends')}>
                        Friends
                    </NavLink>
                </NavItem>
            </Nav>
            <Row>
                <Col xs='3'>
                    <Card style={{ backgroundColor: 'lightblue', height: '65vh' }}> 
                        {activeMainTab === 'Profile' && (
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
                        )}
                        {activeMainTab === 'Friends' && (
                            <CardBody>
                                <Form onSubmit={(e) => submitFriendRequest(e)}>
                                    <h4 style={{ marginTop: '8px' }}>Add a Friend</h4>
                                    <FormGroup>
                                        <Label for='friendUsername'>Enter Username: </Label>
                                        <Input
                                            type='text'
                                            name='friendUsername'
                                            id='friendUsername'
                                            onChange={(e) => setFriendUsername(e.target.value)}
                                            value={friendUsername}
                                        />
                                    </FormGroup>
                                    <Button block type='submit'>
                                        Send Request
                                    </Button>
                                    {friendRequestMessage && (
                                        <div style={{ marginTop: '10px', fontSize: '0.9rem', textAlign: 'center' }}>
                                            {friendRequestMessage}
                                        </div>
                                    )}
                                </Form>
                            </CardBody>
                        )}
                    </Card>
                </Col>

                <Col xs='9'>
                    <Card style={{ backgroundColor: 'cadetblue', height: '65vh' }}>
                        {activeMainTab === 'Profile' && (
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
                        )}
                        {activeMainTab === 'Friends' && (
                            <CardBody style={{ color: '#04354b' }}>
                                <h1>Your Friends</h1>
                                <Row>
                                    <Col>
                                        <Nav tabs>
                                            <NavItem>
                                                <NavLink href='#' active={activeTab === 2} onClick={() => setActiveTab(2)}>
                                                    Friends
                                                </NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink href='#' active={activeTab === 3} onClick={() => setActiveTab(3)}>
                                                    Requests
                                                </NavLink>
                                            </NavItem>
                                            <NavItem>
                                                <NavLink href='#' active={activeTab === 4} onClick={() => setActiveTab(4)}>
                                                    Blocked Users
                                                </NavLink>
                                            </NavItem>
                                        </Nav>
                                        <TabContent activeTab={activeTab}>
                                            <TabPane tabId={2}>
                                                <div style={{ paddingTop: '1px' }}>
                                                    <ListGroup flush style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                                                        {Array.isArray(friends) && friends.filter(f => f?.type === 'friend').length > 0 ? (
                                                            friends.filter(f => f.type === 'friend').map((friend, i) => (
                                                                <ListGroupItem key={i} className="d-flex justify-content-between align-items-center">
                                                                    <span style={{ color: 'black' }}>{friend.username}</span>
                                                                    <Button color="danger" size="sm" onClick={() => openActionModal(friend.username)}>
                                                                        Unfriend
                                                                    </Button>
                                                                </ListGroupItem>
                                                            ))
                                                        ) : (
                                                            <ListGroupItem>No friends added yet.</ListGroupItem>
                                                        )}
                                                    </ListGroup>
                                                </div>
                                            </TabPane>
                                            <TabPane tabId={3}>
                                                <div style={{ padding: '10px' }}>
                                                    <h6>Incoming Requests</h6>
                                                    <ListGroup flush className="mb-3">
                                                        {Array.isArray(friends) && friends.filter(f => f?.type === 'request_received').map((req, i) => (
                                                            <ListGroupItem key={i} className="d-flex justify-content-between align-items-center">
                                                                <span style={{ color: 'black' }}>{req.username}</span>
                                                                <div>
                                                                    <Button color="success" size="sm" className="mr-2" style={{ marginRight: '10px' }} onClick={() => handleFriendAction(req.username, 'send')}>
                                                                        Accept
                                                                    </Button>
                                                                    <Button color="danger" size="sm" onClick={() => openActionModal(req.username)}>
                                                                        Deny
                                                                    </Button>
                                                                </div>
                                                            </ListGroupItem>
                                                        ))}
                                                    </ListGroup>

                                                    <h6>Outgoing Requests</h6>
                                                    <ListGroup flush>
                                                        {Array.isArray(friends) && friends.filter(f => f?.type === 'request_sent').map((req, i) => (
                                                            <ListGroupItem key={i} className="d-flex justify-content-between align-items-center">
                                                                <span style={{ color: 'black' }}>{req.username}</span>
                                                                <div>
                                                                    <Button color="danger" size="sm" onClick={() => handleUnsend(req.username)}>
                                                                        Unsend
                                                                    </Button>
                                                                </div>
                                                            </ListGroupItem>
                                                        ))}
                                                    </ListGroup>
                                                </div>
                                            </TabPane>
                                            <TabPane tabId={4}>
                                            {/*

                                            */}
                                                <div style={{ paddingTop: '1px' }}>
                                                    <ListGroup flush style={{ maxHeight: '40vh', overflowY: 'auto' }}>
                                                        {Array.isArray(friends) && friends.filter(f => f?.type === 'ignored_user').length > 0 ? (
                                                            friends.filter(f => f.type === 'ignored_user').map((friend, i) => (
                                                                <ListGroupItem key={i} className="d-flex justify-content-between align-items-center">
                                                                    <span style={{ color: 'black' }}>{friend.username}</span>
                                                                    <div>
                                                                        <Button color="primary" size="sm" className="mr-2" style={{ marginRight: '10px' }} onClick={() => handleUnsend(friend.username)}>
                                                                            Unblock
                                                                        </Button>
                                                                    </div>
                                                                </ListGroupItem>
                                                            ))
                                                        ) : (
                                                            <ListGroupItem>No users blocked yet.</ListGroupItem>
                                                        )}
                                                    </ListGroup>
                                                </div>
                                            </TabPane>
                                        </TabContent>
                                    </Col>
                                </Row>
                            </CardBody>
                        )}
                    </Card>
                </Col>
            </Row>
        </>
    );
}
