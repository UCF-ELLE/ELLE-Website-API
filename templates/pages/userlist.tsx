import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import {
    Container,
    Table,
    Row,
    Col,
    Input,
    Button,
    InputGroup,
    Modal,
    ModalHeader,
    ModalBody,
    Card,
    CardBody,
    Nav,
    TabContent,
    TabPane,
    NavItem,
    NavLink
} from 'reactstrap';
import axios from 'axios';
import '@/public/static/css/style.css';

import UserComponent from '@/components/UserList/UserComponent';
import { User } from '@/types/api/user';
import Spinner from '../components/Loading/Spinner';
import { useUser } from '@/hooks/useUser';
import Layout from '@/app/layout';
import useAxios from 'axios-hooks';
import { PermissionGroup } from '@/types/misc';
import Image from 'next/image';

import searchImage from '@/public/static/images/search.png';
import plusImage from '@/public/static/images/plus.png';
import exclamationImage from '@/public/static/images/exclamation.png';
import Select from 'react-select';

export default function UserList({}: {}) {
    const { user, loading: userLoading } = useUser();
    const permission = user?.permissionGroup;
    const [currentGroup, setCurrentGroup] = useState<string>('su');
    const [selectedUser, setSelectedUser] = useState<{
        label: string;
        value: string;
    }>();
    const [users, setUsers] = useState<User[]>([]);
    const [superAdmins, setSuperAdmins] = useState<User[]>([]);
    const [professors, setProfessors] = useState<User[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [search, setSearch] = useState<string>('');
    const [elevateModalOpen, setElevateModalOpen] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState('superAdmins');

    const [{ data: response, loading, error }, refetchUsers] = useAxios<User[]>(
        {
            url: '/elleapi/users',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + user?.jwt
            }
        },
        { manual: true }
    );

    const getUsers = () => {
        refetchUsers().then((response) => {
            const data = response.data;
            let su = data.filter((user) => user.permissionGroup === 'su');
            let pf = data.filter((user) => user.permissionGroup === 'pf');
            let st = data.filter((user) => user.permissionGroup === 'st');

            setUsers(data);
            setSuperAdmins(su);
            setProfessors(pf);
            setStudents(st);
        });
    };

    useEffect(() => {
        if (!userLoading && user?.jwt) {
            refetchUsers().then((response) => {
                const data = response.data;
                let su = data.filter((user) => user.permissionGroup === 'su');
                let pf = data.filter((user) => user.permissionGroup === 'pf');
                let st = data.filter((user) => user.permissionGroup === 'st');

                console.log(data, su, pf, st);

                setUsers(data);
                setSuperAdmins(su);
                setProfessors(pf);
                setStudents(st);
            });
        }
    }, [refetchUsers, user?.jwt, userLoading]);

    const updateSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value.substring(0, 20));
    };

    const elevateUser = (group: PermissionGroup) => {
        const data = {
            userID: selectedUser?.value,
            accessLevel: group
        };

        const headers = {
            Authorization: 'Bearer ' + user?.jwt
        };

        axios
            .post('/elleapi/elevateaccess', data, { headers: headers })
            .then((res) => {
                toggleElevateModal();
                getUsers();
            })
            .catch(function (error) {
                console.log(error);
            });
    };

    const renderUserTable = (group: PermissionGroup) => {
        let userList;
        let filteredUsers;
        let nonAdminList: { label: string; value: string }[] = [];
        let searchLength = 11;
        let addButton = (
            <Button
                style={{
                    display: 'flex',
                    borderRadius: '30px',
                    width: 44.5,
                    justifyContent: 'center',
                    alignItems: 'center',
                    alignSelf: 'center'
                }}
                onClick={() => toggleElevateModal()}
            >
                <Image src={plusImage} alt='Icon made by srip from www.flaticon.com' style={{ width: '15px', height: '15px' }} />
            </Button>
        );
        if (group === 'su') {
            userList = superAdmins;
        } else if (group === 'pf') {
            userList = professors;
        } else {
            userList = students;
            searchLength = 12;
            addButton = <></>;
        }

        if (currentGroup === 'su' && students && superAdmins) {
            let list = students.concat(professors);
            nonAdminList = list.map((user) => {
                return { value: user.userID.toString(), label: user.username };
            });
        } else if (currentGroup === 'pf') {
            nonAdminList = students.map((user) => {
                return { value: user.userID.toString(), label: user.username };
            });
        }

        if (userList) {
            filteredUsers = userList.filter((user) => {
                if (user) return user.username.toLowerCase().indexOf(search.toLowerCase()) !== -1;
                else return null;
            });
        }

        return (
            <>
                <Row style={{ display: 'flex' }}>
                    <Col sm={searchLength}>
                        <InputGroup style={{ borderRadius: '8px' }}>
                            <div style={{ margin: '10px' }}>
                                <Image src={searchImage} alt='Icon made by Freepik from www.flaticon.com' style={{ width: '20px', height: '20px' }} />
                            </div>
                            <Input style={{ border: 'none' }} type='text' placeholder='Search' value={search} onChange={updateSearch} />
                        </InputGroup>
                    </Col>
                    {addButton}
                </Row>
                <br />

                {students && professors && superAdmins ? (
                    userList.length !== 0 ? (
                        <Table hover className='userListTable'>
                            <thead>
                                <tr>
                                    <th style={{ borderTopLeftRadius: '8px' }}>ID</th>
                                    <th>Username</th>
                                    <th style={{ borderTopRightRadius: '8px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers ? (
                                    filteredUsers.map((user) => {
                                        return <UserComponent key={user.userID} user={user} type='su' group={group} getUsers={getUsers} />;
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3}>{search} cannot be found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    ) : (
                        <Card>
                            <CardBody>
                                <Row>
                                    <Col xs='1'>
                                        <Image
                                            style={{
                                                width: '25px',
                                                height: '25px'
                                            }}
                                            alt={'exclamation'}
                                            src={exclamationImage}
                                        />
                                    </Col>
                                    <Col xs='10' style={{ padding: '0px' }}>
                                        {group === 'su'
                                            ? 'There are no other super admins.'
                                            : group === 'pf'
                                            ? 'There are currently no professors.'
                                            : 'There are currently no students.'}
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    )
                ) : (
                    <Spinner chart={'userList'} />
                )}
                <Modal isOpen={elevateModalOpen} toggle={() => toggleElevateModal()} backdrop={true}>
                    <ModalHeader toggle={() => toggleElevateModal()}>Modify Permission</ModalHeader>
                    <ModalBody>
                        Select a user to promote them to {currentGroup === 'su' ? 'super admin' : 'professor'} privileges:
                        <Select
                            name='nonAdminList'
                            options={nonAdminList}
                            className='basic-single'
                            classNamePrefix='select'
                            isClearable={true}
                            value={selectedUser}
                            onChange={(e) => {
                                setSelectedUser({
                                    label: e?.label as string,
                                    value: e?.value as string
                                });
                            }}
                        />
                        <br />
                        <Button block onClick={() => elevateUser(currentGroup as PermissionGroup)}>
                            Elevate
                        </Button>
                    </ModalBody>
                </Modal>
            </>
        );
    };

    const resetVal = (k: string) => {
        setActiveTab(k);
        let group = '';
        if (k === 'superAdmins') {
            group = 'su';
        } else if (k === 'professors') {
            group = 'pf';
        } else {
            group = 'st';
        }

        setSearch('');
        setCurrentGroup(group);
    };

    const toggleElevateModal = () => {
        setElevateModalOpen(!elevateModalOpen);
    };

    return (
        <Layout requireUser>
            <div>
                <Container className='user-list mainContainer'>
                    <br></br>
                    <br></br>
                    <div>
                        <h3>List of Users</h3>
                        <Nav justified pills id='userList'>
                            <Row style={{ width: '100%' }}>
                                <Col sm={4}>
                                    <Container className='userListTabs'>
                                        <NavItem>
                                            <NavLink
                                                active={activeTab === 'superAdmins'}
                                                onClick={() => resetVal('superAdmins')}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                Super Admins
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                active={activeTab === 'professors'}
                                                onClick={() => resetVal('professors')}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                Professors
                                            </NavLink>
                                        </NavItem>
                                        <NavItem>
                                            <NavLink
                                                active={activeTab === 'students'}
                                                onClick={() => resetVal('students')}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                Students
                                            </NavLink>
                                        </NavItem>
                                    </Container>
                                </Col>
                                <Col sm={8}>
                                    <TabContent activeTab={activeTab}>
                                        <TabPane tabId={'superAdmins'}>{renderUserTable('su')}</TabPane>
                                        <TabPane tabId={'professors'}>{renderUserTable('pf')}</TabPane>
                                        <TabPane tabId={'students'}>{renderUserTable('st')}</TabPane>
                                    </TabContent>
                                </Col>
                            </Row>
                        </Nav>
                    </div>
                </Container>
            </div>
        </Layout>
    );
}
