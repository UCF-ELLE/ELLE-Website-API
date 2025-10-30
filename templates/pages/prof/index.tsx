'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useAuth';
import { hasConsoleAccess } from '@/lib/rbac';
import { apiClient } from '@/lib/apiClient';
import { Card, CardBody, CardTitle, CardText } from 'reactstrap';
import ConsoleTabs from '@/components/ProfessorConsole/ConsoleTabs';

export default function ProfessorConsolePage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalModules: 0,
        totalLore: 0,
    });

    useEffect(() => {
        if (!loading && !hasConsoleAccess(user?.permissionGroup)) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (hasConsoleAccess(user?.permissionGroup)) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        let totalClasses = 0;
        let totalModules = 0;
        let totalLore = 0;
        
        try {
            // Fetch all classes the user has access to
            const classesData = await apiClient.get<any[]>('/searchusergroups');
            totalClasses = Array.isArray(classesData) ? classesData.length : 0;
        } catch (err) {
            console.error('Failed to fetch classes:', err);
        }
        
        try {
            // Fetch modules
            const modulesData = await apiClient.get<any[]>('/retrievemodules');
            totalModules = Array.isArray(modulesData) ? modulesData.length : 0;
        } catch (err) {
            console.error('Failed to fetch modules:', err);
        }
        
        try {
            // Fetch lore
            const loreData = await apiClient.get<{ loreData?: any[] }>('/twt/professor/fetchOwnedTitoLore');
            totalLore = (loreData.loreData || []).length;
        } catch (err) {
            // User has no lore, which is fine - set to 0
            console.log('No lore found (this is normal if none created yet)');
            totalLore = 0;
        }
        
        setStats({
            totalClasses,
            totalModules,
            totalLore,
        });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!hasConsoleAccess(user?.permissionGroup)) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger">
                    <h4>Access Denied</h4>
                    <p>You do not have permission to access the Professor Console.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            <ConsoleTabs activeTab="overview" />

            <h2 className="mb-4">Welcome to Professor Console</h2>

            {/* Quick Stats */}
                <div className="row mb-4">
                    <div className="col-md-3">
                        <Card className="border-primary">
                            <CardBody>
                                <CardTitle tag="h6" className="text-muted">
                                    Total Classes
                                </CardTitle>
                                <CardText className="h3">{stats.totalClasses}</CardText>
                            </CardBody>
                        </Card>
                    </div>
                    <div className="col-md-3">
                        <Card className="border-info">
                            <CardBody>
                                <CardTitle tag="h6" className="text-muted">
                                    Total Modules
                                </CardTitle>
                                <CardText className="h3">{stats.totalModules}</CardText>
                            </CardBody>
                        </Card>
                    </div>
                    <div className="col-md-3">
                        <Card className="border-success">
                            <CardBody>
                                <CardTitle tag="h6" className="text-muted">
                                    Tito Lore Items
                                </CardTitle>
                                <CardText className="h3">{stats.totalLore}</CardText>
                            </CardBody>
                        </Card>
                    </div>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardBody>
                        <CardTitle tag="h5">Quick Actions</CardTitle>
                        <div className="d-flex gap-2 flex-wrap">
                            <button
                                className="btn btn-success"
                                onClick={() => router.push('/prof/lore?action=create')}
                            >
                                Create Lore
                            </button>
                            <button
                                className="btn btn-info"
                                onClick={() => router.push('/prof/classes')}
                            >
                                Manage Classes
                            </button>
                            <button
                                className="btn btn-warning"
                                onClick={() => router.push('/prof/messages')}
                            >
                                View Messages
                            </button>
                        </div>
                    </CardBody>
                </Card>
        </div>
    );
}
