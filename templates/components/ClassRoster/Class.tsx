import React, { Component, useRef, useState } from 'react';
import UserComponent from '../UserList/UserComponent';
import { Table } from 'reactstrap';
import { GroupUser } from '@/types/api/group';
import Image from 'next/image';

import searchImage from '@/public/static/images/search.png';

const styles = {
    transition: 'all .5s ease-out'
};

export default function Class({
    group,
    currentGroup
}: {
    group: {
        groupID: number;
        groupName: string;
        groupColor: string;
        group_users: GroupUser[];
    };
    currentGroup: string;
}) {
    const [search, setSearch] = useState('');
    const [width, setWidth] = useState('0px');
    const [marginLeft, setMarginLeft] = useState('160px');
    const [close, setClose] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);

    const onExpand = () => {
        setMarginLeft(marginLeft === '160px' ? '0px' : '160px');
        setWidth(width === '0px' ? '160px' : '0px');
        setClose(!close);

        //if the current state of the button is close then that means the button has been toggled to open so focus the input
        if (close) inputRef.current?.focus();
    };

    const updateSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value.substring(0, 20));
    };

    let filteredStudent = group.group_users.filter((student) => {
        return student.username.toLowerCase().indexOf(search.toLowerCase()) !== -1;
    });

    filteredStudent.filter((student) => student.accessLevel === currentGroup);

    return (
        <Table hover className='classTable'>
            <thead>
                {group.group_users.length !== 0 ? (
                    <tr>
                        <th>Student ID</th>
                        <th>Username</th>
                        <th>
                            <button
                                style={{
                                    ...styles,
                                    marginLeft: marginLeft,
                                    backgroundColor: 'transparent',
                                    borderStyle: 'hidden',
                                    outline: 'none'
                                }}
                                onClick={() => onExpand()}
                            >
                                <Image src={searchImage} alt='Icon made by Freepik from www.flaticon.com' style={{ width: '15px', height: '15px' }} />
                            </button>

                            <input
                                placeholder='Search for a student'
                                style={{
                                    ...styles,
                                    width: width,
                                    borderStyle: 'hidden hidden solid',
                                    padding: '0px',
                                    background: 'transparent',
                                    outline: 'none'
                                }}
                                value={search}
                                onChange={updateSearch}
                                ref={inputRef}
                                onBlur={() => onExpand()}
                            />
                        </th>
                    </tr>
                ) : null}
            </thead>

            <tbody>
                {group.group_users.length !== 0 ? (
                    filteredStudent.length !== 0 ? (
                        filteredStudent.map((user) => {
                            return <UserComponent key={user.userID} user={user} type='pf' />;
                        })
                    ) : (
                        <tr>
                            <td colSpan={3}>{search} cannot be found in this class.</td>
                        </tr>
                    )
                ) : (
                    <tr>
                        <td colSpan={3}>You currently have no {currentGroup === 'st' ? 'students' : 'TAs'}</td>
                    </tr>
                )}
            </tbody>
        </Table>
    );
}
