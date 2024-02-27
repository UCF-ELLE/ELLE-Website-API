import React, { useState } from 'react';
import { Button, FormGroup, Input } from 'reactstrap';
import { Card, Label, Modal, ModalHeader, ModalBody, ModalFooter, Table, Row, Col, Badge, Alert, Tooltip } from 'reactstrap';
import { useCSVReader } from 'react-papaparse';
import axios from 'axios';

import TermFields from '@/components/Modules/TermFields';
import { Module } from '@/types/api/modules';
import { Term } from '@/types/api/terms';
import { useUser } from '@/hooks/useUser';

import uploadCSVImage from '@/public/static/images/uploadCSV.png';
import importImage from '@/public/static/images/import.png';
import Image from 'next/image';

type ImportTermsTerm = Omit<Term, 'termID'> & {
    selected: boolean;
};

export default function ImportTerms({
    module,
    updateCurrentModule,
    currentClass
}: {
    module?: Module;
    updateCurrentModule: (module?: Module, task?: string) => void;
    currentClass: { value: number; label: string };
}) {
    const { CSVReader } = useCSVReader();
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    const [error, setError] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [terms, setTerms] = useState<ImportTermsTerm[]>([]);

    const handleOnFileLoad = (data: any) => {
        if (data.length < 2) {
            console.log("Provided CSV doesn't contain header");
        }

        for (let i = 0; i < data[0]['data'].length; i++) {
            data[0]['data'][i] = data[0]['data'][i].toLocaleLowerCase();
        }
        const frontIndex = data[0]['data'].indexOf('front');
        const backIndex = data[0]['data'].indexOf('back');
        const typeIndex = data[0]['data'].indexOf('type');
        const genderIndex = data[0]['data'].indexOf('gender');

        const listTerms: ImportTermsTerm[] = [];
        for (let i = 1; i < data.length; i++) {
            const formData: ImportTermsTerm = {
                front: data[i]['data'][frontIndex] === '' ? null : data[i]['data'][frontIndex],
                back: data[i]['data'][backIndex] === '' ? null : data[i]['data'][backIndex],
                type: data[i]['data'][typeIndex] === '' ? '' : data[i]['data'][typeIndex],
                gender: data[i]['data'][genderIndex] === '' ? null : data[i]['data'][genderIndex],
                selected: true
            };

            if (formData['front'] !== null && formData['back'] !== null) listTerms.push(formData);
        }

        setTerms(listTerms);
    };

    const toggleModal = () => {
        setModalOpen(!modalOpen);
        setTerms([]);
    };

    const uploadTerms = () => {
        let listTerms = terms.filter((term) => term.selected === true);
        let failure = false;

        if (listTerms.length === 0) return;

        for (const item of listTerms) {
            if (item.front?.length !== 0 && item.back?.length !== 0) {
                const data = new FormData();
                data.append('front', item.front || '');
                data.append('back', item.back || '');
                data.append('language', module?.language || '');
                data.append('type', item.type || '');
                data.append('gender', item.gender || '');
                data.append('moduleID', module?.moduleID.toString() || '');

                //TODO: need to append groupID if the user is a ta
                if (permissionLevel === 'ta') {
                    data.append('groupID', currentClass.value.toString());
                }

                const config = {
                    method: 'post',
                    url: '/elleapi/term',
                    headers: {
                        Authorization: 'Bearer ' + user?.jwt
                    },
                    data: data
                };

                axios(config)
                    .then((res) => {
                        updateCurrentModule(module);
                    })
                    .catch((error) => {
                        console.log(error);
                        if (error.response) {
                            setError(true);
                            failure = true;
                        }
                    });
            }
        }

        if (!failure) {
            toggleModal();
        }
    };

    const handleOnError = (err: string, file: string, inputElem: string, reason: string) => {
        console.log(err, file, inputElem, reason);
    };

    const handleOnCheck = (ind: number) => {
        let tempList = terms;
        let tempTerm = terms[ind];

        tempList[ind] = {
            front: tempTerm.front,
            back: tempTerm.back,
            type: tempTerm.type,
            gender: tempTerm.gender,
            selected: !tempTerm.selected
        };

        setTerms(tempList);
    };

    const handleOnSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        let tempList = [];

        tempList = terms.map((term) => {
            return {
                front: term.front,
                back: term.back,
                type: term.type,
                gender: term.gender,
                selected: e.target.checked
            };
        });

        setTerms(tempList);
    };

    const handleOnFieldChange = (ind: number, term: ImportTermsTerm) => {
        let tempList = terms;

        tempList[ind] = {
            front: term.front,
            back: term.back,
            type: term.type,
            gender: term.gender,
            selected: terms[ind].selected
        };

        setTerms(tempList);
    };

    const toggleTooltip = () => {
        setTooltipOpen(!tooltipOpen);
    };

    return (
        <>
            <Modal isOpen={modalOpen} toggle={() => toggleModal()}>
                <ModalHeader style={{ paddingBottom: '0px', border: 'none' }} toggle={() => toggleModal()}>
                    Mass Import Terms
                    <Row>
                        <Col>
                            <Badge>Module Name: {module?.name}</Badge>
                        </Col>
                        <Col>
                            <Badge> Module Language: {module?.language}</Badge>
                        </Col>
                    </Row>
                </ModalHeader>
                <ModalBody>
                    <CSVReader onUploadAccepted={handleOnFileLoad}>
                        {({ getRootProps, acceptedFile, ProgressBar, getRemoveFileProps }: any) => (
                            <div style={{ marginBottom: '10px' }}>
                                <Button
                                    id='fileUploader'
                                    {...getRootProps}
                                    style={{
                                        padding: '5px',
                                        border: 'none',
                                        backgroundColor: 'cadetblue'
                                    }}
                                >
                                    <Image
                                        src={uploadCSVImage}
                                        alt='Icon made by Smashicons from www.flaticon.com'
                                        style={{
                                            width: '25px',
                                            height: '25px',
                                            marginRight: '5px'
                                        }}
                                    />
                                    Upload
                                </Button>
                                <Label style={{ margin: '10px' }}>{acceptedFile && acceptedFile.name}</Label>
                            </div>
                        )}
                    </CSVReader>

                    {error ? <Alert color='danger'>Failure to add terms.</Alert> : null}

                    <Card
                        style={{
                            marginTop: '15px',
                            height: '40vh',
                            overflow: 'scroll'
                        }}
                    >
                        {terms.length !== 0 ? (
                            <Table hover className='minimalisticTable'>
                                <thead>
                                    <tr>
                                        <th style={{ zIndex: '1' }}>
                                            <FormGroup check style={{ margin: '0px' }}>
                                                <Input
                                                    type='checkbox'
                                                    checked={terms.find((term) => term.selected === false) ? false : true}
                                                    onChange={(e) => handleOnSelectAll(e)}
                                                />
                                            </FormGroup>
                                        </th>
                                        <th>Front</th>
                                        <th>Back</th>
                                        <th>Type</th>
                                        <th>Gender</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {terms.map((term, i) => {
                                        return (
                                            <tr key={i}>
                                                <td
                                                    style={{
                                                        paddingTop: '20px'
                                                    }}
                                                >
                                                    <FormGroup
                                                        check
                                                        style={{
                                                            margin: '0px'
                                                        }}
                                                    >
                                                        <Input type='checkbox' checked={term.selected} onChange={() => handleOnCheck(i)} />
                                                    </FormGroup>
                                                </td>
                                                <TermFields term={term} index={i} handleOnFieldChange={handleOnFieldChange} />
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        ) : (
                            <p
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                No terms could be found at the moment.
                            </p>
                        )}
                    </Card>
                </ModalBody>
                <ModalFooter style={{ display: 'inline' }}>
                    <Row>
                        <Col style={{ padding: '5px 15px 0 0' }}>
                            <p style={{ margin: '0px 15px' }}>
                                Need the template? Click{' '}
                                <a
                                    style={{
                                        textDecoration: 'underline',
                                        color: 'blue'
                                    }}
                                    href={'/static/csv/Template.csv'}
                                    download='template.csv'
                                >
                                    here
                                </a>{' '}
                                to download.
                            </p>
                        </Col>
                        <Col xs='3' style={{ paddingLeft: '30px' }}>
                            <Button
                                style={{
                                    padding: '5px',
                                    border: 'none',
                                    backgroundColor: 'cadetblue'
                                }}
                                onClick={() => uploadTerms()}
                            >
                                <Image
                                    src={importImage}
                                    alt='Icon made by Smashicons from www.flaticon.com'
                                    style={{
                                        width: '25px',
                                        height: '25px',
                                        marginRight: '5px'
                                    }}
                                />
                                Import
                            </Button>
                        </Col>
                    </Row>
                </ModalFooter>
            </Modal>

            <Button id='importBtn' onClick={() => toggleModal()} size='sm' style={{ border: 'none', backgroundColor: '#5faeb4' }}>
                <Image src={importImage} alt='Icon made by Smashicons from www.flaticon.com' style={{ width: '25px', height: '25px' }} />
            </Button>

            <Tooltip placement='right' isOpen={tooltipOpen} target='importBtn' toggle={() => toggleTooltip()}>
                Mass Import
            </Tooltip>
        </>
    );
}
