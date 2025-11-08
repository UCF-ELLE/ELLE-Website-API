import React, { useState, useEffect } from 'react';
import { Button, Table, Input, Alert, FormGroup, Label, Spinner } from 'reactstrap';
import Select from 'react-select';
import { GeneratedTerm } from '@/services/AIModuleService';

interface TermReviewComponentProps {
    terms: GeneratedTerm[];
    onApprove: (approvedTerms: GeneratedTerm[]) => void;
    onCancel: () => void;
    loading?: boolean;
}

const questionTypeOptions = [
    { value: 'MATCH', label: 'MATCH' },
    { value: 'PHRASE', label: 'PHRASE' }
];

const posOptions = [
    { value: 'NN', label: 'Noun (NN)' },
    { value: 'VR', label: 'Verb (VR)' },
    { value: 'AJ', label: 'Adjective (AJ)' },
    { value: 'AV', label: 'Adverb (AV)' },
    { value: 'PH', label: 'Phrase (PH)' }
];

const genderOptions = [
    { value: 'M', label: 'Masculine' },
    { value: 'F', label: 'Feminine' },
    { value: 'N', label: 'Neutral' }
];

export default function TermReviewComponent({ 
    terms, 
    onApprove, 
    onCancel,
    loading = false 
}: TermReviewComponentProps) {
    const [editableTerms, setEditableTerms] = useState<GeneratedTerm[]>([]);

    useEffect(() => {
        // Initialize editable terms when terms prop changes
        if (terms && terms.length > 0) {
            const mapped = terms.map(term => ({ 
                ...term, 
                questionType: term.questionType || ('MATCH' as 'MATCH' | 'PHRASE') 
            }));
            
            setEditableTerms(mapped);
        }
    }, [terms]);

    const updateTerm = (index: number, field: keyof GeneratedTerm, value: string) => {
        const updated = [...editableTerms];
        updated[index] = { ...updated[index], [field]: value };
        setEditableTerms(updated);
    };

    const removeTerm = (index: number) => {
        setEditableTerms(editableTerms.filter((_, i) => i !== index));
    };

    const handleApprove = () => {
        onApprove(editableTerms);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <Alert color='info'>
                <h5>Review Generated Terms</h5>
                <p>Review the AI-generated terms below. You can edit any field, assign question types (MATCH or PHRASE), and remove unwanted terms before finalizing.</p>
            </Alert>

            {loading && (
                <div className="text-center my-3">
                    <Spinner color="primary" />
                    <p>Creating module and terms...</p>
                </div>
            )}

            <div style={{ maxHeight: '500px', overflowY: 'auto', marginBottom: '20px' }}>
                <Table bordered hover size="sm" responsive>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1 }}>
                        <tr>
                            <th style={{ width: '5%' }}>#</th>
                            <th style={{ width: '20%' }}>Target (Front)</th>
                            <th style={{ width: '20%' }}>Native (Back)</th>
                            <th style={{ width: '15%' }}>Type</th>
                            <th style={{ width: '12%' }}>Gender</th>
                            <th style={{ width: '15%' }}>Question Type</th>
                            <th style={{ width: '8%' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {editableTerms.map((term, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                    <Input
                                        type="text"
                                        value={term.target_word}
                                        onChange={(e) => updateTerm(index, 'target_word', e.target.value)}
                                        bsSize="sm"
                                        disabled={loading}
                                    />
                                </td>
                                <td>
                                    <Input
                                        type="text"
                                        value={term.native_word}
                                        onChange={(e) => updateTerm(index, 'native_word', e.target.value)}
                                        bsSize="sm"
                                        disabled={loading}
                                    />
                                </td>
                                <td>
                                    <Select
                                        value={posOptions.find(opt => opt.value === term.part_of_speech)}
                                        options={posOptions}
                                        onChange={(option) => updateTerm(index, 'part_of_speech', option?.value || 'NN')}
                                        isDisabled={loading}
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </td>
                                <td>
                                    <Select
                                        value={genderOptions.find(opt => opt.value === term.gender)}
                                        options={genderOptions}
                                        onChange={(option) => updateTerm(index, 'gender', option?.value || 'N')}
                                        isDisabled={loading}
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </td>
                                <td>
                                    <Select
                                        value={questionTypeOptions.find(opt => opt.value === term.questionType)}
                                        options={questionTypeOptions}
                                        onChange={(option) => updateTerm(index, 'questionType', option?.value as 'MATCH' | 'PHRASE')}
                                        isDisabled={loading}
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    />
                                </td>
                                <td>
                                    <Button
                                        color="danger"
                                        size="sm"
                                        onClick={() => removeTerm(index)}
                                        disabled={loading}
                                    >
                                        Remove
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {editableTerms.length === 0 && (
                <Alert color="warning">
                    All terms have been removed. Please cancel and try again.
                </Alert>
            )}

            <div className="d-flex justify-content-between">
                <Button
                    color="secondary"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    color="success"
                    onClick={handleApprove}
                    disabled={editableTerms.length === 0 || loading}
                >
                    {loading ? (
                        <>
                            <Spinner size="sm" className="me-2" />
                            Creating Module...
                        </>
                    ) : (
                        'Approve & Create Module'
                    )}
                </Button>
            </div>
        </div>
    );
}
