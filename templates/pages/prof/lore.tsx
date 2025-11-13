'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/hooks/useAuth';
import { hasConsoleAccess } from '@/lib/rbac';
import { apiClient } from '@/lib/apiClient';
import { TitoLore } from '@/types/professorConsole';
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
} from 'reactstrap';
import ConsoleTabs from '@/components/ProfessorConsole/ConsoleTabs';

export default function LorePage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loreItems, setLoreItems] = useState<TitoLore[]>([]);
    const [filteredLore, setFilteredLore] = useState<TitoLore[]>([]);
    const [loadingLore, setLoadingLore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Create/Edit Modal
    const [showEditorModal, setShowEditorModal] = useState(false);
    const [editingLore, setEditingLore] = useState<TitoLore | null>(null);
    const [loreForm, setLoreForm] = useState({
        title: '',
        tags: '',
        lore1: '',
        lore2: '',
        lore3: '',
        lore4: '',
    });
    const [showPreview, setShowPreview] = useState(false);

    // Assign Modal
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedLore, setSelectedLore] = useState<TitoLore | null>(null);
    const [assignTo, setAssignTo] = useState<{ classID?: string; moduleID?: string }>({});
    const [availableClasses, setAvailableClasses] = useState<Array<{ classID: number; name: string }>>([]);
    const [availableModules, setAvailableModules] = useState<Array<{ moduleID: number; name: string }>>([]);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [loadingModules, setLoadingModules] = useState(false);

    useEffect(() => {
        if (!loading && !hasConsoleAccess(user?.permissionGroup)) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (hasConsoleAccess(user?.permissionGroup)) {
            fetchLore();
        }

        if (searchParams?.get('action') === 'create') {
            handleCreateNew();
        }
    }, [user, searchParams]);

    useEffect(() => {
        // Filter lore based on search query
        if (searchQuery) {
            const filtered = loreItems.filter(
                (lore) =>
                    lore.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    lore.body.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredLore(filtered);
        } else {
            setFilteredLore(loreItems);
        }
    }, [searchQuery, loreItems]);

    const fetchLore = async () => {
        try {
            setLoadingLore(true);
            setError(null);
            // Backend returns { loreData: [(loreID, sequenceNumber, loreText), ...] }
            const response = await apiClient.get<{ loreData: [number, number, string][] }>('/twt/professor/fetchOwnedTitoLore');
            
            // Group by loreID and transform into TitoLore objects
            const loreMap = new Map<number, { texts: string[] }>();
            
            (response.loreData || []).forEach(([loreID, sequenceNumber, loreText]) => {
                if (!loreMap.has(loreID)) {
                    loreMap.set(loreID, { texts: [] });
                }
                // Ensure texts array is large enough
                const loreItem = loreMap.get(loreID)!;
                loreItem.texts[sequenceNumber - 1] = loreText;
            });
            
            // Convert map to TitoLore array
            const transformedLore: TitoLore[] = Array.from(loreMap.entries()).map(([loreID, data]) => ({
                loreID,
                title: `Lore #${loreID}`,
                tags: [],
                body: data.texts.filter(Boolean).join('\n\n'),
                assignedTo: {},
            }));
            
            setLoreItems(transformedLore);
        } catch (err) {
            console.error('Fetch lore error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch lore');
        } finally {
            setLoadingLore(false);
        }
    };

    const handleCreateNew = () => {
        setEditingLore(null);
        setLoreForm({ title: '', tags: '', lore1: '', lore2: '', lore3: '', lore4: '' });
        setShowEditorModal(true);
    };

    const handleEdit = (lore: TitoLore) => {
        setEditingLore(lore);
        // Split body by double newlines into 4 parts
        const parts = lore.body.split('\n\n');
        setLoreForm({
            title: '',
            tags: '',
            lore1: parts[0] || '',
            lore2: parts[1] || '',
            lore3: parts[2] || '',
            lore4: parts[3] || '',
        });
        setShowEditorModal(true);
    };

    const handleSaveLore = async () => {
        // Validate that at least one lore section has content
        if (!loreForm.lore1 && !loreForm.lore2 && !loreForm.lore3 && !loreForm.lore4) {
            setError('At least one lore section is required');
            return;
        }

        try {
            if (editingLore) {
                // Update existing - update each of the 4 lore parts
                const loreParts = [loreForm.lore1, loreForm.lore2, loreForm.lore3, loreForm.lore4];
                
                // Update each part
                for (let i = 0; i < 4; i++) {
                    if (loreParts[i]) { // Only update if there's content
                        await apiClient.post('/twt/professor/updateTitoLore', {
                            classID: editingLore.assignedTo?.classID || 0, // Required by backend but not used
                            loreID: editingLore.loreID,
                            sequenceNumber: i + 1,
                            newLoreText: loreParts[i],
                        });
                    }
                }
                setSuccess('Lore updated successfully!');
            } else {
                // Create new - combine all 4 parts with double newlines
                const body = [loreForm.lore1, loreForm.lore2, loreForm.lore3, loreForm.lore4]
                    .filter(Boolean)
                    .join('\n\n');
                
                const response = await apiClient.post<{ loreID: number }>('/twt/professor/createNewTitoLore', {
                    body: body,
                });
                setSuccess(`Lore created successfully! (ID: ${response.loreID})`);
            }

            setShowEditorModal(false);
            setLoreForm({ title: '', tags: '', lore1: '', lore2: '', lore3: '', lore4: '' });
            setEditingLore(null);
            fetchLore();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save lore');
        }
    };

    const fetchAvailableClasses = async () => {
        try {
            setLoadingClasses(true);
            // Get user's classes from searchusergroups
            const userGroupsData = await apiClient.get<any>('/searchusergroups');
            const userGroups = Array.isArray(userGroupsData) ? userGroupsData : [];
            
            const classes = userGroups.map((g: any) => ({
                classID: g.groupID,
                name: g.groupName || `Class ${g.groupID}`,
            }));
            
            setAvailableClasses(classes);
        } catch (err) {
            console.error('Failed to fetch classes:', err);
            setAvailableClasses([]);
        } finally {
            setLoadingClasses(false);
        }
    };

    const fetchAvailableModules = async (classID: string) => {
        if (!classID) {
            setAvailableModules([]);
            return;
        }
        
        try {
            setLoadingModules(true);
            // Get modules for the selected class - endpoint returns array directly
            const modulesData = await apiClient.get<any>(`/getgroupmodules?groupID=${classID}`);
            const modules = Array.isArray(modulesData) ? modulesData : [];
            
            const transformedModules = modules.map((m: any) => ({
                moduleID: m.moduleID || m.module_id,
                name: m.moduleName || m.module_name || `Module ${m.moduleID || m.module_id}`,
            }));
            
            setAvailableModules(transformedModules);
        } catch (err) {
            console.error('Failed to fetch modules:', err);
            setAvailableModules([]);
        } finally {
            setLoadingModules(false);
        }
    };

    const handleAssignLore = async () => {
        if (!selectedLore) return;

        try {
            await apiClient.post('/twt/professor/changeAssignedLore', {
                loreID: selectedLore.loreID,
                classID: assignTo.classID ? parseInt(assignTo.classID) : undefined,
                moduleID: assignTo.moduleID ? parseInt(assignTo.moduleID) : undefined,
            });
            setSuccess('Lore assignment updated!');
            setShowAssignModal(false);
            setSelectedLore(null);
            setAssignTo({});
            fetchLore();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign lore');
        }
    };

    const handleOpenAssignModal = (lore: TitoLore) => {
        setSelectedLore(lore);
        setAssignTo({
            classID: lore.assignedTo?.classID?.toString(),
            moduleID: lore.assignedTo?.moduleID?.toString(),
        });
        setShowAssignModal(true);
        // Fetch classes when modal opens
        fetchAvailableClasses();
        // If there's an existing class assignment, fetch its modules
        if (lore.assignedTo?.classID) {
            fetchAvailableModules(lore.assignedTo.classID.toString());
        }
    };

    if (loading || !hasConsoleAccess(user?.permissionGroup)) {
        return null;
    }

    return (
        <div className="container-fluid py-4">
            <ConsoleTabs activeTab="lore" />

            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Tito Lore Management</h2>
                    <div>
                        <button className="btn btn-primary me-2" onClick={handleCreateNew}>
                            Create Lore
                        </button>
                        <button className="btn btn-outline-primary" onClick={fetchLore}>
                            Refresh
                        </button>
                    </div>
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

                {/* Search Bar */}
                <Card className="mb-3">
                    <CardBody>
                        <InputGroup>
                            <Input
                                type="text"
                                placeholder="Search by ID, title, or content..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <Button color="secondary" onClick={() => setSearchQuery('')}>
                                    Clear
                                </Button>
                            )}
                        </InputGroup>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <CardTitle tag="h5">Lore Library</CardTitle>
                        {loadingLore ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : filteredLore.length === 0 ? (
                            <p className="text-muted text-center py-4">
                                {searchQuery ? 'No lore items match your search.' : 'No lore items found.'}
                            </p>
                        ) : (
                            <Table hover responsive>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Preview</th>
                                        <th>Assigned To</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLore.map((lore) => (
                                        <tr key={lore.loreID}>
                                            <td>{lore.loreID}</td>
                                            <td>{lore.title}</td>
                                            <td>
                                                <span className="text-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                                    {lore.body.substring(0, 100)}{lore.body.length > 100 ? '...' : ''}
                                                </span>
                                            </td>
                                            <td>
                                                {lore.assignedTo?.classID && (
                                                    <Badge color="primary" className="me-1">
                                                        Class {lore.assignedTo.classID}
                                                    </Badge>
                                                )}
                                                {lore.assignedTo?.moduleID && (
                                                    <Badge color="success">Module {lore.assignedTo.moduleID}</Badge>
                                                )}
                                                {!lore.assignedTo?.classID && !lore.assignedTo?.moduleID && (
                                                    <span className="text-muted">Unassigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button className="btn btn-primary" onClick={() => handleEdit(lore)}>
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-info"
                                                        onClick={() => handleOpenAssignModal(lore)}
                                                    >
                                                        Assign
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Editor Modal */}
            <Modal isOpen={showEditorModal} toggle={() => setShowEditorModal(false)} size="xl">
                <ModalHeader toggle={() => setShowEditorModal(false)}>
                    {editingLore ? 'Edit Lore' : 'Create New Lore'}
                </ModalHeader>
                <ModalBody>
                    <div className="alert alert-info" role="alert">
                        <strong>Note:</strong> Each lore consists of 4 text sections that Tito will progressively reveal during conversations.
                        Fill in each section below. At least one section is required.
                    </div>
                    <FormGroup>
                        <Label for="lore1">
                            Lore Section 1 *
                        </Label>
                        <Input
                            id="lore1"
                            type="textarea"
                            value={loreForm.lore1}
                            onChange={(e) => setLoreForm({ ...loreForm, lore1: e.target.value })}
                            placeholder="Enter first lore section..."
                            rows={4}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label for="lore2">
                            Lore Section 2
                        </Label>
                        <Input
                            id="lore2"
                            type="textarea"
                            value={loreForm.lore2}
                            onChange={(e) => setLoreForm({ ...loreForm, lore2: e.target.value })}
                            placeholder="Enter second lore section..."
                            rows={4}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label for="lore3">
                            Lore Section 3
                        </Label>
                        <Input
                            id="lore3"
                            type="textarea"
                            value={loreForm.lore3}
                            onChange={(e) => setLoreForm({ ...loreForm, lore3: e.target.value })}
                            placeholder="Enter third lore section..."
                            rows={4}
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label for="lore4">
                            Lore Section 4
                        </Label>
                        <Input
                            id="lore4"
                            type="textarea"
                            value={loreForm.lore4}
                            onChange={(e) => setLoreForm({ ...loreForm, lore4: e.target.value })}
                            placeholder="Enter fourth lore section..."
                            rows={4}
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowEditorModal(false)}>
                        Cancel
                    </Button>
                    <Button color="primary" onClick={handleSaveLore}>
                        Save
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Assign Modal */}
            <Modal isOpen={showAssignModal} toggle={() => setShowAssignModal(false)}>
                <ModalHeader toggle={() => setShowAssignModal(false)}>Assign Lore</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label for="classID">Class</Label>
                        {loadingClasses ? (
                            <div className="text-center py-2">
                                <span className="spinner-border spinner-border-sm me-2" />
                                Loading classes...
                            </div>
                        ) : (
                            <Input
                                id="classID"
                                type="select"
                                value={assignTo.classID || ''}
                                onChange={(e) => {
                                    const newClassID = e.target.value;
                                    setAssignTo({ classID: newClassID, moduleID: '' });
                                    fetchAvailableModules(newClassID);
                                }}
                            >
                                <option value="">-- Select a class --</option>
                                {availableClasses.map((cls) => (
                                    <option key={cls.classID} value={cls.classID}>
                                        {cls.name}
                                    </option>
                                ))}
                            </Input>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Label for="moduleID">Module</Label>
                        {loadingModules ? (
                            <div className="text-center py-2">
                                <span className="spinner-border spinner-border-sm me-2" />
                                Loading modules...
                            </div>
                        ) : availableModules.length === 0 && assignTo.classID ? (
                            <div className="text-muted small py-2">
                                No modules available for this class
                            </div>
                        ) : (
                            <Input
                                id="moduleID"
                                type="select"
                                value={assignTo.moduleID || ''}
                                onChange={(e) => setAssignTo({ ...assignTo, moduleID: e.target.value })}
                                disabled={!assignTo.classID}
                            >
                                <option value="">-- Select a module --</option>
                                {availableModules.map((mod) => (
                                    <option key={mod.moduleID} value={mod.moduleID}>
                                        {mod.name}
                                    </option>
                                ))}
                            </Input>
                        )}
                        {!assignTo.classID && (
                            <small className="text-muted">Select a class first</small>
                        )}
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowAssignModal(false)}>
                        Cancel
                    </Button>
                    <Button color="primary" onClick={handleAssignLore}>
                        Update Assignment
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
