import React, { useRef, useState } from 'react';
import Select, { SelectInstance } from 'react-select';
import { Alert, Button, Col, Form, FormGroup, Input, Label, Row, Spinner } from 'reactstrap';
import languageCodes from '@/public/static/json/languageCodes.json';
import { Language, LanguageCode } from '@/types/misc';
import { useUser } from '@/hooks/useAuth';
import { Module } from '@/types/api/modules';
import AIModuleService, { AIModuleGenerationParams } from '@/services/AIModuleService';

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
    const [name, setName] = useState<string>('');
    const [targetLanguage, setTargetLanguage] = useState<Language>({
        label: undefined,
        value: undefined
    });
    const [nativeLanguage, setNativeLanguage] = useState<Language>({
        label: undefined,
        value: undefined
    });
    const [numTerms, setNumTerms] = useState<number>(20);
    const [languageCodeList] = useState<Language[]>(getLanguageCodeList());
    const [classState, setClassState] = useState<{
        value: number;
        label: string;
    }>();
    const [status, setStatus] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    
    const targetLanguageRef = useRef<SelectInstance<Language>>(null);
    const nativeLanguageRef = useRef<SelectInstance<Language>>(null);
    const aiModuleService = new AIModuleService();
    
    console.log('AIModuleGenerationForm rendered', { user, permissionLevel });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!name || !targetLanguage.value || !nativeLanguage.value) {
            setStatusMessage('Please fill in all required fields');
            setSuccess(false);
            onShowStatus();
            return;
        }

        setLoading(true);
        setStatusMessage('Generating module with AI...');

        const generationParams: AIModuleGenerationParams = {
            name,
            targetLanguage: targetLanguage.value,
            nativeLanguage: nativeLanguage.value,
            numTerms,
            complexity: 2,
            groupID: permissionLevel === 'su' ? undefined : 
                     (currentClass.value === 0 ? classState?.value : currentClass.value)
        };

        try {
            const result = await aiModuleService.generateModule(generationParams, user!.jwt);
            
            if ('error' in result) {
                setStatusMessage(result.error);
                setSuccess(false);
                setLoading(false);
                onShowStatus();
                return;
            }

            // Update the module list with the new AI-generated module
            updateModuleList('add', result.moduleID);
            setStatusMessage(`AI module "${name}" generated successfully!`);
            setSuccess(true);
            setLoading(false);
            onShowStatus();
            
        } catch (error) {
            console.error('AI module generation error:', error);
            setStatusMessage('Failed to generate module. Please try again.');
            setSuccess(false);
            setLoading(false);
            onShowStatus();
        }
    };

    const onShowStatus = () => {
        setStatus(true);
        window.setTimeout(() => {
            setStatus(false);
            if (success) {
                // Reset form on success
                setName('');
                setTargetLanguage({ label: undefined, value: undefined });
                setNativeLanguage({ label: undefined, value: undefined });
                setNumTerms(20);
                if (targetLanguageRef.current) targetLanguageRef.current.clearValue();
                if (nativeLanguageRef.current) nativeLanguageRef.current.clearValue();
                setClassState(undefined);
                setSuccess(false);
                setStatusMessage('');
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
                <Form onSubmit={handleSubmit}>
                    {renderStatus()}
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='moduleName'>Module Name: *</Label>
                                <Input 
                                    type='text' 
                                    placeholder='AI Generated Module Name' 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
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
                    </Row>
                    <Row>
                        <Col>
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
                                <Label for='numTerms'>Number of Terms:</Label>
                                <Input 
                                    type='number' 
                                    min={5} 
                                    max={100} 
                                    value={numTerms} 
                                    onChange={(e) => setNumTerms(parseInt(e.target.value))}
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
                                disabled={loading || !name || !targetLanguage.value || !nativeLanguage.value}
                            >
                                {loading ? (
                                    <>
                                        <Spinner size="sm" className="me-2" />
                                        Generating...
                                    </>
                                ) : (
                                    '🤖 Generate with AI'
                                )}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Alert>
        </div>
    );
}