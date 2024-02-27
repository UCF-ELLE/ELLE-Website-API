import { Collapse, Input, Alert, Row, Button, Col, FormGroup, Label, Badge } from 'reactstrap';

export function IdentityQuestionForm({
    isOpen,
    category,
    leadup,
    setLeadup,
    deleteIdentityQuestion
}: {
    isOpen: boolean;
    category: string;
    leadup: string;
    setLeadup: (leadup: string) => void;
    deleteIdentityQuestion: () => void;
}) {
    return (
        <Row>
            <Collapse isOpen={isOpen}>
                <Alert color='info'>
                    <Row
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 12
                        }}
                    >
                        <div style={{ width: 'fit-content' }}>
                            <h3
                                style={{
                                    fontSize: 20,
                                    marginBottom: 0
                                }}
                            >
                                Identity Question
                            </h3>
                        </div>
                        <div style={{ width: 'fit-content' }}>
                            <Button
                                className='btn-sm'
                                color='danger'
                                style={{
                                    border: 'none',
                                    width: 'fit-content'
                                }}
                                onClick={() => deleteIdentityQuestion()}
                            >
                                Delete Identity Question
                            </Button>
                        </div>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='identityLeadup'>What to Identify:</Label>

                                <Input
                                    type='text'
                                    name='identityLeadup'
                                    onChange={(e) => setLeadup(e.target.value)}
                                    value={leadup}
                                    id='identityLeadup'
                                    placeholder='the root'
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>

                        <Col>
                            Example Identity Question Text: Identify <Badge>{leadup !== '' ? leadup : 'the root'}</Badge> of this{' '}
                            <Badge>{category !== '' ? category : 'word'}</Badge>.
                        </Col>
                    </Row>
                </Alert>
            </Collapse>
        </Row>
    );
}

export function MultipleChoiceQuestionForm({
    isOpen,
    questionText,
    setQuestionText,
    answers,
    setAnswers,
    deleteMultipleChoiceQuestion
}: {
    isOpen: boolean;
    questionText: string;
    answers: string[];
    setAnswers: (answers: string[]) => void;
    setQuestionText: (questionText: string) => void;
    deleteMultipleChoiceQuestion: () => void;
}) {
    return (
        <Row>
            <Collapse isOpen={isOpen}>
                <Alert color='info'>
                    <Row
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 12
                        }}
                    >
                        <div style={{ width: 'fit-content' }}>
                            <h3
                                style={{
                                    fontSize: 20,
                                    marginBottom: 0
                                }}
                            >
                                Multiple Choice Question
                            </h3>
                        </div>
                        <div style={{ width: 'fit-content' }}>
                            <Button
                                className='btn-sm'
                                color='danger'
                                style={{
                                    border: 'none',
                                    width: 'fit-content'
                                }}
                                onClick={deleteMultipleChoiceQuestion}
                            >
                                Delete Question
                            </Button>
                        </div>
                    </Row>
                    <Row>
                        <Col>
                            <FormGroup>
                                <Label for='questionText'>Question Text:</Label>

                                <Input
                                    type='text'
                                    name='questionText'
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    value={questionText}
                                    id='questionText'
                                    placeholder='Is it simple or complex?'
                                    autoComplete='off'
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    flexDirection: 'column',
                                    columnGap: 12,
                                    height: 180
                                }}
                            >
                                {answers.map((answer, index) => {
                                    return (
                                        <AnswerField key={`answer${index}`} index={index} answer={answer} answers={answers} setAnswers={setAnswers} />
                                    );
                                })}
                                {answers.length < 4 && (
                                    <Button
                                        className='btn-sm'
                                        color='info'
                                        style={{
                                            border: 'none',
                                            width: 'fit-content',
                                            marginTop: 12
                                        }}
                                        onClick={() => {
                                            const newAnswers = [...answers];
                                            newAnswers.push('');
                                            setAnswers(newAnswers);
                                        }}
                                    >
                                        Add Answer
                                    </Button>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Alert>
            </Collapse>
        </Row>
    );
}

function AnswerField({
    index,
    answer,
    answers,
    setAnswers
}: {
    index: number;
    answer: string;
    answers: string[];
    setAnswers: (answers: string[]) => void;
}) {
    return (
        <div
            key={index}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                maxWidth: '50%',
                gap: 12
            }}
        >
            <FormGroup
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1
                }}
            >
                <Label for={`answer${index}`} style={{ marginBottom: 4 }}>
                    Answer {index + 1}:
                </Label>

                <Input
                    type='text'
                    name={`answer${index}`}
                    onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[index] = e.target.value;
                        setAnswers(newAnswers);
                    }}
                    value={answer}
                    id={`answer${index}`}
                    placeholder='simple'
                    autoComplete='off'
                />
            </FormGroup>
            <Button
                className='btn-sm'
                color='danger'
                style={{
                    border: 'none',
                    alignSelf: 'center',
                    marginTop: 12,
                    visibility: index < 2 ? 'hidden' : 'visible'
                }}
                onClick={() => {
                    const newAnswers = [...answers];
                    newAnswers.splice(index, 1);
                    setAnswers(newAnswers);
                }}
            >
                Delete Answer
            </Button>
        </div>
    );
}
