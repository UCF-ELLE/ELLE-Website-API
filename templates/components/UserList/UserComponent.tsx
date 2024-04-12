import React, { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, Table, Card, CardBody, Row, Col, Input, Alert } from 'reactstrap';
import axios from 'axios';
import { User } from '@/types/api/user';
import { PermissionGroup } from '@/types/misc';
import { useUser } from '@/hooks/useUser';
import Image from 'next/image';
import moreImage from '@/public/static/images/more.png';
import shuffleImage from '@/public/static/images/shuffle.png';
import { GroupUser } from '@/types/api/group';

export default function UserComponent({
    user,
    type,
    group,
    getUsers
}: {
    user: User | GroupUser;
    type: string;
    group?: PermissionGroup;
    getUsers?: () => void;
}) {
    const { user: currentUser } = useUser();
    const [pfDetailModalOpen, setPfDetailModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [tempPW, setTempPW] = useState('');
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMsg, setAlertMsg] = useState('');

    const toggleDetailModal = () => {
        setDetailModalOpen(!detailModalOpen);
        setAlertOpen(false);
        setAlertMsg('');
    };

    const toggleProfessorDetailModal = () => {
        setPfDetailModalOpen(!pfDetailModalOpen);
    };

    const renderUserInfo = () => {
        return (
            <Card style={{ margin: '0 20px 0 20px', border: 'none' }}>
                <Row>ID: {user.userID}</Row>
                <Row>Name: {user.username}</Row>
                <Row>Permission Level: {'permissionGroup' in user ? user.permissionGroup : user.accessLevel}</Row>
                <Row style={{ paddingTop: '10px' }}>
                    Reset Password:
                    <Col xs='7' style={{ paddingRight: '0px' }}>
                        <Input placeholder='Create a temporary password' name='tempPW' value={tempPW} onChange={(e) => setTempPW(e.target.value)} />
                    </Col>
                    <Col xs='1' style={{ padding: '0 0 0 10px' }}>
                        <Button onClick={() => resetPassword()}>Reset</Button>
                    </Col>
                </Row>
            </Card>
        );
    };

    const generateNewCode = (id: number) => {
        let header = {
            headers: { Authorization: 'Bearer ' + currentUser?.jwt },
            params: { groupID: id }
        };

        axios
            .get('/elleapi/generategroupcode', header)
            .then((res) => {
                getUsers && getUsers();
            })
            .catch((error) => {
                console.log('ERROR in generating new group code: ', error);
            });
    };

    const resetPassword = () => {
        let header = {
            headers: { Authorization: 'Bearer ' + currentUser?.jwt }
        };

        let data = {
            userID: user.userID,
            password: tempPW
        };

        axios
            .post('/elleapi/changepassword', data, header)
            .then((res) => {
                setTempPW('');
                setAlertOpen(true);
                setAlertMsg('Successful Reset');
            })
            .catch((error) => {
                console.log('ERROR in changing password: ', error.response);
            });
    };

    return (
        <>
            <tr>
                <td>{user.userID}</td>
                <td>{user.username}</td>
                {type === 'pf' || group === 'st' || group === 'su' ? (
                    <td style={{ paddingLeft: '24%' }}>
                        <Button
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                padding: '0px'
                            }}
                            onClick={() => toggleDetailModal()}
                        >
                            <Image src={moreImage} alt='Icon made by xnimrodx from www.flaticon.com' style={{ width: '20px', height: '20px' }} />
                        </Button>
                    </td>
                ) : null}

                {group === 'pf' ? (
                    <td style={{ paddingLeft: '24%' }}>
                        <Button
                            style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                padding: '0px'
                            }}
                            onClick={() => toggleProfessorDetailModal()}
                        >
                            <Image src={moreImage} alt='Icon made by xnimrodx from www.flaticon.com' style={{ width: '20px', height: '20px' }} />
                        </Button>
                    </td>
                ) : null}
            </tr>

            <Modal isOpen={detailModalOpen}>
                <ModalHeader toggle={() => toggleDetailModal()}>Details</ModalHeader>
                <ModalBody>
                    {alertOpen ? <Alert>{alertMsg}</Alert> : null}
                    {renderUserInfo()}
                </ModalBody>
            </Modal>

            <Modal isOpen={pfDetailModalOpen}>
                <ModalHeader toggle={() => toggleProfessorDetailModal()}>Professor Details</ModalHeader>
                <ModalBody style={{ paddingBottom: '10px' }}>
                    {renderUserInfo()}
                    <br />
                    {group === 'pf' ? (
                        (user as User).groups?.length !== 0 ? (
                            <>
                                <Row>
                                    <Col style={{ paddingLeft: '20px' }}>Class Info: </Col>
                                </Row>
                                <Card
                                    style={{
                                        height: '40vh',
                                        overflow: 'scroll'
                                    }}
                                >
                                    <Table className='professorDetailsTable'>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Class</th>
                                                <th>Code</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(user as User).groups?.map((group, i) => {
                                                return (
                                                    <tr key={i}>
                                                        <td>{group.groupID}</td>
                                                        <td>{group.groupName}</td>
                                                        <td>{group.groupCode}</td>
                                                        <td>
                                                            <Image
                                                                src={shuffleImage}
                                                                alt='Icon made by Freepik from www.flaticon.com'
                                                                style={{
                                                                    width: '15px',
                                                                    height: '15px',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => generateNewCode(group.groupID)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </Card>
                                <p
                                    style={{
                                        margin: '10px 0 0 0',
                                        float: 'right',
                                        fontSize: '12px'
                                    }}
                                >
                                    Use{' '}
                                    <Image
                                        src={shuffleImage}
                                        alt='Icon made by Freepik from www.flaticon.com'
                                        style={{
                                            width: '10px',
                                            height: '10px'
                                        }}
                                    />{' '}
                                    to generate a new class code.
                                </p>
                            </>
                        ) : (
                            <Card style={{ alignItems: 'center' }}>{user.username} currently does not have any classes.</Card>
                        )
                    ) : null}
                </ModalBody>
            </Modal>
        </>
    );
}
