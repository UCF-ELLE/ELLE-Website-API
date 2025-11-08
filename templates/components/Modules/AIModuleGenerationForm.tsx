import React, { useRef, useState } from 'react';
import Select, { SelectInstance } from 'react-select';
import { Alert, Button, Col, Form, FormGroup, Input, Label, Row, Spinner } from 'reactstrap';
import languageCodes from '@/public/static/json/languageCodes.json';
import { Language, LanguageCode } from '@/types/misc';
import { useUser } from '@/hooks/useAuth';
import AIModuleService, { AIModuleGenerationParams, GeneratedTerm } from '@/services/AIModuleService';
import TermReviewComponent from './TermReviewComponent';

const getLanguageCodeList = () => {
    const list = [];
    for (const key in languageCodes) {
        list.push({
            label: languageCodes[key as LanguageCode],
            value: key as LanguageCode
        });
    }
    return list;
};

export default function AIModuleGenerationForm({
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
    
    // Form fields
    const [moduleName, setModuleName] = useState<string>('');
    const [prompt, setPrompt] = useState<string>('');
    const [targetLanguage, setTargetLanguage] = useState<Language>({
        label: undefined,
        value: undefined
    });
    const [nativeLanguage, setNativeLanguage] = useState<Language>({
        label: undefined,
        value: undefined
    });
    const [termCount, setTermCount] = useState<number>(20);
    const [languageCodeList] = useState<Language[]>(getLanguageCodeList());
    const [classState, setClassState] = useState<{
        value: number;
        label: string;
    }>();
    
    // Workflow state
    const [generatedTerms, setGeneratedTerms] = useState<GeneratedTerm[] | null>(null);
    const [showReview, setShowReview] = useState<boolean>(false);
    
    // UI state
    const [status, setStatus] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [creatingModule, setCreatingModule] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    
    const targetLanguageRef = useRef<SelectInstance<Language>>(null);
    const nativeLanguageRef = useRef<SelectInstance<Language>>(null);
    const aiModuleService = new AIModuleService();

    // Step 1: Generate terms from AI
    const handleGenerateTerms = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!moduleName || !prompt || !targetLanguage.value || !nativeLanguage.value) {
            setStatusMessage('Please fill in all required fields');
            setSuccess(false);
            onShowStatus();
            return;
        }

        setLoading(true);
        setStatusMessage('Generating terms with AI...');

        const generationParams: AIModuleGenerationParams = {
            prompt,
            termCount,
            targetLanguage: targetLanguage.value,
            nativeLanguage: nativeLanguage.value
        };

        try {
            const result = await aiModuleService.generateTerms(generationParams, user!.jwt);
            
            if ('error' in result) {
                setStatusMessage(result.error);
                setSuccess(false);
                setLoading(false);
                onShowStatus();
                return;
            }

            // Show the review component
            setGeneratedTerms(result);
            setShowReview(true);
            setLoading(false);
            
        } catch (error) {
            console.error('Term generation error:', error);
            setStatusMessage('Failed to generate terms. Please try again.');
            setSuccess(false);
            setLoading(false);
            onShowStatus();
        }
    };

    // Step 2: Create module and terms after professor approval
    const handleApproveTerms = async (approvedTerms: GeneratedTerm[]) => {
        setCreatingModule(true);
        
        try {
            // Step 2a: Create the module
            const groupID = permissionLevel === 'su' ? undefined : 
                           (currentClass.value === 0 ? classState?.value : currentClass.value);
            
            const moduleData = {
                name: moduleName,
                language: targetLanguage.value!,
                complexity: 2,
                ...(groupID && { groupID })
            };

            const moduleResult = await aiModuleService.createModule(moduleData, user!.jwt);
            
            if ('error' in moduleResult) {
                setStatusMessage(`Failed to create module: ${moduleResult.error}`);
                setSuccess(false);
                setCreatingModule(false);
                onShowStatus();
                return;
            }

            const moduleID = moduleResult.moduleID;
            
            // Step 2b: Create each term and attach to module
            for (const term of approvedTerms) {
                // Create term
                const termData = {
                    front: term.target_word,
                    back: term.native_word,
                    type: term.part_of_speech,
                    gender: term.gender,
                    language: targetLanguage.value!
                };

                const termResult = await aiModuleService.createTerm(termData, user!.jwt);
                
                if ('error' in termResult) {
                    console.error(`Failed to create term: ${term.target_word}`, termResult.error);
                    continue;
                }

                const termID = termResult.termID;

                // Step 2c: Attach term to module
                const attachData = {
                    moduleID,
                    termID,
                    ...(groupID && { groupID })
                };

                const attachResult = await aiModuleService.attachTerm(attachData, user!.jwt);
                
                if ('error' in attachResult) {
                    console.error(`Failed to attach term: ${term.target_word}`, attachResult.error);
                }
            }

            // Step 2d (Optional): Add module to group if groupID exists and different workflow
            // This might be redundant if groupID was passed during module creation
            // Uncomment if needed:
            // if (groupID) {
            //     await aiModuleService.addModuleToGroup({ moduleID, groupID }, user!.jwt);
            // }

            // Success!
            updateModuleList('add', moduleID);
            setStatusMessage(`AI module "${moduleName}" created successfully with ${approvedTerms.length} terms!`);
            setSuccess(true);
            setCreatingModule(false);
            setShowReview(false);
            setGeneratedTerms(null);
            onShowStatus();
            
        } catch (error) {
            console.error('Module creation error:', error);
            setStatusMessage('Failed to create module. Please try again.');
            setSuccess(false);
            setCreatingModule(false);
            onShowStatus();
        }
    };

    const handleCancelReview = () => {
        setShowReview(false);
        setGeneratedTerms(null);
    };

    const onShowStatus = () => {
        setStatus(true);
        window.setTimeout(() => {
            setStatus(false);
            if (success) {
                // Reset form on success
                setModuleName('');
                setPrompt('');
                setTargetLanguage({ label: undefined, value: undefined });
                setNativeLanguage({ label: undefined, value: undefined });
                setTermCount(20);
                if (targetLanguageRef.current) targetLanguageRef.current.clearValue();
                if (nativeLanguageRef.current) nativeLanguageRef.current.clearValue();
                setClassState(undefined);
                setSuccess(false);
                setStatusMessage('');
                setShowReview(false);
                setGeneratedTerms(null);
                onClose(); // Close the form after successful generation
            }
        }, 3000);
    };

    const renderStatus = () => {
        if (status) {
            return (
                <Alert color={success ? 'success' : 'danger'} isOpen={status}>
                    {loading && <Spinner size="sm" className="me-2" />}
                    {statusMessage}
                </Alert>
            );
        }
    };

    const filteredClassOptions = classOptions.filter((option) => option.value !== 0);

    return (
        <div>
            <Alert color='none' style={{ color: '#004085', backgroundColor: 'aliceblue' }}>
                {!showReview ? (
                    <Form onSubmit={handleGenerateTerms}>
                        {renderStatus()}
                        <Row>
                            <Col>
                                <FormGroup>
                                    <Label for='moduleName'>Module Name: *</Label>
                                    <Input 
                                        type='text' 
                                        placeholder='e.g., Spanish Animals Module' 
                                        value={moduleName} 
                                        onChange={(e) => setModuleName(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <FormGroup>
                                    <Label for='modulePrompt'>Module Description/Prompt: *</Label>
                                    <Input 
                                        type='textarea'
                                        rows={3}
                                        placeholder='Describe what you want in this module (e.g., "Common farm animals in Spanish with their genders")' 
                                        value={prompt} 
                                        onChange={(e) => setPrompt(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                    <small className="text-muted">
                                        Be specific about the topic, context, or type of vocabulary you want the AI to generate.
                                    </small>
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for='targetLang'>Target Language (to learn): *</Label>
                                    <Select
                                        name='targetLanguage'
                                        instanceId={'select-target-language'}
                                        options={languageCodeList}
                                        ref={targetLanguageRef}
                                        className='basic-single'
                                        classNamePrefix='select'
                                        isClearable={true}
                                        isDisabled={loading}
                                        onChange={(e) =>
                                            setTargetLanguage({
                                                label: e?.label as string,
                                                value: e?.value as LanguageCode
                                            })
                                        }
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for='nativeLang'>Native Language (translation base): *</Label>
                                    <Select
                                        name='nativeLanguage'
                                        instanceId={'select-native-language'}
                                        options={languageCodeList}
                                        ref={nativeLanguageRef}
                                        className='basic-single'
                                        classNamePrefix='select'
                                        isClearable={true}
                                        isDisabled={loading}
                                        onChange={(e) =>
                                            setNativeLanguage({
                                                label: e?.label as string,
                                                value: e?.value as LanguageCode
                                            })
                                        }
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <FormGroup>
                                    <Label for='termCount'>Number of Terms:</Label>
                                    <Input 
                                        type='number' 
                                        min={5} 
                                        max={100} 
                                        value={termCount} 
                                        onChange={(e) => setTermCount(parseInt(e.target.value))}
                                        disabled={loading}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        {currentClass.value === 0 && permissionLevel !== 'su' ? (
                            <Row>
                                <Col>
                                    <FormGroup>
                                        <Label for='classContext'>Class:</Label>
                                        <Select
                                            name='class'
                                            instanceId={'select-class-ai'}
                                            options={filteredClassOptions}
                                            className='basic-single'
                                            classNamePrefix='select'
                                            isClearable={true}
                                            value={classState}
                                            isDisabled={loading}
                                            onChange={(e) =>
                                                setClassState({
                                                    label: e?.label as string,
                                                    value: e?.value as number
                                                })
                                            }
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>
                        ) : null}
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
                                    disabled={loading}
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
                                    disabled={loading || !moduleName || !prompt || !targetLanguage.value || !nativeLanguage.value}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner size="sm" className="me-2" />
                                            Generating Terms...
                                        </>
                                    ) : (
                                        '🤖 Generate Terms with AI'
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                ) : (
                    <TermReviewComponent
                        terms={generatedTerms || []}
                        onApprove={handleApproveTerms}
                        onCancel={handleCancelReview}
                        loading={creatingModule}
                    />
                )}
            </Alert>
        </div>
    );
}
