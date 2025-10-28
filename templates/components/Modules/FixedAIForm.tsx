import React, { useState } from 'react';
import { Alert, Button, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { useUser } from '@/hooks/useAuth';

export default function FixedAIForm({
    updateModuleList,
    classOptions,
    currentClass,
    onClose
}: {
    updateModuleList: (task: string, moduleID?: number) => void;
    classOptions: { value: number; label: string }[];
    currentClass: { value: number; label: string };
    onClose: () => void;
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;
    const [name, setName] = useState<string>('');
    const [targetLanguage, setTargetLanguage] = useState<string>('');
    const [nativeLanguage, setNativeLanguage] = useState<string>('');
    const [numTerms, setNumTerms] = useState<number>(20);
    const [status, setStatus] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!name || !targetLanguage || !nativeLanguage) {
            setStatusMessage('Please fill in all required fields');
            setSuccess(false);
            setStatus(true);
            setTimeout(() => setStatus(false), 3000);
            return;
        }

        // Call the real AI generation endpoint
        setStatusMessage('Generating AI module...');
        setStatus(true);
        
        try {
            const requestData = {
                name,
                targetLanguage,
                nativeLanguage,
                numTerms,
                complexity: 2,
                groupID: permissionLevel === 'su' ? undefined : 
                         (currentClass.value === 0 ? undefined : currentClass.value)
            };
            
            
            const response = await fetch('/elleapi/twt/professor/generateModule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user!.jwt}`
                },
                body: JSON.stringify(requestData)
            });
            
            
            // Handle non-JSON responses (like error pages)
            const responseText = await response.text();
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('Failed to parse JSON response:', jsonError);
                setStatusMessage(`Server error (${response.status}): ${responseText.substring(0, 200)}...`);
                setSuccess(false);
                setTimeout(() => setStatus(false), 10000);
                return;
            }
            
            if (result.success) {
                setStatusMessage(`AI module "${name}" generated successfully! ${result.data?.content?.terms?.length || 0} terms created.`);
                setSuccess(true);
                
                // Trigger module list update
                updateModuleList('add', result.data?.moduleID);
                
                setTimeout(() => {
                    setStatus(false);
                    setStatusMessage('');
                    // Reset form
                    setName('');
                    setTargetLanguage('');
                    setNativeLanguage('');
                    setNumTerms(20);
                    onClose();
                }, 3000);
            } else {
                setStatusMessage(`AI generation failed: ${result.message}`);
                setSuccess(false);
                setTimeout(() => setStatus(false), 5000);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setStatusMessage(`Network error: ${errorMessage}. Please check console for details.`);
            setSuccess(false);
            setTimeout(() => setStatus(false), 5000);
            }
    };

    const renderStatus = () => {
        if (status) {
            return (
                <Alert color={success ? 'info' : 'danger'} isOpen={status}>
                    {statusMessage}
                </Alert>
            );
        }
    };

    return (
        <div>
            <Alert color='none' style={{ color: '#004085', backgroundColor: 'aliceblue' }}>
                <Form onSubmit={handleSubmit}>
                    {renderStatus()}
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='moduleName'>Module Name: *</Label>
                                <Input 
                                    type='text' 
                                    placeholder='Module Name For Generation' 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='targetLang'>Target Language (to learn): *</Label>
                                <Input
                                    type='select'
                                    value={targetLanguage}
                                    onChange={(e) => setTargetLanguage(e.target.value)}
                                    required
                                >
                                    <option value="">Select target language...</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                    <option value="de">German</option>
                                    <option value="it">Italian</option>
                                    <option value="pt">Portuguese</option>
                                    <option value="ja">Japanese</option>
                                    <option value="zh">Chinese</option>
                                    <option value="ko">Korean</option>
                                </Input>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='nativeLang'>Native Language (translation base): *</Label>
                                <Input
                                    type='select'
                                    value={nativeLanguage}
                                    onChange={(e) => setNativeLanguage(e.target.value)}
                                    required
                                >
                                    <option value="">Select native language...</option>
                                    <option value="en">English</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                    <option value="de">German</option>
                                    <option value="it">Italian</option>
                                    <option value="pt">Portuguese</option>
                                </Input>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='numTerms'>Number of Terms:</Label>
                                <Input 
                                    type='number' 
                                    min={5} 
                                    max={100} 
                                    value={numTerms} 
                                    onChange={(e) => setNumTerms(parseInt(e.target.value))}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={6}>
                            <Button
                                style={{
                                    backgroundColor: '#6c757d',
                                    border: 'none'
                                }}
                                type='button'
                                block
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                        </Col>
                        <Col xs={6}>
                            <Button
                                style={{
                                    backgroundColor: '#28a745',
                                    border: 'none'
                                }}
                                type='submit'
                                block
                                disabled={!name || !targetLanguage || !nativeLanguage}
                            >
                                Generate
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Alert>
        </div>
    );
}
