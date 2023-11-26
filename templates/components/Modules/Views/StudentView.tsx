import React from 'react';
import { Card } from 'reactstrap';
import SplitDeckBtn from '../SplitDeckBtn';

type ModuleType = {
    moduleID: number;
    name: string;
    language: string;
    complexity: number;
    groupID: number[];
    userID: number;
};

type EventType = {
    module: ModuleType;
    task?: string;
};

export default function StudentView({
    modules,
    updateCurrentModule,
}: {
    modules: ModuleType[];
    updateCurrentModule: (event: EventType) => void;
}) {
    return (
        <Card color="info" style={{ overflow: 'scroll', height: '60vh' }}>
            {modules.map((deck, i) => (
                <SplitDeckBtn
                    key={i}
                    currentModule={deck}
                    updateCurrentModule={updateCurrentModule}
                />
            ))}
        </Card>
    );
}
