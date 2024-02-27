import React, { useState } from 'react';
import { Row, Col, Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import axios from 'axios';

import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/ionicons/css/ionicons.min.css';
import Layout from '@/app/layout';
import { useUser } from '@/hooks/useUser';

export default function GameCode() {
    const { user } = useUser();
    const [modalOpen, setModalOpen] = useState(false);
    const [OTC, setOTC] = useState('');

    const toggleModal = () => {
        setModalOpen(!modalOpen);

        if (!modalOpen) {
            generateOTC();
        }
    };

    const generateOTC = () => {
        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .get('/elleapi/generateotc', header)
            .then((res) => {
                setOTC(res.data.otc);
            })
            .catch((error) => {
                console.log('OTC error: ', error);
            });
    };

    return (
        <Layout requireUser>
            <div className='mainDiv'>
                <Row>
                    <Col
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            zIndex: '1',
                            position: 'relative',
                            top: '300px'
                        }}
                    >
                        <Button className='gameCodeBtn' id='gameCodeBtn' onClick={() => toggleModal()}>
                            Generate Code
                        </Button>
                    </Col>
                    <video width='100%' height='100%' style={{ marginTop: '-40px' }} autoPlay loop muted>
                        <source src={'/static/videos/ELLE_blocks.mp4'} type='video/mp4' />
                    </video>
                </Row>

                <Modal isOpen={modalOpen} toggle={() => toggleModal()}>
                    <ModalHeader toggle={() => toggleModal()}>Your OTC</ModalHeader>
                    <ModalBody>
                        <p
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                fontSize: 'xx-large',
                                fontWeight: '600'
                            }}
                        >
                            {OTC}
                        </p>
                    </ModalBody>
                </Modal>
            </div>
        </Layout>
    );
}
