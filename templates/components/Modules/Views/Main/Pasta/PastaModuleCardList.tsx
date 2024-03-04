import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';
import { Pasta as PastaType, QuestionFrame as QuestionFrameType } from '@/types/api/pastagame';
import { useContext, useMemo } from 'react';
import { Alert, Table } from 'reactstrap';
import Pasta from './Pasta';
import QuestionFrame from './QuestionFrame';
import { PastaContext } from '@/hooks/usePasta';

export default function PastaModuleCardList({ type, curModule }: { type: string; curModule: Module }) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;
    const { questionFrames, pastas } = useContext(PastaContext);

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
            {type === 'questionFrames' && <QuestionFrameCardList questionFrames={questionFrames} curModule={curModule} HeadRow={HeadRow} />}
            {type === 'pastas' && <PastaCardList pastas={pastas || []} questionFrames={questionFrames} curModule={curModule} HeadRow={HeadRow} />}
        </>
    );
}

function QuestionFrameCardList({
    questionFrames,
    curModule,
    HeadRow
}: {
    questionFrames: QuestionFrameType[];
    curModule: Module;
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
                            return <QuestionFrame key={questionFrame.qframeID} questionFrame={questionFrame} curModule={curModule} />;
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
    curModule,
    HeadRow
}: {
    pastas: PastaType[];
    questionFrames: QuestionFrameType[];
    curModule: Module;
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
                            return <Pasta key={pasta.pastaID} pasta={pasta} questionFrames={questionFrames} curModule={curModule} />;
                        })}
                    </tbody>
                </Table>
            )}
        </div>
    );
}
