import React from 'react';
import { Card } from 'reactstrap';
import SplitDeckBtn from '../SplitDeckBtn';
import { Module } from '@/types/api/modules';

export default function StudentView({
    modules,
    updateCurrentModule
}: {
    modules: Module[];
    updateCurrentModule: (module?: Module, task?: string) => void;
}) {
    return (
        <Card color='info' style={{ overflow: 'scroll', height: '60vh' }}>
            {modules.map((deck, i) => (
                <SplitDeckBtn key={i} currentModule={deck} updateCurrentModule={updateCurrentModule} />
            ))}
        </Card>
    );
}
