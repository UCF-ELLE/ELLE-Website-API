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
        body: '',
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
                    lore.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
        setLoreForm({ title: '', tags: '', body: '' });
        setShowEditorModal(true);
    };

    const handleEdit = (lore: TitoLore) => {
        setEditingLore(lore);
        setLoreForm({
            title: lore.title,
            tags: lore.tags.join(', '),
            body: lore.body,
        });
        setShowEditorModal(true);
    };

    const handleSaveLore = async () => {
        if (!loreForm.title || !loreForm.body) {
            setError('Title and body are required');
            return;
        }

        try {
            const tags = loreForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
            
            if (editingLore) {
                // Update existing
                await apiClient.post('/twt/professor/updateTitoLore', {
                    loreID: editingLore.loreID,
                    title: loreForm.title,
                    tags,
                    body: loreForm.body,
                });
                setSuccess('Lore updated successfully!');
            } else {
                // Create new
                await apiClient.post('/twt/professor/createNewTitoLore', {
                    title: loreForm.title,
                    tags,
                    body: loreForm.body,
                });
                setSuccess('Lore created successfully!');
            }

            setShowEditorModal(false);
            setLoreForm({ title: '', tags: '', body: '' });
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
                                placeholder="Search by title, tags, or content..."
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
                                        <th>Tags</th>
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
                                                {lore.tags.map((tag) => (
                                                    <Badge key={tag} color="info" className="me-1">
                                                        {tag}
                                                    </Badge>
                                                ))}
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
                    <FormGroup>
                        <Label for="title">Title *</Label>
                        <Input
                            id="title"
                            type="text"
                            value={loreForm.title}
                            onChange={(e) => setLoreForm({ ...loreForm, title: e.target.value })}
                            placeholder="Enter lore title"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label for="tags">Tags (comma-separated)</Label>
                        <Input
                            id="tags"
                            type="text"
                            value={loreForm.tags}
                            onChange={(e) => setLoreForm({ ...loreForm, tags: e.target.value })}
                            placeholder="e.g., grammar, vocabulary, culture"
                        />
                    </FormGroup>
                    <FormGroup>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label for="body" className="mb-0">
                                Content * (Markdown supported)
                            </Label>
                            <Button
                                size="sm"
                                color="secondary"
                                outline
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                {showPreview ? 'Edit' : 'Preview'}
                            </Button>
                        </div>
                        {showPreview ? (
                            <Card className="p-3" style={{ minHeight: '300px', maxHeight: '500px', overflow: 'auto' }}>
                                <div dangerouslySetInnerHTML={{ __html: loreForm.body }} />
                            </Card>
                        ) : (
                            <Input
                                id="body"
                                type="textarea"
                                value={loreForm.body}
                                onChange={(e) => setLoreForm({ ...loreForm, body: e.target.value })}
                                placeholder="Enter lore content (markdown supported)"
                                rows={15}
                            />
                        )}
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
