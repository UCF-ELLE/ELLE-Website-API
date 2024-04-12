import { UserGroup } from '@/types/api/group';
import React, { useState } from 'react';
import { Label, Input, Row, Col } from 'reactstrap';

type ClassDetailsProps = {
    item: UserGroup;
    editClass: boolean;
    handleOnEditName: (e: React.ChangeEvent<HTMLInputElement>) => void;
    generateNewCode: any;
};

export default function ClassDetailsComponent(props: ClassDetailsProps) {
    const [name, setName] = useState(props.item.groupName);
    const [size, setSize] = useState(0);

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.name === 'name') setName(e.target.value);
        else setSize(e.currentTarget.valueAsNumber);

        props.handleOnEditName(e);
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
        </>
    );
}
