import React, { useState } from 'react';
import { Button } from 'reactstrap';
import axios from 'axios';
import { Module } from '@/types/api/modules';
import { useUser } from '@/hooks/useUser';

export default function ExistingModule({
    module,
    selectedClass,
    updateModuleList
}: {
    module: Module;
    selectedClass?: { value: number; label: string };
    updateModuleList: (task: string, moduleID?: number) => void;
}) {
    const { user } = useUser();
    const [linked, setLinked] = useState(false);

    const link = () => {
        const data = {
            moduleID: module.moduleID,
            groupID: selectedClass?.value
        };

        let header = {
            headers: { Authorization: 'Bearer ' + user?.jwt }
        };

        axios
            .post('/elleapi/addmoduletogroup', data, header)
            .then((res) => {
                setLinked(true);
                updateModuleList('add', module.moduleID);
            })
            .catch(function (error) {
                console.log(error.message);
            });
    };

    return (
        <tr>
            <td>{module.name}</td>
            <td>{module.language}</td>
            <td>{module.username}</td>
            <td>
                <Button size='sm' onClick={() => link()} disabled={linked ? true : false}>
                    {linked ? 'Linked' : 'Link'}
                </Button>
            </td>
        </tr>
    );
}
