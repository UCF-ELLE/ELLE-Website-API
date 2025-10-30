'use client';

import { Nav, NavItem, NavLink } from 'reactstrap';
import { useRouter } from 'next/navigation';

interface ConsoleTabsProps {
    activeTab: 'overview' | 'classes' | 'modules' | 'lore' | 'messages';
}

export default function ConsoleTabs({ activeTab }: ConsoleTabsProps) {
    const router = useRouter();

    const tabs = [
        { id: 'overview', label: 'Overview', href: '/prof' },
        { id: 'classes', label: 'Classes', href: '/prof/classes' },
        { id: 'modules', label: 'Modules', href: '/prof/modules' },
        { id: 'lore', label: 'Tito Lore', href: '/prof/lore' },
        { id: 'messages', label: 'Student Messages', href: '/prof/messages' },
    ];

    return (
        <Nav tabs className="mb-4">
            {tabs.map((tab) => (
                <NavItem key={tab.id}>
                    <NavLink
                        active={activeTab === tab.id}
                        onClick={() => router.push(tab.href)}
                        style={{ cursor: 'pointer' }}
                    >
                        {tab.label}
                    </NavLink>
                </NavItem>
            ))}
        </Nav>
    );
}
