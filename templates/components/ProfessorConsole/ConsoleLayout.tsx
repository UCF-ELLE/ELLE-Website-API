'use client';

import { useState } from 'react';
import { Link } from '@/components/Navigation/Link';
import { useRouter } from 'next/navigation';

interface ConsoleLayoutProps {
    children: React.ReactNode;
    activeSection?: 'overview' | 'classes' | 'modules' | 'lore' | 'messages';
}

export default function ConsoleLayout({ children, activeSection = 'overview' }: ConsoleLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const router = useRouter();

    const navItems = [
        { id: 'overview', label: 'Overview', href: '/prof' },
        { id: 'classes', label: 'Classes', href: '/prof/classes' },
        { id: 'modules', label: 'Modules', href: '/prof/modules' },
        { id: 'lore', label: 'Tito Lore', href: '/prof/lore' },
        { id: 'messages', label: 'Student Messages', href: '/prof/messages' },
    ];

    return (
        <div className="d-flex min-vh-100 bg-light">
            {/* Sidebar */}
            <aside
                className={`bg-dark text-white ${isSidebarOpen ? '' : 'd-none'}`}
                style={{ width: '250px', minHeight: '100vh' }}
            >
                <div className="p-3 border-bottom border-secondary">
                    <h5 className="mb-0">Professor Console</h5>
                </div>
                <nav className="nav flex-column p-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`nav-link text-white px-3 py-2 rounded ${
                                activeSection === item.id ? 'bg-primary' : 'hover:bg-secondary'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-grow-1">
                {/* Header */}
                <header className="bg-white border-bottom p-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <button
                            className="btn btn-outline-secondary d-lg-none"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            ☰
                        </button>
                        <div className="ms-auto">
                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => router.push('/profile')}
                            >
                                Back to Profile
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="p-4">{children}</main>
            </div>
        </div>
    );
}
