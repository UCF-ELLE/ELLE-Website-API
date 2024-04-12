import React, { useCallback, useEffect, useState } from 'react';
import {
    Container,
    Row,
    Col,
    Input,
    Button,
    Card,
    InputGroup,
    Modal,
    ModalHeader,
    ModalBody,
    CardHeader,
    Collapse,
    Nav,
    NavItem,
    NavLink,
    TabContent,
    TabPane
} from 'reactstrap';
import Select from 'react-select';
import axios from 'axios';

import Class from '@/components/ClassRoster/Class';
import Footer from '../components/Footer';
import Layout from '@/app/layout';
import { useUser } from '@/hooks/useUser';
import { GroupUser, UserGroup } from '@/types/api/group';
import Image from 'next/image';

import plusImage from '@/public/static/images/plus.png';
import searchImage from '@/public/static/images/search.png';

export default function ClassRoster() {
    const { user, loading } = useUser();
    const [groups, setGroups] = useState<UserGroup[]>([]);
    const [currentGroup, setCurrentGroup] = useState('st');
    const [search, setSearch] = useState('');
    const [elevateModalOpen, setElevateModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<{
        label: string;
        value: string;
    }>();
    const [selectedUser, setSelectedUser] = useState<{
        label: string;
        value: string;
    }>();
    const [collapseTab, setCollapseTab] = useState(-1);
    const [activeTab, setActiveTab] = useState('students');

    const getGroups = useCallback(() => {
        axios
            .get<UserGroup[]>('/elleapi/searchusergroups', {
                headers: { Authorization: 'Bearer ' + user?.jwt }
            })
            .then((res) => {
                setGroups(res.data);
            })
            .catch(function (error) {
                console.log(error);
            });
    }, [user?.jwt]);

    useEffect(() => {
        if (!loading && user) {
            getGroups();
        }
    }, [getGroups, loading, user]);

    const updateSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value.substring(0, 20));
    };

    const toggleElevateModal = () => {
        setElevateModalOpen(!elevateModalOpen);
    };

    const elevateUser = (group: string) => {
        const data = {
            userID: selectedUser?.value,
            accessLevel: group,
            groupID: selectedClass?.value
        };

        const headers = {
            Authorization: 'Bearer ' + user?.jwt
        };

        axios
            .post('/elleapi/elevateaccess', data, { headers: headers })
            .then((res) => {
                toggleElevateModal();
                getGroups();
            })
            .catch(function (error) {
                console.log(error);
            });
    };

    const renderUserTable = (group: string) => {
        let classes: {
            groupID: number;
            groupName: string;
            groupColor: string;
            group_users: GroupUser[];
        }[] = [];
        let students: {
            userID: number;
            username: string;
            groupID: number;
            groupName: string;
        }[] = [];
        let classOptions = groups.map((group) => {
            return { value: group.groupID.toString(), label: group.groupName };
        });
        let searchLength = 11;
        let addButton = (
            <Col sm={1} style={{ paddingLeft: '5px' }}>
                <Button style={{ borderRadius: '30px' }} onClick={() => toggleElevateModal()}>
                    <Image src={plusImage} alt='Icon made by srip from www.flaticon.com' style={{ width: '15px', height: '15px' }} />
                </Button>
            </Col>
        );

        let classColors = getColors();

        if (group === 'ta') {
            groups.map((group, i) => {
                classes.push({
                    groupID: group.groupID,
                    groupName: group.groupName,
                    groupColor: classColors[i],
                    group_users: group.group_users.filter((user) => {
                        return user.accessLevel === 'ta';
                    })
                });
            });
        } else {
            groups.map((group, i) => {
                classes.push({
                    groupID: group.groupID,
                    groupName: group.groupName,
                    groupColor: classColors[i],
                    group_users: group.group_users.filter((user) => {
                        return user.accessLevel === 'st';
                    })
                });
            });
            searchLength = 12;
            addButton = <></>;
        }

        if (currentGroup === 'ta') {
            groups.map((group) =>
                group.group_users.filter((user) =>
                    user.accessLevel === 'st'
                        ? students.push({
                              userID: user.userID,
                              username: user.username,
                              groupID: group.groupID,
                              groupName: group.groupName
                          })
                        : null
                )
            );
        }

        let filteredClass = classes.filter((group) => {
            return group.groupName.toLowerCase().indexOf(search.toLowerCase()) !== -1;
        });

        return (
            <>
                <Row>
                    <Col sm={searchLength}>
                        <InputGroup style={{ borderRadius: '8px' }}>
                            <div style={{ margin: '10px' }}>
                                <Image src={searchImage} alt='Icon made by Freepik from www.flaticon.com' style={{ width: '20px', height: '20px' }} />
                            </div>
                            <Input style={{ border: 'none' }} type='text' placeholder='Search for a class' value={search} onChange={updateSearch} />
                        </InputGroup>
                    </Col>
                    {addButton}
                </Row>
                <br />
                {filteredClass.map((group, i) => {
                    return (
                        <Card key={i} style={{ marginBottom: '1rem' }}>
                            <CardHeader onClick={(e) => toggleTab(e)} data-event={i} style={{ backgroundColor: group.groupColor }}>
                                {group.groupName}
                            </CardHeader>

                            <Collapse isOpen={collapseTab === i} style={{ border: 'none' }}>
                                <Class group={group} currentGroup={currentGroup} />
                            </Collapse>
                        </Card>
                    );
                })}
                <Modal isOpen={elevateModalOpen} toggle={() => toggleElevateModal()} backdrop={true}>
                    <ModalHeader toggle={() => toggleElevateModal()}>Modify Permission</ModalHeader>
                    <ModalBody>
                        Class:
                        <Select
                            name='class'
                            options={classOptions}
                            className='basic-single'
                            classNamePrefix='select'
                            isClearable={true}
                            value={selectedClass}
                            onChange={(change) => setSelectedClass(change || undefined)}
                        />
                        Select a student to promote them to TA privileges:
                        <Select
                            isDisabled={selectedClass === null ? true : false}
                            name='nonTAList'
                            options={
                                selectedClass === null
                                    ? []
                                    : students
                                          .filter((student) => student.groupID.toString() === selectedClass?.value)
                                          .map((user) => {
                                              return {
                                                  value: user.userID.toString(),
                                                  label: user.username
                                              };
                                          })
                            }
                            className='basic-single'
                            classNamePrefix='select'
                            isClearable={true}
                            value={selectedUser}
                            onChange={(change) => setSelectedUser(change || undefined)}
                        />
                        <br />
                        <Button block onClick={() => elevateUser('ta')}>
                            Elevate
                        </Button>
                    </ModalBody>
                </Modal>
            </>
        );
    };

    const toggleTab = (e: React.MouseEvent<HTMLElement>) => {
        let event = e.currentTarget.dataset.event;

        //if the accordion clicked on is equal to the current accordion that's open then close the current accordion,
        //else open the accordion you just clicked on
        setCollapseTab(collapseTab === Number(event) ? -1 : Number(event));
    };

    const getColors = () => {
        let possibleColors = ['#a5d5f6', 'cornflowerblue', '#57baca', '#48a5b7'];

        let colorList = [];
        let index = 0;

        for (let i = 0; i < groups.length; i++) {
            colorList.push(possibleColors[index]);

            index++;

            if (index >= possibleColors.length) {
                index = 0;
            }
        }

        return colorList;
    };

    const resetVal = (k: string) => {
        setActiveTab(k);
        let group = '';
        if (k === 'students') {
            group = 'st';
        } else if (k === 'tas') {
            group = 'ta';
        }
        setSearch('');
        setCurrentGroup(group);
    };

    return (
        <Layout requireUser>
            <div>
                <Container className='user-list mainContainer'>
                    <br></br>
                    <br></br>
                    <div>
                        <h3>Class Roster</h3>
                        <Nav id='userList'>
                            <Row>
                                <Col sm={4}>
                                    <Container className='userListTabs'>
                                        <NavItem>
                                            <NavLink
                                                active={activeTab === 'students'}
                                                onClick={() => resetVal('students')}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                Students
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink active={activeTab === 'tas'} onClick={() => resetVal('tas')} style={{ cursor: 'pointer' }}>
                                                TAs
                                            </NavLink>
                                        </NavItem>
                                    </Container>
                                </Col>
                                <Col sm={8}>
                                    <TabContent activeTab={activeTab}>
                                        <TabPane tabId={'students'}>{renderUserTable('st')}</TabPane>
                                        <TabPane tabId={'tas'}>{renderUserTable('ta')}</TabPane>
                                    </TabContent>
                                </Col>
                            </Row>
                        </Nav>
                    </div>
                </Container>
                <Footer></Footer>
            </div>
        </Layout>
    );
}
