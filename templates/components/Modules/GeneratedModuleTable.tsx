import React, { useState } from 'react';
import {
    Table,
    Button,
    Input,
    Form,
    FormGroup,
    Row,
    Col,
    Badge,
    Alert,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from 'reactstrap';
import { GeneratedModuleContent } from '@/services/AIModuleService';
import { useUser } from '@/hooks/useAuth';
import axios from 'axios';

interface EditableTermRow {
    id: string;
    front: string;
    back: string;
    type: string;
    isEditing: boolean;
    isNew?: boolean;
}

export default function GeneratedModuleTable({
    moduleID,
    content,
    onContentUpdate
}: {
    moduleID: number;
    content: GeneratedModuleContent;
    onContentUpdate: (updatedContent: GeneratedModuleContent) => void;
}) {
    const { user } = useUser();
    const [terms, setTerms] = useState<EditableTermRow[]>(
        content.terms.map((term, index) => ({
            id: `term-${index}`,
            front: term.front,
            back: term.back,
            type: term.type,
            isEditing: false
        }))
    );
    const [deleteModal, setDeleteModal] = useState<{open: boolean, termId: string | null}>({
        open: false,
        termId: null
    });
    const [newTerm, setNewTerm] = useState<{front: string, back: string, type: string}>({
        front: '',
        back: '',
        type: 'TERM'
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{show: boolean, success: boolean, message: string}>({
        show: false,
        success: false,
        message: ''
    });

    const startEditing = (termId: string) => {
        setTerms(prev => prev.map(term => 
            term.id === termId ? { ...term, isEditing: true } : term
        ));
    };

    const cancelEditing = (termId: string) => {
        setTerms(prev => prev.map(term => 
            term.id === termId ? { ...term, isEditing: false } : term
        ));
    };

    const saveEdit = async (termId: string) => {
        const termToSave = terms.find(term => term.id === termId);
        if (!termToSave) return;

        try {
            const data = {
                moduleID,
                front: termToSave.front,
                back: termToSave.back,
                type: termToSave.type
            };

            const header = { headers: { Authorization: `Bearer ${user?.jwt}` } };
            
            if (termToSave.isNew) {
                // Create new term
                await axios.post('/elleapi/term', data, header);
            } else {
                // Update existing term (you might need a different endpoint)
                await axios.put('/elleapi/term', { ...data, termID: termId }, header);
            }

            setTerms(prev => prev.map(term => 
                term.id === termId ? { ...term, isEditing: false, isNew: false } : term
            ));

            showSaveStatus(true, 'Term saved successfully!');
            
            // Update parent component with new content
            const updatedContent = {
                ...content,
                terms: terms.map(term => ({
                    front: term.front,
                    back: term.back,
                    type: term.type
                }))
            };
            onContentUpdate(updatedContent);

        } catch (error) {
            console.error('Error saving term:', error);
            showSaveStatus(false, 'Failed to save term');
        }
    };

    const deleteTerm = async (termId: string) => {
        try {
            if (!terms.find(t => t.id === termId)?.isNew) {
                const header = { 
                    headers: { Authorization: `Bearer ${user?.jwt}` },
                    data: { termID: termId, moduleID }
                };
                await axios.delete('/elleapi/term', header);
            }

            const updatedTerms = terms.filter(term => term.id !== termId);
            setTerms(updatedTerms);
            
            const updatedContent = {
                ...content,
                terms: updatedTerms.map(term => ({
                    front: term.front,
                    back: term.back,
                    type: term.type
                }))
            };
            onContentUpdate(updatedContent);

            showSaveStatus(true, 'Term deleted successfully!');
            setDeleteModal({open: false, termId: null});

        } catch (error) {
            console.error('Error deleting term:', error);
            showSaveStatus(false, 'Failed to delete term');
        }
    };

    const addNewTerm = () => {
        if (!newTerm.front.trim() || !newTerm.back.trim()) {
            showSaveStatus(false, 'Please fill in both front and back fields');
            return;
        }

        const newTermRow: EditableTermRow = {
            id: `new-term-${Date.now()}`,
            front: newTerm.front,
            back: newTerm.back,
            type: newTerm.type,
            isEditing: true,
            isNew: true
        };

        setTerms(prev => [...prev, newTermRow]);
        setNewTerm({front: '', back: '', type: 'TERM'});
        setShowAddForm(false);
    };

    const updateTerm = (termId: string, field: 'front' | 'back' | 'type', value: string) => {
        setTerms(prev => prev.map(term => 
            term.id === termId ? { ...term, [field]: value } : term
        ));
    };

    const showSaveStatus = (success: boolean, message: string) => {
        setSaveStatus({show: true, success, message});
        setTimeout(() => setSaveStatus({show: false, success: false, message: ''}), 3000);
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'TERM': return 'primary';
            case 'PHRASE': return 'success';
            case 'QUESTION': return 'info';
            default: return 'secondary';
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Generated Content ({terms.length} items)</h4>
                <Button 
                    color="success" 
                    size="sm"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    ➕ Add Term
                </Button>
            </div>

            {saveStatus.show && (
                <Alert color={saveStatus.success ? 'success' : 'danger'}>
                    {saveStatus.message}
                </Alert>
            )}

            {showAddForm && (
                <Alert color="info" className="mb-3">
                    <Form onSubmit={(e) => { e.preventDefault(); addNewTerm(); }}>
                        <Row>
                            <Col md={4}>
                                <FormGroup>
                                    <Input
                                        type="text"
                                        placeholder="Front (original language)"
                                        value={newTerm.front}
                                        onChange={(e) => setNewTerm(prev => ({...prev, front: e.target.value}))}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Input
                                        type="text"
                                        placeholder="Back (translation)"
                                        value={newTerm.back}
                                        onChange={(e) => setNewTerm(prev => ({...prev, back: e.target.value}))}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Input
                                        type="select"
                                        value={newTerm.type}
                                        onChange={(e) => setNewTerm(prev => ({...prev, type: e.target.value}))}
                                    >
                                        <option value="TERM">Term</option>
                                        <option value="PHRASE">Phrase</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <Button color="success" size="sm" type="submit" className="me-2">
                                    ✓
                                </Button>
                                <Button color="secondary" size="sm" onClick={() => setShowAddForm(false)}>
                                    ✕
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Alert>
            )}

            <Table striped responsive className="shadow">
                <thead style={{backgroundColor: '#f8f9fa'}}>
                    <tr>
                        <th style={{width: '30%'}}>Original</th>
                        <th style={{width: '30%'}}>Translation</th>
                        <th style={{width: '15%'}}>Type</th>
                        <th style={{width: '25%'}}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {terms.map((term) => (
                        <tr key={term.id} style={term.isNew ? {backgroundColor: '#e8f5e8'} : {}}>
                            <td>
                                {term.isEditing ? (
                                    <Input
                                        type="text"
                                        value={term.front}
                                        onChange={(e) => updateTerm(term.id, 'front', e.target.value)}
                                        bsSize="sm"
                                    />
                                ) : (
                                    <span>{term.front}</span>
                                )}
                            </td>
                            <td>
                                {term.isEditing ? (
                                    <Input
                                        type="text"
                                        value={term.back}
                                        onChange={(e) => updateTerm(term.id, 'back', e.target.value)}
                                        bsSize="sm"
                                    />
                                ) : (
                                    <span>{term.back}</span>
                                )}
                            </td>
                            <td>
                                {term.isEditing ? (
                                    <Input
                                        type="select"
                                        value={term.type}
                                        onChange={(e) => updateTerm(term.id, 'type', e.target.value)}
                                        bsSize="sm"
                                    >
                                        <option value="TERM">Term</option>
                                        <option value="PHRASE">Phrase</option>
                                    </Input>
                                ) : (
                                    <Badge color={getTypeColor(term.type)}>
                                        {term.type}
                                    </Badge>
                                )}
                            </td>
                            <td>
                                {term.isEditing ? (
                                    <div>
                                        <Button 
                                            color="success" 
                                            size="sm" 
                                            className="me-2"
                                            onClick={() => saveEdit(term.id)}
                                        >
                                            ✓ Save
                                        </Button>
                                        <Button 
                                            color="secondary" 
                                            size="sm"
                                            onClick={() => cancelEditing(term.id)}
                                        >
                                            ✕ Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <Button 
                                            color="warning" 
                                            size="sm" 
                                            className="me-2"
                                            onClick={() => startEditing(term.id)}
                                        >
                                            ✏️ Edit
                                        </Button>
                                        <Button 
                                            color="danger" 
                                            size="sm"
                                            onClick={() => setDeleteModal({open: true, termId: term.id})}
                                        >
                                            🗑️ Delete
                                        </Button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={deleteModal.open} toggle={() => setDeleteModal({open: false, termId: null})}>
                <ModalHeader toggle={() => setDeleteModal({open: false, termId: null})}>
                    Confirm Delete
                </ModalHeader>
                <ModalBody>
                    Are you sure you want to delete this term? This action cannot be undone.
                </ModalBody>
                <ModalFooter>
                    <Button 
                        color="danger" 
                        onClick={() => deleteModal.termId && deleteTerm(deleteModal.termId)}
                    >
                        Delete
                    </Button>
                    <Button 
                        color="secondary" 
                        onClick={() => setDeleteModal({open: false, termId: null})}
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}