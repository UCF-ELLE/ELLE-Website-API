'use client';
//check this file's button logic with the original one i provide you make sure its the same logic as the original one and if not change it to be the same as the original one

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    InputGroup,
    InputGroupText,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
} from 'reactstrap';

import ConsoleTabs from '@/components/ProfessorConsole/ConsoleTabs';

type FilterOption = 'all' | 'active' | 'inactive' | 'titoEnabled';

export default function ModulesPage() {
    const { user, loading } = useUser();
    const router = useRouter();

    const [modules, setModules] = useState<ModuleItem[]>([]);
    const [loadingModules, setLoadingModules] = useState(false);
    const [moduleClassMap, setModuleClassMap] = useState<Record<number, number[]>>({});
    const [moduleActiveStatus, setModuleActiveStatus] = useState<Record<number, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Search & filter (new UI)
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');

    // Status Update Modal
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedModule, setSelectedModule] = useState<ModuleItem | null>(null);

    // Assign Class Modal
    const [showAssignClassModal, setShowAssignClassModal] = useState(false);
    const [assignClassId, setAssignClassId] = useState<number>(0);
    const [assignSequence, setAssignSequence] = useState<number>(1);
    const [availableClasses, setAvailableClasses] = useState<Array<{ groupID: number; groupName: string }>>([]);

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

    // ── Backend logic from doc 2 ──────────────────────────────────────────────

    const fetchModules = async () => {
        if (loadingModules) return;

        try {
            setLoadingModules(true);
            setError(null);

            const data = await apiClient.get<any>('/retrievemodules');
            const modulesArray = Array.isArray(data) ? data : (data.data || []);

            const classesResponse = await apiClient.get<any>('/twt/session/classes?classType=all');
            const titoClassesData = classesResponse?.data || [];

            const titoClassIds = new Set<number>();
            titoClassesData.forEach((tc: any) => {
                const classId = tc.classID || tc;
                if (classId) titoClassIds.add(classId);
            });

            const classMap: Record<number, number[]> = {};
            const titoModuleSet = new Set<number>();

            for (const classId of Array.from(titoClassIds)) {
                try {
                    const groupModules = await apiClient.get<any>(`/getgroupmodules?groupID=${classId}`);
                    const fetchedModules = Array.isArray(groupModules) ? groupModules : [];

                    fetchedModules.forEach((m: any) => {
                        const moduleId = m.moduleID || m.module_id;
                        if (moduleId) {
                            if (!classMap[moduleId]) classMap[moduleId] = [];
                            classMap[moduleId].push(classId);
                            titoModuleSet.add(moduleId);
                        }
                    });
                } catch (err) {
                    console.error(`Failed to fetch modules for class ${classId}`, err);
                }
            }

            setModuleClassMap(classMap);

            const activeStatusMap: Record<number, boolean> = {};
            try {
                const accessResponse = await apiClient.get<any>('/twt/session/access');
                const accessData = accessResponse?.data || [];

                accessData.forEach((classEntry: any) => {
                    if (Array.isArray(classEntry) && classEntry.length >= 2) {
                        const [, modulesList] = classEntry;
                        if (Array.isArray(modulesList)) {
                            modulesList.forEach((moduleTuple: any) => {
                                if (Array.isArray(moduleTuple) && moduleTuple.length >= 1) {
                                    activeStatusMap[moduleTuple[0]] = true;
                                }
                            });
                        }
                    }
                });
            } catch (err) {
                console.error('Failed to fetch active status', err);
            }

            titoModuleSet.forEach((moduleId) => {
                if (!(moduleId in activeStatusMap)) activeStatusMap[moduleId] = false;
            });

            setModuleActiveStatus(activeStatusMap);

            const transformedModules: ModuleItem[] = [];
            modulesArray.forEach((m: any) => {
                const moduleId = m.moduleID || m.module_id;
                const classIds = classMap[moduleId] || [];

                if (classIds.length > 0) {
                    classIds.forEach((classId) => {
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
            console.error(err);
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
            const formData = new FormData();
            formData.append('moduleID', selectedModule.moduleID.toString());
            formData.append('classID', selectedModule.classID.toString());
            formData.append('isStatusUpdate', 'true');

            const response = await fetch('/elleapi/twt/professor/updateModule', {
                method: 'POST',
                headers: { Authorization: `Bearer ${user?.jwt}` },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to toggle status (${response.status}): ${errorText}`);
            }

            setShowStatusModal(false);
            setSelectedModule(null);
            setSuccess('Module status toggled successfully! Refreshing...');

            setTimeout(async () => {
                await fetchModules();
                setSuccess('Module status updated!');
            }, 500);
        } catch (err) {
            console.error('Toggle status error:', err);
            setError(err instanceof Error ? err.message : 'Failed to toggle Tito status');
            setShowStatusModal(false);
        }
    };

    const fetchAvailableClasses = async () => {
        try {
            const groupsData = await apiClient.get<any>('/searchusergroups');
            const groups = Array.isArray(groupsData) ? groupsData : [];
            setAvailableClasses(
                groups.map((g: any) => ({
                    groupID: g.groupID,
                    groupName: g.groupName || `Class ${g.groupID}`,
                }))
            );
        } catch (err) {
            console.error(err);
        }
    };

    const handleAssignClass = async () => {
        if (!selectedModule || !assignClassId) {
            setError('Please select a class');
            return;
        }

        try {
            const modulesInClass = modules.filter((m) => m.classID === assignClassId);
            const nextSequence = modulesInClass.length + 1;

            await axios.post(
                '/elleapi/addmoduletogroup',
                { moduleID: selectedModule.moduleID, groupID: assignClassId },
                { headers: { Authorization: 'Bearer ' + user?.jwt } }
            );

            const titoFormData = new FormData();
            titoFormData.append('moduleID', selectedModule.moduleID.toString());
            titoFormData.append('classID', assignClassId.toString());
            titoFormData.append('sequenceID', nextSequence.toString());

            await fetch('/elleapi/twt/professor/addModule', {
                method: 'POST',
                headers: { Authorization: `Bearer ${user?.jwt}` },
                body: titoFormData,
            }).catch(() => {});

            const newMap = { ...moduleClassMap };
            if (!newMap[selectedModule.moduleID]) newMap[selectedModule.moduleID] = [];
            if (!newMap[selectedModule.moduleID].includes(assignClassId)) {
                newMap[selectedModule.moduleID] = [...newMap[selectedModule.moduleID], assignClassId];
            }
            setModuleClassMap(newMap);

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
            await apiClient.post('/removemodulefromgroup', {
                moduleID: moduleToRemove.moduleID,
                groupID: moduleToRemove.classID,
            });

            const newMap = { ...moduleClassMap };
            if (newMap[moduleToRemove.moduleID]) {
                newMap[moduleToRemove.moduleID] = newMap[moduleToRemove.moduleID].filter(
                    (cid: number) => cid !== moduleToRemove.classID
                );
                if (newMap[moduleToRemove.moduleID].length === 0) delete newMap[moduleToRemove.moduleID];
            }
            setModuleClassMap(newMap);

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

    // ── New UI: search + filter logic ────────────────────────────────────────

    const filteredModules = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();

        return modules.filter((module) => {
            const moduleName = module.name?.toLowerCase() || '';
            const moduleId = String(module.moduleID);
            const isActive = module.isTitoEnabled
                ? moduleActiveStatus[module.moduleID] ?? true
                : false;

            const matchesSearch =
                normalizedSearch.length === 0 ||
                moduleName.includes(normalizedSearch) ||
                moduleId.includes(normalizedSearch);

            let matchesFilter = true;
            switch (selectedFilter) {
                case 'active':
                    matchesFilter = module.isTitoEnabled && isActive;
                    break;
                case 'inactive':
                    matchesFilter = module.isTitoEnabled && !isActive;
                    break;
                case 'titoEnabled':
                    matchesFilter = module.isTitoEnabled;
                    break;
                default:
                    matchesFilter = true;
            }

            return matchesSearch && matchesFilter;
        });
    }, [modules, searchQuery, selectedFilter, moduleActiveStatus]);

    const groupedModules = useMemo(() => {
        return filteredModules.reduce((acc, module) => {
            const key = module.classID ? `Class ${module.classID}` : 'Unassigned';
            if (!acc[key]) acc[key] = [];
            acc[key].push(module);
            return acc;
        }, {} as Record<string, ModuleItem[]>);
    }, [filteredModules]);

    const hasClassID = (groupName: string) => groupName !== 'Unassigned';

    if (loading || !hasConsoleAccess(user?.permissionGroup)) {
        return null;
    }

    return (
        <div className="container-fluid py-4">
            <ConsoleTabs activeTab="modules" />

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-1">Modules Management</h2>
                    <p className="text-muted mb-0">
                        Search, filter, and manage module assignments more efficiently.
                    </p>
                </div>
                <button className="btn btn-outline-primary" onClick={fetchModules}>
                    Refresh
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)} />
                </div>
            )}
            {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {success}
                    <button type="button" className="btn-close" onClick={() => setSuccess(null)} />
                </div>
            )}

            {/* Search & Filter card */}
            <Card className="mb-3 shadow-sm border-0">
                <CardBody>
                    <div className="row g-3 align-items-end">
                        <div className="col-12 col-md-7">
                            <Label className="fw-semibold">Search Modules</Label>
                            <InputGroup>
                                <InputGroupText>🔍</InputGroupText>
                                <Input
                                    type="text"
                                    placeholder="Search by name or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                        </div>
                        <div className="col-12 col-md-5">
                            <Label className="fw-semibold">Filter</Label>
                            <Input
                                type="select"
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value as FilterOption)}
                            >
                                <option value="all">All Modules</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="titoEnabled">Tito Enabled</option>
                            </Input>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Loading */}
            {loadingModules && (
                <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!loadingModules && Object.keys(groupedModules).length === 0 && (
                <Card>
                    <CardBody>
                        <p className="text-muted text-center py-4">No modules found.</p>
                    </CardBody>
                </Card>
            )}

            {/* Module groups */}
            {!loadingModules &&
                Object.entries(groupedModules).map(([groupName, groupModules]) => (
                    <Card key={groupName} className="mb-3 shadow-sm border-0">
                        <CardBody>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <CardTitle tag="h5" className="mb-0">
                                    {groupName}
                                </CardTitle>
                                <Badge color="light" className="text-dark border">
                                    {groupModules.length} modules
                                </Badge>
                            </div>

                            <div className="table-responsive module-table-wrap">
                                <Table hover responsive className="align-middle mb-0 module-table">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Module</th>
                                            <th>Tito Enabled</th>
                                            <th>Active Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupModules.map((module) => {
                                            const isActive = module.isTitoEnabled
                                                ? moduleActiveStatus[module.moduleID] ?? true
                                                : false;

                                            return (
                                                <tr key={`${module.moduleID}-${module.classID ?? 'unassigned'}`}>
                                                    <td>
                                                        <div className="fw-semibold">{module.name}</div>
                                                        <div className="text-muted small">
                                                            Module ID: {module.moduleID}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Badge color={module.isTitoEnabled ? 'success' : 'secondary'}>
                                                            {module.isTitoEnabled ? 'Yes' : 'No'}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {module.isTitoEnabled ? (
                                                            <Badge color={isActive ? 'success' : 'warning'}>
                                                                {isActive ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="actions-cell">
                                                        <UncontrolledDropdown
                                                            direction="up"
                                                            className="actions-dropdown"
                                                        >
                                                            <DropdownToggle caret color="success" size="sm">
                                                                Actions
                                                            </DropdownToggle>
                                                            <DropdownMenu end className="module-actions-menu">
                                                                <DropdownItem
                                                                    onClick={async () => {
                                                                        setSelectedModule(module);
                                                                        setAssignClassId(module.classID || 0);
                                                                        await fetchAvailableClasses();
                                                                        setShowAssignClassModal(true);
                                                                    }}
                                                                >
                                                                    Assign to Class
                                                                </DropdownItem>

                                                                {module.isTitoEnabled && (
                                                                    <DropdownItem
                                                                        onClick={() => {
                                                                            setSelectedModule(module);
                                                                            setShowStatusModal(true);
                                                                        }}
                                                                    >
                                                                        Toggle Active / Inactive
                                                                    </DropdownItem>
                                                                )}

                                                                {hasClassID(groupName) && (
                                                                    <>
                                                                        <DropdownItem divider />
                                                                        <DropdownItem
                                                                            className="text-danger"
                                                                            onClick={() => {
                                                                                setModuleToRemove(module);
                                                                                setShowRemoveModal(true);
                                                                            }}
                                                                        >
                                                                            Remove from Class
                                                                        </DropdownItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenu>
                                                        </UncontrolledDropdown>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>
                ))}

            {/* Toggle Active/Inactive Modal */}
            <Modal isOpen={showStatusModal} toggle={() => setShowStatusModal(false)}>
                <ModalHeader toggle={() => setShowStatusModal(false)}>
                    Toggle Module Active/Inactive Status
                </ModalHeader>
                <ModalBody>
                    <p>
                        This will toggle the module status between <strong>active</strong> and{' '}
                        <strong>inactive</strong>.
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

            {/* Assign Class Modal */}
            <Modal isOpen={showAssignClassModal} toggle={() => setShowAssignClassModal(false)}>
                <ModalHeader toggle={() => setShowAssignClassModal(false)}>
                    Assign Module to Class
                </ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="assignClassID">Select Class *</Label>
                        <Input
                            id="assignClassID"
                            type="select"
                            value={assignClassId || ''}
                            onChange={(e) => setAssignClassId(parseInt(e.target.value, 10) || 0)}
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
                        <small>
                            Sequence order will be automatically assigned based on current modules in the
                            class.
                        </small>
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

            {/* Remove from Class Modal */}
            <Modal isOpen={showRemoveModal} toggle={() => setShowRemoveModal(false)}>
                <ModalHeader toggle={() => setShowRemoveModal(false)}>
                    Remove Module from Class
                </ModalHeader>
                <ModalBody>
                    <p>
                        Are you sure you want to remove <strong>{moduleToRemove?.name}</strong> from this
                        class?
                    </p>
                    <p className="text-muted">
                        This will unassign the module from the class. Students in this class will no longer
                        have access to it.
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

            <style jsx global>{`
                .container-fluid,
                .card,
                .card-body,
                .table-responsive,
                .module-table-wrap,
                .module-table,
                .module-table tbody,
                .module-table tr,
                .module-table td {
                    overflow: visible !important;
                }
                .module-table-wrap {
                    position: relative;
                    z-index: 1;
                }
                .module-table {
                    border-collapse: separate !important;
                }
                .module-table tr {
                    position: relative;
                    z-index: 1;
                }
                .actions-cell {
                    position: relative;
                    overflow: visible !important;
                    z-index: 9999;
                }
                .actions-dropdown {
                    position: relative !important;
                }
                .actions-dropdown.show {
                    z-index: 99999 !important;
                }
                .actions-dropdown .dropdown-menu,
                .module-actions-menu {
                    position: absolute !important;
                    z-index: 999999 !important;
                    overflow: visible !important;
                }
                .dropdown-menu.show {
                    display: block !important;
                }
            `}</style>
        </div>
    );
}
