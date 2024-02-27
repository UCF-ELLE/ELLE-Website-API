import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';
import { Row, Col, Badge } from 'reactstrap';
import Manual from '../../Manual';
import ImportTerms from '../../ImportTerms';

export default function ModuleToolRow({
    curModule,
    updateCurrentModule,
    currentClass
}: {
    curModule: Module | undefined;
    updateCurrentModule: (module?: Module, task?: string) => void;
    currentClass: { value: number; label: string };
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    return (
        <Row style={{ marginBottom: '8px' }}>
            <Col>
                <Badge pill color='info' style={{ color: '#fff' }}>
                    Module ID: {curModule?.moduleID}
                </Badge>{' '}
                <Badge pill color='info' style={{ color: '#fff' }}>
                    Language: {curModule?.language}
                </Badge>
            </Col>
            {permissionLevel !== 'st' ? (
                <Col style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Manual />
                    <ImportTerms module={curModule} updateCurrentModule={updateCurrentModule} currentClass={currentClass} />
                </Col>
            ) : null}
        </Row>
    );
}
