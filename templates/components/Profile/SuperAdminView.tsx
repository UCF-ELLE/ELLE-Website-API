import React, { ChangeEvent } from 'react';
import { Row, Col } from 'reactstrap';
import '@/public/css/superadmin.css'
import PlatformStats from '../Stats/PlatformStats';
import ModuleStats from '../Stats/ModuleStats';
import TagStats from '../Stats/TagStats';
import Password from './Password'

export default function SuperAdminView({username, email, editEmail}: { username: string; email: string; editEmail: (e: ChangeEvent<HTMLInputElement>) => void }) {
        return (     
            <div className="suContainer">
                <Row className="Top Row">
                    <Col className="Left Column" xs="3">
                        <Row>
                            <Col>
                                <div className="greetingsTag">
                                    Welcome back {username}!
                                    <Password userType="su" email={email} editEmail={editEmail}/>
                                </div>
                            </Col>
                        </Row>
                        <br />
                        <Row>
                            <Col>
                                <TagStats/>
                            </Col>
                        </Row>
                    </Col>
                
                    <Col className="Right Column">
                        <Row>
                            <PlatformStats/>
                        </Row>
                    </Col>
                </Row>

                <br />

                <Row className="Bottom Row">
                    <ModuleStats/>
                </Row>
            </div>
        );
    }
