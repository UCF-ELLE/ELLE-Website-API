import { Module, ModuleQuestionAnswer } from '@/types/api/modules';
import { Tag } from '@/types/api/terms';
import { Col, Collapse, Row } from 'reactstrap';
import AddExistingTerm from './AddExistingTerm';
import AddQuestion from './AddQuestion';
import AddTerm from './AddTerm';
import AddPhrase from './AddPhrase';
import AddMentorQuestion from './AddMentorQuestion';
import AddQuestionFrame from './Pasta/AddQuestionFrame';
import { QuestionFrame } from '@/types/api/pastagame';
import AddPasta from './Pasta/AddPasta';
import { useContext } from 'react';
import { PastaContext } from '@/hooks/usePasta';

export default function ModuleForms({
    currentClass,
    curModule,
    updateCurrentModule,
    deleteTag,
    addTag,
    allTags,
    allAnswers,
    openForm,
    setOpenForm,
    getAllTags,
    allAnswersNotInThisModule
}: {
    currentClass: { value: number; label: string };
    curModule: Module;
    updateCurrentModule: (module: Module, task?: string) => void;
    deleteTag: (tagList: Tag[], tag: Tag) => Tag[];
    addTag: (tagList: Tag[], tag: Tag) => Tag[];
    allTags: Tag[];
    allAnswers: ModuleQuestionAnswer[];
    openForm: number;
    setOpenForm: (num: number) => void;
    getAllTags: () => void;
    allAnswersNotInThisModule: ModuleQuestionAnswer[];
}) {
    return (
        <Row>
            <Col>
                {/*Form for adding a new Term*/}
                <Collapse isOpen={openForm === 2}>
                    <AddTerm
                        currentClass={currentClass}
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        setOpenForm={setOpenForm}
                    />
                </Collapse>

                {/*Form for adding an existing Term*/}
                <Collapse isOpen={openForm === 1}>
                    <AddExistingTerm
                        currentClass={currentClass}
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        allAnswers={allAnswersNotInThisModule}
                        setOpenForm={setOpenForm}
                    />
                </Collapse>

                {/*Form for adding a new Phrase*/}
                <Collapse isOpen={openForm === 3}>
                    <AddPhrase
                        currentClass={currentClass}
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        setOpenForm={setOpenForm}
                    />
                </Collapse>

                {/*Form for adding a new Question*/}
                <Collapse isOpen={openForm === 4}>
                    <AddQuestion
                        currentClass={currentClass}
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        allAnswers={allAnswers}
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        setOpenForm={setOpenForm}
                        getAllTags={getAllTags}
                        allAnswersNotInThisModule={allAnswersNotInThisModule}
                    />
                </Collapse>

                {/*Form for adding a new Mentor Question*/}
                <Collapse isOpen={openForm === 5}>
                    <AddMentorQuestion
                        currentClass={currentClass}
                        curModule={curModule}
                        updateCurrentModule={updateCurrentModule}
                        allAnswers={allAnswers}
                        allAnswersNotInThisModule={allAnswersNotInThisModule}
                        deleteTag={deleteTag}
                        addTag={addTag}
                        allTags={allTags}
                        setOpenForm={setOpenForm}
                        getAllTags={getAllTags}
                    />
                </Collapse>
                {/*Form for adding a Pasta Question Frame*/}
                <Collapse isOpen={openForm === 6}>
                    <AddQuestionFrame curModule={curModule} setOpenForm={setOpenForm} />
                </Collapse>
                <Collapse isOpen={openForm === 7}>
                    <AddPasta curModule={curModule} setOpenForm={setOpenForm} />
                </Collapse>
            </Col>
        </Row>
    );
}
