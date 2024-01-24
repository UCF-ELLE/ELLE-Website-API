import { MentorQuestion, MentorQuestionFrequency } from '@/types/api/mentors';
import {
    Module,
    ModuleQuestion,
    ModuleQuestionAnswer,
} from '@/types/api/modules';
import { useState } from 'react';
import { Card, CardHeader, Collapse } from 'reactstrap';
import CardList from './CardList';
import { Tag } from '@/types/api/terms';

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
    frequency,
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

    const toggleTab = (tab: string) => {
        console.log(tab, activeTab);
        if (activeTab !== tab) setActiveTab(tab);
        else setActiveTab('');
    };

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
                <CardHeader
                    onClick={() => toggleTab('questions')}
                    data-event={3}
                >
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
                <CardHeader
                    onClick={() => toggleTab('mentorQuestions')}
                    data-event={3}
                >
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
