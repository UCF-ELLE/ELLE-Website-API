'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useUser } from '@/hooks/useAuth';
import { hasConsoleAccess } from '@/lib/rbac';
import { apiClient } from '@/lib/apiClient';
import { ModuleItem, GenerateModuleParams } from '@/types/professorConsole';
import {
    Card,
    CardBody,
    CardTitle,
    Table,
    Badge,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    FormGroup,
    Label,
    Input,
} from 'reactstrap';
import ConsoleTabs from '@/components/ProfessorConsole/ConsoleTabs';

export default function ModulesPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [loadingModules, setLoadingModules] = useState(false);
    const [moduleClassMap, setModuleClassMap] = useState<Record<number, number[]>>({});
    const [moduleActiveStatus, setModuleActiveStatus] = useState<Record<number, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Status Update Modal (for Tito-enabled modules only)
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedModule, setSelectedModule] = useState<ModuleItem | null>(null);
    
    // Assign Class Modal
    const [showAssignClassModal, setShowAssignClassModal] = useState(false);
    const [assignClassId, setAssignClassId] = useState<number>(0);
    const [assignSequence, setAssignSequence] = useState<number>(1);
    const [availableClasses, setAvailableClasses] = useState<Array<{groupID: number, groupName: string}>>([]);
    
    // Remove from Class Modal
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [moduleToRemove, setModuleToRemove] = useState<ModuleItem | null>(null);

    useEffect(() => {
        if (!loading && !hasConsoleAccess(user?.permissionGroup)) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (hasConsoleAccess(user?.permissionGroup) && !loadingModules) {
            fetchModules();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchModules = async () => {
        // Prevent concurrent fetches
        if (loadingModules) {
            console.log('[Modules] Already loading, skipping fetch');
            return;
        }
        
        try {
            setLoadingModules(true);
            setError(null);
            console.log('[Modules] Starting fetch...');
            
            // Fetch all modules from backend
            const data = await apiClient.get<any>('/retrievemodules');
            const modulesArray = Array.isArray(data) ? data : (data.data || []);
            
            // Fetch Tito-enabled classes from backend
            const classesResponse = await apiClient.get<any>('/twt/session/classes?classType=all');
            const titoClassesData = classesResponse?.data || [];
            
            // Build set of Tito class IDs
            const titoClassIds = new Set<number>();
            titoClassesData.forEach((tc: any) => {
                const classId = tc.classID || tc;
                if (classId) titoClassIds.add(classId);
            });
            
            // Fetch modules for each Tito class to build accurate mappings
            // Support modules being in multiple classes
            const classMap: Record<number, number[]> = {};
            const titoModuleSet = new Set<number>();
            
            // Convert Set to Array for iteration
            for (const classId of Array.from(titoClassIds)) {
                try {
                    const groupModules = await apiClient.get<any>(`/getgroupmodules?groupID=${classId}`);
                    const modules = Array.isArray(groupModules) ? groupModules : [];
                    
                    modules.forEach((m: any) => {
                        const moduleId = m.moduleID || m.module_id;
                        if (moduleId) {
                            // Map module to multiple classes
                            if (!classMap[moduleId]) {
                                classMap[moduleId] = [];
                            }
                            classMap[moduleId].push(classId);
                            // Mark as Tito-enabled since it's in a Tito class
                            titoModuleSet.add(moduleId);
                        }
                    });
                } catch (err) {
                    console.error(`Failed to fetch modules for Tito class ${classId}:`, err);
                }
            }
            
            setModuleClassMap(classMap);
            
            // Load active status from localStorage (this is UI-only state)
            const savedActiveStatus = localStorage.getItem('moduleActiveStatus');
            if (savedActiveStatus) {
                try {
                    setModuleActiveStatus(JSON.parse(savedActiveStatus));
                } catch (e) {
                    console.error('Failed to parse active status');
                }
            }
            
            // Transform the data to match our interface
            // Create one entry per module-class combination
            const transformedModules: ModuleItem[] = [];
            
            modulesArray.forEach((m: any) => {
                const moduleId = m.moduleID || m.module_id;
                const classIds = classMap[moduleId] || [];
                
                if (classIds.length > 0) {
                    // Create an entry for each class this module is in
                    classIds.forEach(classId => {
                        transformedModules.push({
                            moduleID: moduleId,
                            name: m.name || m.moduleName || m.module_name || `Module ${moduleId}`,
                            classID: classId,
                            className: m.className || m.class_name,
                            status: m.status || 'draft',
                            isTitoEnabled: titoModuleSet.has(moduleId),
                        });
                    });
                } else {
                    // Module not in any Tito class - add to "Unassigned"
                    transformedModules.push({
                        moduleID: moduleId,
                        name: m.name || m.moduleName || m.module_name || `Module ${moduleId}`,
                        classID: null,
                        className: m.className || m.class_name,
                        status: m.status || 'draft',
                        isTitoEnabled: false,
                    });
                }
            });
            
            setModules(transformedModules);
        } catch (err) {
            console.error('Fetch modules error:', err);
            // If it's a parsing error, set empty modules instead of showing error
            if (err instanceof Error && err.message.includes('JSON')) {
                setModules([]);
                setError('No modules found or error loading modules');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to fetch modules');
            }
        } finally {
            setLoadingModules(false);
        }
    };

    const handleToggleTitoStatus = async () => {
        if (!selectedModule || !selectedModule.classID) return;

        try {
            // Send as form data
            const formData = new FormData();
            formData.append('moduleID', selectedModule.moduleID.toString());
            formData.append('classID', selectedModule.classID.toString());
            formData.append('isStatusUpdate', 'true');

            await fetch('/elleapi/twt/professor/updateModule', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                },
                body: formData,
            });
            
            // Update the active status in state immediately
            const newActiveStatus = { ...moduleActiveStatus };
            // If undefined, default to true (active), then toggle
            const currentStatus = newActiveStatus[selectedModule.moduleID] ?? true;
            newActiveStatus[selectedModule.moduleID] = !currentStatus;
            setModuleActiveStatus(newActiveStatus);
            localStorage.setItem('moduleActiveStatus', JSON.stringify(newActiveStatus));
            
            console.log('Toggled module', selectedModule.moduleID, 'from', currentStatus, 'to', !currentStatus);
            
            setSuccess('Module status toggled successfully!');
            setShowStatusModal(false);
            setSelectedModule(null);
            fetchModules();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle Tito status');
        }
    };

    const fetchAvailableClasses = async () => {
        try {
            const groupsData = await apiClient.get<any>('/searchusergroups');
            const groups = Array.isArray(groupsData) ? groupsData : [];
            setAvailableClasses(groups.map((g: any) => ({
                groupID: g.groupID,
                groupName: g.groupName || `Class ${g.groupID}`,
            })));
        } catch (err) {
            console.error('Failed to fetch classes:', err);
        }
    };
    
    const handleAssignClass = async () => {
        if (!selectedModule || !assignClassId) {
            setError('Please select a class');
            return;
        }

        try {
            // Calculate next sequence number (count of modules already in this class + 1)
            const modulesInClass = modules.filter(m => m.classID === assignClassId);
            const nextSequence = modulesInClass.length + 1;
            
            // Step 1: Link module to class
            const data = {
                moduleID: selectedModule.moduleID,
                groupID: assignClassId
            };

            let header = {
                headers: { Authorization: 'Bearer ' + user?.jwt }
            };

            const linkResponse = await axios.post('/elleapi/addmoduletogroup', data, header);
            
            // Step 2: Enable Tito for this module-class pair with sequence
            const titoFormData = new FormData();
            titoFormData.append('moduleID', selectedModule.moduleID.toString());
            titoFormData.append('classID', assignClassId.toString());
            titoFormData.append('sequenceID', nextSequence.toString());

            await fetch('/elleapi/twt/professor/addModule', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.jwt}`,
                },
                body: titoFormData,
            }).catch(() => {
                // Silently fail if Tito is already enabled
            });
            
            // Update the class mapping - add this class to the module's list
            const newMap = { ...moduleClassMap };
            if (!newMap[selectedModule.moduleID]) {
                newMap[selectedModule.moduleID] = [];
            }
            if (!newMap[selectedModule.moduleID].includes(assignClassId)) {
                newMap[selectedModule.moduleID] = [...newMap[selectedModule.moduleID], assignClassId];
            }
            setModuleClassMap(newMap);
            
            // Set initial active status to true (active)
            const newActiveStatus = { ...moduleActiveStatus, [selectedModule.moduleID]: true };
            setModuleActiveStatus(newActiveStatus);
            localStorage.setItem('moduleActiveStatus', JSON.stringify(newActiveStatus));
            
            setSuccess('Module assigned to class and Tito enabled!');
            setShowAssignClassModal(false);
            setSelectedModule(null);
            setAssignClassId(0);
            setAssignSequence(1);
            fetchModules();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign module');
        }
    };
    
    const handleRemoveFromClass = async () => {
        if (!moduleToRemove || !moduleToRemove.classID) return;
        
        try {
            // Use the removemodulefromgroup endpoint
            await apiClient.post('/removemodulefromgroup', {
                moduleID: moduleToRemove.moduleID,
                groupID: moduleToRemove.classID,
            });
            
            // Remove this class from the module's class list
            const newMap = { ...moduleClassMap };
            if (newMap[moduleToRemove.moduleID]) {
                newMap[moduleToRemove.moduleID] = newMap[moduleToRemove.moduleID].filter(
                    (cid: number) => cid !== moduleToRemove.classID
                );
                // If no classes left, remove the entry
                if (newMap[moduleToRemove.moduleID].length === 0) {
                    delete newMap[moduleToRemove.moduleID];
                }
            }
            setModuleClassMap(newMap);
            
            // Remove active status
            const newActiveStatus = { ...moduleActiveStatus };
            delete newActiveStatus[moduleToRemove.moduleID];
            setModuleActiveStatus(newActiveStatus);
            localStorage.setItem('moduleActiveStatus', JSON.stringify(newActiveStatus));
            
            setSuccess('Module removed from class successfully!');
            setShowRemoveModal(false);
            setModuleToRemove(null);
            fetchModules();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove module from class');
            setShowRemoveModal(false);
        }
    };

    const groupedModules = modules.reduce((acc, module) => {
        const key = module.classID ? `Class ${module.classID}` : 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(module);
        return acc;
    }, {} as Record<string, ModuleItem[]>);
    
    const hasClassID = (groupName: string) => groupName !== 'Unassigned';

    if (loading || !hasConsoleAccess(user?.permissionGroup)) {
        return null;
    }

    return (
        <div className="container-fluid py-4">
            <ConsoleTabs activeTab="modules" />

            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Modules Management</h2>
                    <button className="btn btn-outline-primary" onClick={fetchModules}>
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        {success}
                        <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
                    </div>
                )}

                {loadingModules ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : Object.keys(groupedModules).length === 0 ? (
                    <Card>
                        <CardBody>
                            <p className="text-muted text-center py-4">No modules found.</p>
                        </CardBody>
                    </Card>
                ) : (
                    Object.entries(groupedModules).map(([groupName, groupModules]) => (
                        <Card key={groupName} className="mb-3">
                            <CardBody>
                                <CardTitle tag="h5">{groupName}</CardTitle>
                                <Table hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Module ID</th>
                                            <th>Name</th>
                                            <th>Tito Enabled</th>
                                            <th>Active Status</th>
                                            <th>Actions</th>
                                            {hasClassID(groupName) && <th>Remove</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupModules.map((module, index) => (
                                            <tr key={module.moduleID}>
                                                <td>{module.moduleID}</td>
                                                <td>{module.name}</td>
                                                <td>
                                                    <Badge color={module.isTitoEnabled ? 'success' : 'secondary'}>
                                                        {module.isTitoEnabled ? 'Yes' : 'No'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {module.isTitoEnabled ? (
                                                        <Badge color={(moduleActiveStatus[module.moduleID] ?? true) ? 'success' : 'warning'}>
                                                            {(moduleActiveStatus[module.moduleID] ?? true) ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted">N/A</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        <button
                                                            className="btn btn-success"
                                                            onClick={async () => {
                                                                setSelectedModule(module);
                                                                setAssignClassId(module.classID || 0);
                                                                await fetchAvailableClasses();
                                                                setShowAssignClassModal(true);
                                                            }}
                                                        >
                                                            Assign Class
                                                        </button>
                                                        {module.isTitoEnabled && (
                                                            <button
                                                                className="btn btn-warning"
                                                                onClick={() => {
                                                                    setSelectedModule(module);
                                                                    setShowStatusModal(true);
                                                                }}
                                                            >
                                                                Toggle Active/Inactive
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                {hasClassID(groupName) && (
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => {
                                                                setModuleToRemove(module);
                                                                setShowRemoveModal(true);
                                                            }}
                                                        >
                                                            Remove from Class
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    ))
                )}
            </div>

            {/* Toggle Active/Inactive Modal */}
            <Modal isOpen={showStatusModal} toggle={() => setShowStatusModal(false)}>
                <ModalHeader toggle={() => setShowStatusModal(false)}>Toggle Module Active/Inactive Status</ModalHeader>
                <ModalBody>
                    <p>
                        This will toggle the module status between <strong>active</strong> and <strong>inactive</strong>.
                    </p>
                    <p className="text-muted">
                        Active modules are available for students to access. Inactive modules are hidden.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowStatusModal(false)}>
                        Cancel
                    </Button>
                    <Button color="warning" onClick={handleToggleTitoStatus}>
                        Toggle Status
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Remove from Class Modal */}
            <Modal isOpen={showRemoveModal} toggle={() => setShowRemoveModal(false)}>
                <ModalHeader toggle={() => setShowRemoveModal(false)}>Remove Module from Class</ModalHeader>
                <ModalBody>
                    <p>Are you sure you want to remove <strong>{moduleToRemove?.name}</strong> from this class?</p>
                    <p className="text-muted">
                        This will unassign the module from the class. Students in this class will no longer have access to it.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowRemoveModal(false)}>
                        Cancel
                    </Button>
                    <Button color="danger" onClick={handleRemoveFromClass}>
                        Remove from Class
                    </Button>
                </ModalFooter>
            </Modal>
            
            {/* Assign Class Modal */}
            <Modal isOpen={showAssignClassModal} toggle={() => setShowAssignClassModal(false)}>
                <ModalHeader toggle={() => setShowAssignClassModal(false)}>Assign Module to Class</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="assignClassID">Select Class *</Label>
                        <Input
                            id="assignClassID"
                            type="select"
                            value={assignClassId || ''}
                            onChange={(e) => setAssignClassId(parseInt(e.target.value) || 0)}
                        >
                            <option value="">-- Select a Class --</option>
                            {availableClasses.map((cls) => (
                                <option key={cls.groupID} value={cls.groupID}>
                                    {cls.groupName} (ID: {cls.groupID})
                                </option>
                            ))}
                        </Input>
                    </FormGroup>
                    <p className="text-muted">
                        <small>Sequence order will be automatically assigned based on current modules in the class.</small>
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowAssignClassModal(false)}>
                        Cancel
                    </Button>
                    <Button color="primary" onClick={handleAssignClass}>
                        Assign
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
