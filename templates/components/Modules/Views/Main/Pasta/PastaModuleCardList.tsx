import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Table } from 'reactstrap';
import { Pasta as PastaType, QuestionFrame as QuestionFrameType } from '@/types/api/pastagame';
import QuestionFrame from './QuestionFrame';
import axios from 'axios';
import Pasta from './Pasta';

export default function PastaModuleCardList({
    type,
    questionFrames,
    currentClass,
    curModule,
    updateCurrentModule
}: {
    type: string;
    questionFrames: QuestionFrameType[];
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (module?: Module, task?: string) => void;
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;
    const [pastas, setPastas] = useState<PastaType[]>([]);

    const getAllPastas = useCallback(() => {
        if (type === 'pastas' && user && curModule.moduleID) {
            const config = {
                headers: {
                    Authorization: `Bearer ${user?.jwt}`
                },
                params: {
                    moduleID: curModule.moduleID
                }
            };

            axios
                .get(`/elleapi/pastagame/pasta/all`, config)
                .then((response) => {
                    console.log(response.data);
                    setPastas(response.data);
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }, [curModule.moduleID, type, user]);

    useEffect(() => {
        getAllPastas();
    }, [getAllPastas]);

    const HeadRow = useMemo(() => {
        switch (type) {
            case 'questionFrames':
                return (
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Display In Game</th>
                            <th style={{ width: '20%' }}>Category</th>
                            <th style={{ width: '40%' }}>Split Question</th>
                            {permissionLevel !== 'st' ? <th style={{ width: '10%' }}> </th> : null}
                        </tr>
                    </thead>
                );
            case 'pastas':
                return (
                    <thead>
                        <tr>
                            <th style={{ width: '30%' }}>Utterance</th>
                            <th style={{ width: '30%' }}>Category</th>
                            <th style={{ width: '30%' }}>Split Question Answer</th>
                            {permissionLevel !== 'st' ? <th style={{ width: '10%' }}> </th> : null}
                        </tr>
                    </thead>
                );
            default:
                return <></>;
        }
    }, [permissionLevel, type]);

    return (
        <>
            {type === 'questionFrames' && (
                <QuestionFrameCardList
                    questionFrames={questionFrames}
                    currentClass={currentClass}
                    curModule={curModule}
                    updateCurrentModule={updateCurrentModule}
                    HeadRow={HeadRow}
                />
            )}
            {type === 'pastas' && (
                <PastaCardList
                    pastas={pastas}
                    questionFrames={questionFrames}
                    currentClass={currentClass}
                    curModule={curModule}
                    reloadPastas={getAllPastas}
                    HeadRow={HeadRow}
                />
            )}
        </>
    );
}

function QuestionFrameCardList({
    questionFrames,
    currentClass,
    curModule,
    updateCurrentModule,
    HeadRow
}: {
    questionFrames: QuestionFrameType[];
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (module?: Module, task?: string) => void;
    HeadRow: JSX.Element;
}) {
    return (
        <div>
            {questionFrames.length === 0 ? (
                <Alert> There are currently no question frames in this module. </Alert>
            ) : (
                <Table hover className='tableList'>
                    {HeadRow}
                    <tbody>
                        {questionFrames.map((questionFrame) => {
                            return (
                                <QuestionFrame
                                    key={questionFrame.qframeID}
                                    questionFrame={questionFrame}
                                    currentClass={currentClass}
                                    updateCurrentModule={updateCurrentModule}
                                    curModule={curModule}
                                />
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </div>
    );
}

function PastaCardList({
    pastas,
    questionFrames,
    currentClass,
    curModule,
    reloadPastas,
    HeadRow
}: {
    pastas: PastaType[];
    questionFrames: QuestionFrameType[];
    currentClass: { value: number; label: string };
    curModule: Module;
    reloadPastas: () => void;
    HeadRow: JSX.Element;
}) {
    return (
        <div>
            {pastas.length === 0 ? (
                <Alert> There are currently no pastas in this module. </Alert>
            ) : (
                <Table hover className='tableList'>
                    {HeadRow}
                    <tbody>
                        {pastas.map((pasta) => {
                            return (
                                <Pasta
                                    key={pasta.pastaID}
                                    pasta={pasta}
                                    questionFrames={questionFrames}
                                    currentClass={currentClass}
                                    reloadPastas={reloadPastas}
                                    curModule={curModule}
                                />
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </div>
    );
}
