import { Tag } from '@/types/api/terms';
import React, { useState } from 'react';
import { Button } from 'reactstrap';

export default function TagItem({ tag, handleDeleteTag, deletable }: { tag: Tag; handleDeleteTag: (tag: Tag) => void; deletable: boolean }) {
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
                    handleDeleteTag(tag);
                }}
                onMouseOver={() => setRemoveMode(true)}
                onMouseOut={() => setRemoveMode(false)}
            >
                {tag}
            </Button>{' '}
        </div>
    ) : (
        <div>
            <Button style={setStyle()} color='secondary'>
                {tag}
            </Button>{' '}
        </div>
    );
}
