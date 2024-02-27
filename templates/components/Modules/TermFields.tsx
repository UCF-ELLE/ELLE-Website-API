import React, { useState } from 'react';
import { Input } from 'reactstrap';
import { Term } from '@/types/api/terms';
import { Gender } from '@/types/misc';

type ImportTermsTerm = Omit<Term, 'termID'> & {
    selected: boolean;
};

export default function TermFields({
    term,
    index,
    handleOnFieldChange
}: {
    term: ImportTermsTerm;
    index: number;
    handleOnFieldChange: (index: number, term: ImportTermsTerm) => void;
}) {
    const [front, setFront] = useState(term.front);
    const [back, setBack] = useState(term.back);
    const [type, setType] = useState(term.type);
    const [gender, setGender] = useState(term.gender);

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const name = e.target.name;

        switch (name) {
            case 'front':
                setFront(value);
                break;
            case 'back':
                setBack(value);
                break;
            case 'type':
                setType(value);
                break;
            case 'gender':
                setGender(value as Gender);
                break;
        }

        handleOnFieldChange(index, {
            front: name === 'front' ? value : front,
            back: name === 'back' ? value : back,
            type: name === 'type' ? value : type,
            gender: name === 'gender' ? (value as Gender) : gender,
            selected: true
        });
    };

    return (
        <>
            <td>
                <Input name='front' onChange={(e) => handleOnChange(e)} value={term.front} />
            </td>
            <td>
                <Input name='back' onChange={(e) => handleOnChange(e)} value={term.back} />
            </td>
            <td>
                <Input name='type' onChange={(e) => handleOnChange(e)} value={term.type} />
            </td>
            <td>
                <Input name='gender' onChange={(e) => handleOnChange(e)} value={term.gender} />
            </td>
        </>
    );
}
