import { Module, ModuleQuestion, ModuleQuestionAnswer } from '@/types/api/modules';
import ModuleHeader from './ModuleHeader';
import { MentorQuestion, MentorQuestionFrequency } from '@/types/api/mentors';
import { createContext, useCallback, useEffect, useState } from 'react';
import { Row, Col, Container } from 'reactstrap';
import ModuleToolRow from './ModuleToolRow';
import { useUser } from '@/hooks/useAuth';
import axios from 'axios';
import { Tag } from '@/types/api/terms';
import ModuleCardList from './ModuleCardList';
import ModuleForms from './Forms/ModuleForms';
import { QuestionFrame } from '@/types/api/pastagame';
import { PastaContext, usePasta } from '@/hooks/usePasta';

export default function MainModuleView({
    currentClass,
    curModule,
    questions,
    mentorQuestions,
    updateCurrentModule,
    allAnswers,
    modificationWarning,
    toggleModificationWarning
}: {
    currentClass: { value: number; label: string };
    curModule: Module;
    questions: ModuleQuestion[];
    mentorQuestions: MentorQuestion[];
    updateCurrentModule: (module?: Module, task?: string) => void;
    allAnswers: ModuleQuestionAnswer[];
    modificationWarning: boolean;
    toggleModificationWarning: (condition: string) => void;
}) {
    const { user, loading } = useUser();
    const [searchCard, setSearchCard] = useState('');
    const [addTermButtonOpen, setAddTermButtonOpen] = useState(false);
    const [openForm, setOpenForm] = useState(0);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [freq, setFreq] = useState<Omit<MentorQuestionFrequency, 'moduleID'>[]>([]);
    const pastaHook = usePasta(curModule?.moduleID);

    const changeOpenForm = (form: number) => {
        if (form === openForm) {
            setOpenForm(0);
            return;
        } else setOpenForm(form);
    };

    const addTag = (tagList: Tag[], tag: Tag) => {
        let tempTagList = tagList;

        tempTagList.push(tag);

        return tempTagList;
    };

    const deleteTag = (tagList: Tag[], tag: Tag) => {
        if (tagList === undefined) {
            return [];
        }

        let tempTagList = tagList;

        let tagIndex = tempTagList.indexOf(tag);

        if (tagIndex !== -1) {
            tempTagList.splice(tagIndex, 1);
        }

        return tempTagList;
    };

    const getAllTags = useCallback(() => {
        const header = {
            headers: {
                Authorization: `Bearer ${user?.jwt}`
            }
        };

        axios
            .get<{ tags: Tag[] }>('/elleapi/tags', header)
            .then((res) => {
                const data = res.data;

                setAllTags(data.tags);
            })
            .catch((err) => {
                console.log('error in getAllTags(): ', err);
            });
    }, [user?.jwt]);

    useEffect(() => {
        if (loading || !user) return;

        getAllTags();

        const header = {
            headers: {
                Authorization: `Bearer ${user?.jwt}`
            }
        };
        let data = {
            module_id: curModule?.moduleID
        };

        axios
            .post<MentorQuestionFrequency[]>('/elleapi/getmentorquestionfrequency', data, header)
            .then((res) => {
                if (res.data.length > 0) {
                    setFreq(res.data);
                } else {
                    setFreq([{ incorrectCardsFreq: 0, correctCardsFreq: 0, time: 0 }]);
                }
            })
            .catch((err) => {
                console.log('error in getMentorQuestionFrequency(): ', err.response);
            });
    }, [curModule.moduleID, getAllTags, loading, user]);

    const terms: ModuleQuestionAnswer[] = [];
    const phrases: ModuleQuestionAnswer[] = [];
    const longformQuestions: ModuleQuestion[] = [];

    questions.map((question) => {
        if (question.type === 'MATCH' && question.answers !== undefined) {
            terms.push(question.answers[0]);
        } else if (question.type === 'PHRASE' && question.answers !== undefined) {
            phrases.push(question.answers[0]);
        } else if (question.type === 'LONGFORM') {
            longformQuestions.push(question);
        }
    });

    const termIDArray = terms.map((term) => term.termID);

    const allAnswersNotInThisModule = allAnswers.filter((answer) => {
        if (termIDArray.indexOf(answer.termID) === -1) {
            return true;
        } else {
            return false;
        }
    });

    const filteredTerms = terms.filter(
        (term) => term.front?.toLowerCase().includes(searchCard.toLowerCase()) || term.back?.toLowerCase().includes(searchCard.toLowerCase())
    );

    const filteredPhrases = phrases.filter(
        (phrase) => phrase.front?.toLowerCase().includes(searchCard.toLowerCase()) || phrase.back?.toLowerCase().includes(searchCard.toLowerCase())
    );

    const filteredQuestions = longformQuestions.filter((question) => question.questionText?.toLowerCase().includes(searchCard.toLowerCase()));

    return (
        <PastaContext.Provider value={pastaHook}>
            <Row>
                <Col>
                    <Container className='Deck'>
                        <ModuleHeader
                            curModule={curModule}
                            searchCard={searchCard}
                            updateSearchCard={(e) => setSearchCard(e.target.value.substring(0, 20))}
                            addTermButtonOpen={addTermButtonOpen}
                            toggleAddTermButton={() => setAddTermButtonOpen(!addTermButtonOpen)}
                            changeOpenForm={changeOpenForm}
                        />
                        <ModuleToolRow curModule={curModule} updateCurrentModule={updateCurrentModule} currentClass={currentClass} />
                        <ModuleForms
                            currentClass={currentClass}
                            curModule={curModule}
                            updateCurrentModule={updateCurrentModule}
                            deleteTag={deleteTag}
                            addTag={addTag}
                            allTags={allTags}
                            allAnswers={allAnswers}
                            openForm={openForm}
                            setOpenForm={(num: number) => setOpenForm(num)}
                            getAllTags={getAllTags}
                            allAnswersNotInThisModule={allAnswersNotInThisModule}
                        />
                        <ModuleCardList
                            currentClass={currentClass}
                            curModule={curModule}
                            terms={filteredTerms}
                            phrases={filteredPhrases}
                            questions={filteredQuestions}
                            mentorQuestions={mentorQuestions}
                            updateCurrentModule={updateCurrentModule}
                            allAnswers={allAnswers}
                            deleteTag={deleteTag}
                            addTag={addTag}
                            allTags={allTags}
                            frequency={freq}
                        />
                    </Container>
                </Col>
            </Row>
        </PastaContext.Provider>
    );
}
