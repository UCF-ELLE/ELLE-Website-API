import { MentorQuestion, MentorQuestionFrequency } from '@/types/api/mentors';
import { Module, ModuleQuestion, ModuleQuestionAnswer } from '@/types/api/modules';
import { useState } from 'react';
import { Card, CardHeader, Collapse } from 'reactstrap';
import CardList from './CardList';
import { Tag } from '@/types/api/terms';
import { QuestionFrame } from '@/types/api/pastagame';
import PastaModuleCardList from './Pasta/PastaModuleCardList';

export default function ModuleCardList({
    currentClass,
    curModule,
    terms,
    phrases,
    questions,
    mentorQuestions,
    questionFrames,
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
    questionFrames?: QuestionFrame[];
    updateCurrentModule: (module?: Module, task?: string) => void;
    allAnswers: ModuleQuestionAnswer[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
    frequency: Omit<MentorQuestionFrequency, 'moduleID'>[];
}) {
    const [activeTab, setActiveTab] = useState('terms');
    const [activePastaTabs, setActivePastaTabs] = useState(['questionFrames']);

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
                        <PastaModuleCardList
                            type={'questionFrames'}
                            questionFrames={questionFrames || []}
                            currentClass={currentClass}
                            curModule={curModule}
                            updateCurrentModule={updateCurrentModule}
                        />
                    </Collapse>
                </Card>
                <Card style={{ marginBottom: '1rem' }}>
                    <CardHeader onClick={() => togglePastaTab('pastas')} data-event={5}>
                        Pastas
                    </CardHeader>

                    <Collapse isOpen={activePastaTabs.includes('pastas')}>
                        <PastaModuleCardList
                            type={'pastas'}
                            questionFrames={questionFrames || []}
                            currentClass={currentClass}
                            curModule={curModule}
                            updateCurrentModule={updateCurrentModule}
                        />
                    </Collapse>
                </Card>
            </>
        );
    }

    return (
        <>
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
