import axios from 'axios';
import { UserGroup } from '@/types/api/group';
import { useUser } from '@/hooks/useAuth';
import React, { useEffect, useState } from 'react';
import { Label, Input, Row, Col } from 'reactstrap';
import ModuleRow from './ModuleRow';

type ClassDetailsProps = {
    item: UserGroup;
    editClass: boolean;
    handleOnEditName: (e: React.ChangeEvent<HTMLInputElement>) => void;
    generateNewCode: any;
};

export default function ClassDetailsComponent(props: ClassDetailsProps) {
    const [name, setName] = useState(props.item.groupName);
    const [listModules, setListModules] = useState([])
    const [size, setSize] = useState(0);
    const { user } = useUser();

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.name === 'name') setName(e.target.value);
        else setSize(e.currentTarget.valueAsNumber);

        props.handleOnEditName(e);
    };

    // Grab a list of all modules associated with the class
    const getModules = () => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
            params: { groupID: props.item.groupID }
        };

        axios
            .get('/elleapi/getgroupmodules', header)
            .then((res) => {
                setListModules(res.data)
            })
            .catch((error) => {
                console.log('Error grabbing the classes modules: ', error);
            });
    };

    useEffect(() => {
        if (user?.jwt) {
            console.log(props.item.groupID)

            let header = {
                headers: { Authorization: 'Bearer ' + user?.jwt },
                params: { groupID: props.item.groupID }
            };
    
            axios
                .get('/elleapi/getgroupmodules', header)
                .then((res) => {
                    setListModules(res.data)
                })
                .catch((error) => {
                    console.log('Error grabbing the classes modules: ', error);
                });
        };
    }, [props.item.groupID, user?.jwt])

    const removeModule = (moduleID: number) => {
        const headers = { Authorization: 'Bearer ' + user?.jwt }
        const params = { groupID: props.item.groupID, moduleID: moduleID };

        axios
            .post('/elleapi/removemodulefromgroup', params, { headers })
            .then((res) => {
                getModules()
            })
            .catch((error) => {
                console.log('Error removing module from class: ', error);
            });
    };

    return (
        <>
            <Row>
                <Col style={{ paddingLeft: '30px' }}>
                    <Label>Class Name: </Label>{' '}
                    <Input
                        name='name'
                        disabled={props.editClass ? false : true}
                        style={{
                            marginBottom: '10px',
                            cursor: props.editClass ? 'default' : 'not-allowed'
                        }}
                        value={name}
                        onChange={handleOnChange}
                    />
                </Col>
            </Row>
            <Row>
                <Col style={{ paddingLeft: '30px' }}>
                    <Label>Class Code: </Label> {props.item.groupCode}
                </Col>
                <Col>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
                        Need a new class code? Click{' '}
                        <a
                            style={{
                                textDecoration: 'underline',
                                color: 'blue',
                                cursor: 'default'
                            }}
                            onClick={() => props.generateNewCode()}
                        >
                            here
                        </a>
                        .
                    </p>
                </Col>
            </Row>
            <Row>
                <Col style={{ paddingLeft: '30px' }}>
                    <Label>Class Size: </Label> {props.item.group_users !== undefined ? props.item.group_users.length - 1 : null}
                </Col>
            </Row>

            <Label style={{ paddingTop: '30px', paddingLeft: '5px'}}>Linked Modules:</Label>
            <table style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#9ED3E1', marginTop: '10px', overflow: 'hidden' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Module Name</th>
                        <th style={{ padding: '10px', textAlign: 'center', width: '50px' }}>Action</th>
                    </tr>    
                </thead>
                <tbody>
                    {listModules.map((module, i) => {
                        return  <ModuleRow key={i} module={module} onUnlink={removeModule} />
                    })}
                </tbody>
            </table>
        </>
    );
}