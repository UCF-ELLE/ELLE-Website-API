import React, {
    MouseEventHandler,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Container,
    Row,
    Col,
    Input,
    InputGroup,
    InputGroupText,
    Button,
    ButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Collapse,
    Card,
    CardHeader,
    Alert,
} from 'reactstrap';

import { Badge } from 'reactstrap';

import CardList from './CardList';
import axios from 'axios';

import AddTerm from './AddTerm';
import AddExistingTerm from './AddExistingTerm';

import AddQuestion from './AddQuestion';
import AddMentorQuestion from './AddMentorQuestion';
import AddPhrase from './AddPhrase';
import ImportTerms from './ImportTerms';
import Manual from './Manual';
import { useUser } from '@/hooks/useUser';
import Image from 'next/image';
import searchImage from '@/public/static/images/search.png';

import {
    Module,
    ModuleQuestion,
    ModuleQuestionAnswer,
} from '@/types/api/modules';
import { Tag, Term } from '@/types/api/terms';
import { LoggedAnswer } from '@/types/api/logged_answer';
import { EventType } from '@/types/events';
import { MentorQuestion, MentorQuestionFrequency } from '@/types/api/mentors';

export default function Module({
    curModule,
    updateCurrentModule,
    cards,
    allAnswers,
    mentorQuestions,
    currentClass,
    modificationWarning,
    toggleModificationWarning,
}: {
    curModule: Module;
    updateCurrentModule: (event: EventType) => void;
    cards: ModuleQuestion[];
    allAnswers: LoggedAnswer[];
    mentorQuestions: MentorQuestion[];
    currentClass: { value: number; label: string };
    modificationWarning: boolean;
    toggleModificationWarning: MouseEventHandler;
}) {
    const [searchCard, setSearchCard] = useState('');
    const [collapseNewCard, setCollapseNewCard] = useState(false);
    const [collapseNewPhrase, setCollapseNewPhrase] = useState(false);
    const [collapseNewQuestion, setCollapseNewQuestion] = useState(false);
    const [collapseExistingCard, setCollapseExistingCard] = useState(false);
    const [addTermButtonOpen, setAddTermButtonOpen] = useState(false);
    const [collapseTab, setCollapseTab] = useState(-1);
    const [tabs, setTabs] = useState([0, 1, 2, 3]);
    const [openForm, setOpenForm] = useState(0);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [freq, setFreq] = useState<MentorQuestionFrequency[]>([]);
    const [id, setId] = useState(curModule.moduleID);
    const [name, setName] = useState(curModule.name);
    const [language, setLanguage] = useState(curModule.language);
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    //gets all the tags in the database
    const getAllTags = useCallback(() => {
        let allTagsInDB = [];

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        axios
            .get('/elleapi/tags', header)
            .then((res) => {
                allTagsInDB = res.data;

                setAllTags(allTagsInDB.tags);
            })
            .catch((error) => {
                console.log('error in getAllTags(): ', error);
            });
    }, [user?.jwt]);

    useEffect(() => {
        getAllTags();

        let data = {
            module_id: curModule.moduleID,
        };

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt },
        };

        axios
            .post('/elleapi/getmentorquestionfrequency', data, header)
            .then((res) => {
                // If the module doesn't have mentor settings set, pre-fill the fields with "0"
                if (res.data.length > 0) {
                    setFreq(res.data);
                } else {
                    setFreq([
                        {
                            incorrectCardsFreq: 0,
                            correctCardsFreq: 0,
                            time: 0,
                            moduleID: -1,
                        },
                    ]);
                }
            })
            .catch((error) => {
                console.log(
                    'getmentorquestionfrequency error: ',
                    error.response
                );
            });
    }, [curModule.moduleID, getAllTags, user?.jwt]);

    //TODO: consider moving this stub of a function into the components that use them
    //function for adding a tag to a list of tags
    const addTag = (tagList: Tag[], tag: Tag) => {
        let tempTagList = tagList;

        tempTagList.push(tag);

        return tempTagList;
    };

    //TODO: consider moving this into the components that actually have access to the tags in question
    //fumction for deleting a tag from a list of tags
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

    //function for changing the searchbar for cards
    const updateSearchCard = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchCard(e.target.value.substring(0, 20));
    };

    const toggleTab = (e: React.MouseEvent<HTMLElement>) => {
        let event = e.currentTarget.dataset.event;

        //if the accordion clicked on is equal to the current accordion that's open then close the current accordion,
        //else open the accordion you just clicked on
        setCollapseTab(collapseTab === Number(event) ? -1 : Number(event));
    };

    //function that determines if the Add Term button is open
    const toggleAddTermButton = () => {
        setAddTermButtonOpen(!addTermButtonOpen);
    };

    //function that determines which form is open
    const changeOpenForm = (openedForm: number) => {
        //if the form is open at the moment then close it by setting it back to form 0, which is the closed state
        if (openForm === openedForm) {
            setOpenForm(0);
        } else {
            //else set the state of the open form to the form # that you want to open
            setOpenForm(openedForm);
        }
    };

    //Variables that store the differnt types of cards in the module
    let terms = cards
        .filter(
            (card) =>
                card.type?.toLowerCase() === 'match' &&
                card.answers &&
                card.answers[0] !== undefined
        )
        .map((card, i) => {
            return card.answers ? card.answers[0] : null;
        });

    let phrases = cards
        .filter((card) => card.type.toLowerCase() === 'phrase')
        .map((card, i) => {
            return card.answers ? card.answers[0] : null;
        });

    let questions = cards
        .filter((card) => card.type.toLowerCase() === 'longform')
        .map((card, i) => {
            return card;
        });

    //Gets all answers not in this module
    let termIDArray = terms.map((term) => term?.termID);

    let allAnswersNotInThisModule = allAnswers.filter((answer) => {
        if (termIDArray.indexOf(answer.termID) === -1) {
            return true;
        } else {
            return false;
        }
    });

    ////Variable that stores all of the terms that contain a substring that matches searchCard
    let filteredTerms = terms.filter((term) => {
        if (term)
            return (
                term.front.toLowerCase().indexOf(searchCard.toLowerCase()) !==
                    -1 ||
                term.back.toLowerCase().indexOf(searchCard.toLowerCase()) !== -1
            );
    });

    //Variable that stores all of the phrases that contain a substring that matches searchCard
    let filteredPhrases = phrases.filter((phrase) => {
        if (phrase)
            return (
                phrase.front.toLowerCase().indexOf(searchCard.toLowerCase()) !==
                    -1 ||
                phrase.back.toLowerCase().indexOf(searchCard.toLowerCase()) !==
                    -1
            );
        else return null;
    });

    //Variable that stores all of the questions that contain a substring that matches searchCard
    let filteredQuestions = questions.filter((question) => {
        if (question) {
            return (
                question.questionText
                    .toLowerCase()
                    .indexOf(searchCard.toLowerCase()) !== -1
            );
        } else return null;
    });

    return (
        <Container className="Deck">
            <Row className="Header" style={{ marginBottom: '15px' }}>
                {/*Search Bar for all cards in a deck, with the buttons for adding new items as appendages*/}
                <InputGroup style={{ borderRadius: '12px' }}>
                    <div>
                        <InputGroupText
                            id="module-name"
                            style={{ border: 'none' }}
                        >
                            {curModule.name}
                        </InputGroupText>
                    </div>
                    <div style={{ margin: '10px' }}>
                        <Image
                            src={searchImage}
                            alt="Icon made by Freepik from www.flaticon.com"
                            style={{ width: '15px', height: '15px' }}
                        />
                    </div>
                    <Input
                        style={{ border: 'none' }}
                        type="text"
                        placeholder="Search"
                        value={searchCard}
                        onChange={(e) => updateSearchCard(e)}
                    />

                    {permissionLevel !== 'st' ? (
                        <>
                            {/* The button for the Add Term forms */}
                            <div>
                                <ButtonDropdown
                                    isOpen={addTermButtonOpen}
                                    toggle={toggleAddTermButton}
                                >
                                    <DropdownToggle
                                        style={{
                                            backgroundColor: '#3e6184',
                                            borderRadius: '0px',
                                        }}
                                        caret
                                    >
                                        Add Term
                                    </DropdownToggle>
                                    <DropdownMenu>
                                        <DropdownItem
                                            onClick={() => changeOpenForm(1)}
                                        >
                                            {' '}
                                            Add Existing
                                        </DropdownItem>
                                        <DropdownItem
                                            onClick={() => changeOpenForm(2)}
                                        >
                                            {' '}
                                            Add New
                                        </DropdownItem>
                                    </DropdownMenu>
                                </ButtonDropdown>
                            </div>

                            {/* The button for the Add Phrase form */}
                            <div>
                                <Button
                                    style={{ backgroundColor: '#3e6184' }}
                                    onClick={() => changeOpenForm(3)}
                                >
                                    Add Phrase
                                </Button>
                            </div>

                            {/* The button for the Add Question form */}
                            <div>
                                <Button
                                    style={{ backgroundColor: '#3e6184' }}
                                    onClick={() => changeOpenForm(4)}
                                >
                                    Add Question
                                </Button>
                            </div>

                            {/* The button for the Add Mentor Question form */}
                            <div>
                                <Button
                                    style={{ backgroundColor: '#3e6184' }}
                                    onClick={() => changeOpenForm(5)}
                                >
                                    Add Mentor Question
                                </Button>
                            </div>
                        </>
                    ) : null}
                </InputGroup>
            </Row>

            <Row style={{ marginBottom: '8px' }}>
                <Col>
                    <Badge pill variant="info">
                        Module ID: {curModule.moduleID}
                    </Badge>{' '}
                    <Badge pill variant="info">
                        Language: {curModule.language}
                    </Badge>
                </Col>
                {permissionLevel !== 'st' ? (
                    <Col
                        style={{ display: 'flex', justifyContent: 'flex-end' }}
                    >
                        <Manual />
                        <ImportTerms
                            module={curModule}
                            updateCurrentModule={updateCurrentModule}
                            currentClass={currentClass}
                        />
                    </Col>
                ) : null}
            </Row>

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
                            setOpenForm={changeOpenForm}
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
                            setOpenForm={changeOpenForm}
                        />
                    </Collapse>

                    {/*Form for adding a new Phrase*/}
                    <Collapse isOpen={openForm === 3}>
                        <AddPhrase
                            currentClass={currentClass}
                            curModule={curModule}
                            updateCurrentModule={updateCurrentModule}
                            setOpenForm={changeOpenForm}
                        />
                    </Collapse>

                    {/*Form for adding a new Question*/}
                    <Collapse isOpen={openForm === 4}>
                        <AddQuestion
                            currentClass={currentClass}
                            curModule={curModule}
                            updateCurrentModule={updateCurrentModule}
                            allAnswers={allAnswers}
                            allAnswersNotInThisModule={
                                allAnswersNotInThisModule
                            }
                            deleteTag={deleteTag}
                            addTag={addTag}
                            allTags={allTags}
                            setOpenForm={changeOpenForm}
                            getAllTags={getAllTags}
                        />
                    </Collapse>

                    {/*Form for adding a new Mentor Question*/}
                    <Collapse isOpen={openForm === 5}>
                        <AddMentorQuestion
                            currentClass={currentClass}
                            curModule={curModule}
                            updateCurrentModule={updateCurrentModule}
                            allAnswers={allAnswers}
                            allAnswersNotInThisModule={
                                allAnswersNotInThisModule
                            }
                            deleteTag={deleteTag}
                            addTag={addTag}
                            allTags={allTags}
                            setOpenForm={changeOpenForm}
                            getAllTags={getAllTags}
                        />
                    </Collapse>
                </Col>
            </Row>

            <Row>
                <Alert
                    color="info"
                    style={{ marginLeft: '15px' }}
                    isOpen={modificationWarning}
                    toggle={toggleModificationWarning}
                >
                    Modifying anything in this module will affect all the users
                    who are currently using this module as well.
                </Alert>
            </Row>

            {tabs.map((index, i) => {
                if (index === 0) {
                    //Terms Accordion
                    return (
                        <Card key={i} style={{ marginBottom: '1rem' }}>
                            <CardHeader onClick={toggleTab} data-event={index}>
                                Terms
                            </CardHeader>

                            <Collapse isOpen={collapseTab === index}>
                                <CardList
                                    type={0}
                                    currentClass={currentClass}
                                    cards={
                                        filteredTerms as ModuleQuestionAnswer[]
                                    }
                                    curModule={curModule}
                                    updateCurrentModule={updateCurrentModule}
                                    deleteTag={deleteTag}
                                    addTag={addTag}
                                    allTags={allTags}
                                    freq={freq}
                                />
                            </Collapse>
                        </Card>
                    );
                } else if (index === 1) {
                    //Phrases Accordion
                    return (
                        <Card key={i} style={{ marginBottom: '1rem' }}>
                            <CardHeader onClick={toggleTab} data-event={index}>
                                Phrases
                            </CardHeader>

                            <Collapse isOpen={collapseTab === index}>
                                <CardList
                                    type={1}
                                    currentClass={currentClass}
                                    cards={
                                        filteredPhrases as ModuleQuestionAnswer[]
                                    }
                                    curModule={curModule}
                                    updateCurrentModule={updateCurrentModule}
                                    freq={freq}
                                    addTag={addTag}
                                    deleteTag={deleteTag}
                                    allTags={allTags}
                                />
                            </Collapse>
                        </Card>
                    );
                } else if (index === 2) {
                    //Questions Accordion
                    return (
                        <Card key={i} style={{ marginBottom: '1rem' }}>
                            <CardHeader onClick={toggleTab} data-event={index}>
                                Questions
                            </CardHeader>

                            <Collapse isOpen={collapseTab === index}>
                                <CardList
                                    type={2}
                                    currentClass={currentClass}
                                    cards={filteredQuestions}
                                    curModule={curModule}
                                    updateCurrentModule={updateCurrentModule}
                                    allAnswers={allAnswers}
                                    deleteTag={deleteTag}
                                    addTag={addTag}
                                    allTags={allTags}
                                    freq={freq}
                                />
                            </Collapse>
                        </Card>
                    );
                } else {
                    //Mentor Questions Accordion
                    return (
                        <Card key={i} style={{ marginBottom: '1rem' }}>
                            <CardHeader onClick={toggleTab} data-event={index}>
                                Mentor Questions
                            </CardHeader>

                            <Collapse isOpen={collapseTab === index}>
                                <CardList
                                    type={3}
                                    currentClass={currentClass}
                                    cards={filteredQuestions}
                                    curModule={curModule}
                                    updateCurrentModule={updateCurrentModule}
                                    allAnswers={allAnswers}
                                    deleteTag={deleteTag}
                                    addTag={addTag}
                                    allTags={allTags}
                                    mentorQuestions={mentorQuestions}
                                    freq={freq}
                                />
                            </Collapse>
                        </Card>
                    );
                }
            })}

            <Row>
                <br />
            </Row>
        </Container>
    );
}
