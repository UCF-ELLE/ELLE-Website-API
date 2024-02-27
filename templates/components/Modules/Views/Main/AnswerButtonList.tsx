import React from 'react';
import { Row } from 'reactstrap';

import AnswerButton from './AnswerButton';

export default function AnswerButtonList({
    answers,
    handleDeleteAnswer,
    deletable
}: {
    answers: string[];
    handleDeleteAnswer: (event: { answer: string }) => void;
    deletable: boolean;
}) {
    //function that returns a list of AnswerButton elements
    const renderList = () => {
        let list = [];

        for (let i = 0; i < answers.length; i++) {
            list.push(<AnswerButton answer={answers[i]} key={i} handleDeleteAnswer={handleDeleteAnswer} deletable={deletable} />);
        }

        return list;
    };

    return (
        <div>
            <Row>{renderList()}</Row>
        </div>
    );
}
