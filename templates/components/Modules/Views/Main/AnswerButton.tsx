import React, { useState } from 'react';
import { Button } from 'reactstrap';

export default function AnswerButton({
    answer,
    handleDeleteAnswer,
    deletable
}: {
    answer: string;
    handleDeleteAnswer: (event: { answer: string }) => void;
    deletable: boolean;
}) {
    const [removeMode, setRemoveMode] = useState(false);

    //function that sets the style of the button, either removable or not
    const setStyle = () => {
        if (removeMode === false) {
            return { margin: '3px', border: '1px solid black' };
        } else {
            return {
                margin: '3px',
                border: '1px solid black',
                backgroundColor: 'red'
            };
        }
    };
    return deletable ? (
        <div>
            <Button
                style={setStyle()}
                color='secondary'
                onClick={() => {
                    handleDeleteAnswer({ answer: answer });
                }}
                onMouseOver={() => setRemoveMode(true)}
                onMouseOut={() => setRemoveMode(false)}
            >
                {answer}
            </Button>{' '}
        </div>
    ) : (
        <div>
            <Button style={setStyle()} color='secondary'>
                {answer}
            </Button>{' '}
        </div>
    );
}
