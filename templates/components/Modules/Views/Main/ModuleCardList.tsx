import { MentorQuestion, MentorQuestionFrequency } from '@/types/api/mentors';
import { Module, ModuleQuestion, ModuleQuestionAnswer } from '@/types/api/modules';
import { useState } from 'react';
import { Card, CardHeader, Collapse } from 'reactstrap';
import CardList from './CardList';
import { Tag } from '@/types/api/terms';
import { Pasta, QuestionFrame } from '@/types/api/pastagame';
import PastaModuleCardList from './Pasta/PastaModuleCardList';
import GeneratedModuleTable from '../../GeneratedModuleTable';
import { GeneratedModuleContent } from '@/services/AIModuleService';

export default function ModuleCardList({
    currentClass,
    curModule,
    terms,
    phrases,
    questions,
    mentorQuestions,
    updateCurrentModule,
    allAnswers,
    addTag,
    deleteTag,
    allTags,
    frequency
}: {
    currentClass: { value: number; label: string };
    curModule: Module;
    terms: ModuleQuestionAnswer[];
    phrases: ModuleQuestionAnswer[];
    questions: ModuleQuestion[];
    mentorQuestions: MentorQuestion[];
    updateCurrentModule: (module?: Module, task?: string) => void;
    allAnswers: ModuleQuestionAnswer[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
    frequency: Omit<MentorQuestionFrequency, 'moduleID'>[];
}) {
    const [activeTab, setActiveTab] = useState('terms');
    const [activePastaTabs, setActivePastaTabs] = useState(['questionFrames']);
    
    // Check if this module was AI-generated (simple heuristic: name contains "AI" or has specific pattern)
    const isAIGeneratedModule = curModule?.name?.toLowerCase().includes('ai') || curModule?.name?.toLowerCase().includes('generated');
    
    // Mock AI-generated content - in a real implementation, this would come from the backend
    const aiGeneratedContent: GeneratedModuleContent = {
        terms: terms.map(term => ({
            front: term.front || '',
            back: term.back || '',
            type: term.type || 'TERM'
        })),
        phrases: phrases.map(phrase => ({
            front: phrase.front || '',
            back: phrase.back || '',
            type: phrase.type || 'PHRASE'
        }))
    };
    
    const handleAIContentUpdate = (updatedContent: GeneratedModuleContent) => {
        // This would typically trigger a refresh of the module data
        updateCurrentModule(curModule, 'update');
    };

    const toggleTab = (tab: string) => {
        if (activeTab !== tab) setActiveTab(tab);
        else setActiveTab('');
    };

    const togglePastaTab = (tab: string) => {
        if (activePastaTabs.includes(tab)) {
            setActivePastaTabs(activePastaTabs.filter((t) => t !== tab));
        } else {
            setActivePastaTabs([...activePastaTabs, tab]);
        }
    };

    if (curModule?.isPastaModule) {
        return (
            <>
                <Card style={{ marginBottom: '1rem' }}>
                    <CardHeader onClick={() => togglePastaTab('questionFrames')} data-event={4}>
                        Question Frames
                    </CardHeader>

                    <Collapse isOpen={activePastaTabs.includes('questionFrames')}>
                        <PastaModuleCardList type={'questionFrames'} curModule={curModule} />
                    </Collapse>
                </Card>
                <Card style={{ marginBottom: '1rem' }}>
                    <CardHeader onClick={() => togglePastaTab('pastas')} data-event={5}>
                        Pastas
                    </CardHeader>

                    <Collapse isOpen={activePastaTabs.includes('pastas')}>
                        <PastaModuleCardList type={'pastas'} curModule={curModule} />
                    </Collapse>
                </Card>
            </>
        );
    }

    return (
        <>
            {isAIGeneratedModule && (terms.length > 0 || phrases.length > 0) && (
                <Card style={{ marginBottom: '1rem', border: '2px solid #28a745' }}>
                    <CardHeader 
                        onClick={() => toggleTab('aiContent')} 
                        data-event={0}
                        style={{ backgroundColor: '#d4edda', color: '#155724' }}
                    >
                        🤖 AI Generated Content ({aiGeneratedContent.terms.length + (aiGeneratedContent.phrases?.length || 0)} items)
                    </CardHeader>
                    <Collapse isOpen={activeTab === 'aiContent'}>
                        <GeneratedModuleTable 
                            moduleID={curModule.moduleID} 
                            content={aiGeneratedContent}
                            onContentUpdate={handleAIContentUpdate}
                        />
                    </Collapse>
                </Card>
            )}
            <Card style={{ marginBottom: '1rem' }}>
                <CardHeader onClick={() => toggleTab('terms')} data-event={1}>
                    Terms
                </CardHeader>

                <Collapse isOpen={activeTab === 'terms'}>
                    <CardList
                        type={'terms'}
                        currentClass={currentClass}
                        cards={terms}
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        allAnswers={allAnswers}
                        frequency={frequency}
                    />
                </Collapse>
            </Card>
            <Card style={{ marginBottom: '1rem' }}>
                <CardHeader onClick={() => toggleTab('phrases')} data-event={2}>
                    Phrases
                </CardHeader>

                <Collapse isOpen={activeTab === 'phrases'}>
                    <CardList
                        type={'phrases'}
                        currentClass={currentClass}
                        cards={phrases}
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        allAnswers={allAnswers}
                        frequency={frequency}
                    />
                </Collapse>
            </Card>
            <Card style={{ marginBottom: '1rem' }}>
                <CardHeader onClick={() => toggleTab('questions')} data-event={3}>
                    Questions
                </CardHeader>

                <Collapse isOpen={activeTab === 'questions'}>
                    <CardList
                        type={'questions'}
                        currentClass={currentClass}
                        cards={questions}
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        allAnswers={allAnswers}
                        frequency={frequency}
                    />
                </Collapse>
            </Card>
            <Card style={{ marginBottom: '1rem' }}>
                <CardHeader onClick={() => toggleTab('mentorQuestions')} data-event={3}>
                    Mentor Questions
                </CardHeader>

                <Collapse isOpen={activeTab === 'mentorQuestions'}>
                    <CardList
                        type={'mentorQuestions'}
                        currentClass={currentClass}
                        cards={questions}
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        allAnswers={allAnswers}
                        frequency={frequency}
                        mentorQuestions={mentorQuestions}
                    />
                </Collapse>
            </Card>
        </>
    );
}
