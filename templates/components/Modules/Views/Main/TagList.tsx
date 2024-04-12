import React from 'react';
import { Label, Row } from 'reactstrap';

import TagItem from './TagItem';
import { Tag } from '@/types/api/terms';

export default function TagList({ tags, handleDeleteTag, deletable }: { tags: Tag[]; handleDeleteTag: (tag: Tag) => void; deletable: boolean }) {
    //function that returns a list of tagItem elements
    const renderList = () => {
        let list = [];

        for (let i = 0; i < tags.length; i++) {
            list.push(<TagItem tag={tags[i]} key={i} handleDeleteTag={handleDeleteTag} deletable={deletable} />);
        }

        return list;
    };

    return (
        <div style={{ padding: 8 }}>
            <Label> Tags: </Label>
            <Row>{renderList()}</Row>
        </div>
    );
}
