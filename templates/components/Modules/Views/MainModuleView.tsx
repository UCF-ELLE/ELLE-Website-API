import {
    Module,
    ModuleQuestion,
    ModuleQuestionAnswer,
} from '@/types/api/modules';
import ModuleHeader from '../ModuleHeader';
import { MentorQuestion } from '@/types/api/mentors';
import { useState } from 'react';
import { Row, Col, Container } from 'reactstrap';
import ModuleToolRow from '../ModuleToolRow';

export default function MainModuleView({
    currentClass,
    curModule,
    questions,
    mentorQuestions,
    updateCurrentModule,
    allAnswers,
    modificationWarning,
    toggleModificationWarning,
}: {
    currentClass: { value: number; label: string };
    curModule: Module | undefined;
    questions: ModuleQuestion[];
    mentorQuestions: MentorQuestion[];
    updateCurrentModule: (module?: Module, task?: string) => void;
    allAnswers: ModuleQuestionAnswer[];
    modificationWarning: boolean;
    toggleModificationWarning: (condition: string) => void;
}) {
    const [searchCard, setSearchCard] = useState('');
    const [addTermButtonOpen, setAddTermButtonOpen] = useState(false);
    const [openForm, setOpenForm] = useState(0);

    const changeOpenForm = (form: number) => {
        if (form === openForm) {
            setOpenForm(0);
            return;
        } else setOpenForm(form);
    };

    return (
        <Row>
            <Col>
                <Container className="Deck">
                    <ModuleHeader
                        curModule={curModule}
                        searchCard={searchCard}
                        updateSearchCard={(e) =>
                            setSearchCard(e.target.value.substring(0, 20))
                        }
                        addTermButtonOpen={addTermButtonOpen}
                        toggleAddTermButton={() =>
                            setAddTermButtonOpen(!addTermButtonOpen)
                        }
                        changeOpenForm={changeOpenForm}
                    />
                    <ModuleToolRow
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        currentClass={currentClass}
                    />
                </Container>
            </Col>
        </Row>
    );
}
