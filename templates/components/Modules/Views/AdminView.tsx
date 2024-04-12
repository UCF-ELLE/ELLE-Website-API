import React, { useState } from 'react';
import { Card } from 'reactstrap';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import SplitDeckBtn from '../SplitDeckBtn';
import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';

export default function AdminView({
    currentClassView,
    modules,
    updateCurrentModule,
    deleteModule,
    editModule,
    unlinkModule
}: {
    currentClassView: number;
    modules: Module[];
    updateCurrentModule: (module?: Module, task?: string) => void;
    deleteModule: (moduleID: number) => void;
    editModule: (name: string, module: Module) => void;
    unlinkModule: (moduleID: number) => void;
}) {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState(0);

    return (
        <>
            <Nav>
                <NavItem>
                    <NavLink href='#' active={activeTab === 0} onClick={() => setActiveTab(0)}>
                        Own
                    </NavLink>
                </NavItem>
                <NavItem>
                    <NavLink href='#' active={activeTab === 1} onClick={() => setActiveTab(1)}>
                        Linked
                    </NavLink>
                </NavItem>
            </Nav>
            <TabContent activeTab={activeTab}>
                <TabPane tabId={0}>
                    <Card
                        color='info'
                        style={{
                            overflow: 'scroll',
                            height: '60vh',
                            borderTopLeftRadius: '0px'
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
                        color='info'
                        style={{
                            overflow: 'scroll',
                            height: '60vh',
                            borderTopLeftRadius: '0px'
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
