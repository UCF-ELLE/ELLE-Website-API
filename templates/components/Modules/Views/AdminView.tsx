import React, { useState } from 'react';
import { Card } from 'reactstrap';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import SplitDeckBtn from '../SplitDeckBtn';
import { useUser } from '@/hooks/useUser';

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

export default function AdminView({
    currentClassView,
    modules,
    updateCurrentModule,
    deleteModule,
    editModule,
    unlinkModule,
}: {
    currentClassView: number;
    modules: ModuleType[];
    updateCurrentModule: (event: EventType) => void;
    deleteModule: (moduleID: number) => void;
    editModule: (name: string, event: EventType) => void;
    unlinkModule: (moduleID: number) => void;
}) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState(0);

    return (
        <>
            <Nav>
                <NavItem>
                    <NavLink
                        href="#"
                        active={activeTab === 0}
                        onClick={() => setActiveTab(0)}
                    >
                        Own
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink
                        href="#"
                        active={activeTab === 1}
                        onClick={() => setActiveTab(1)}
                    >
                        Linked
                    </NavLink>
                </NavItem>
            </Nav>
            <TabContent activeTab={activeTab}>
                <TabPane tabId={0}>
                    <Card
                        color="info"
                        style={{
                            overflow: 'scroll',
                            height: '60vh',
                            borderTopLeftRadius: '0px',
                        }}
                    >
                        {modules
                            .filter((module) => module.userID === user?.userID)
                            .map((deck, i) => (
                                <SplitDeckBtn
                                    key={i}
                                    currentModule={deck}
                                    updateCurrentModule={updateCurrentModule}
                                    deleteModule={deleteModule}
                                    editModule={editModule}
                                />
                            ))}
                    </Card>
                </TabPane>
                <TabPane tabId={1}>
                    <Card
                        color="info"
                        style={{
                            overflow: 'scroll',
                            height: '60vh',
                            borderTopLeftRadius: '0px',
                        }}
                    >
                        {modules
                            .filter((module) => module.userID !== user?.userID)
                            .map((deck, i) => (
                                <SplitDeckBtn
                                    key={i}
                                    currentClassView={currentClassView}
                                    currentModule={deck}
                                    updateCurrentModule={updateCurrentModule}
                                    deleteModule={deleteModule}
                                    editModule={editModule}
                                    unlinkModule={unlinkModule}
                                />
                            ))}
                    </Card>
                </TabPane>
            </TabContent>
        </>
    );
}
