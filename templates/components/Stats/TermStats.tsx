import React from 'react';
import { Table } from 'reactstrap';
import { TermPerformance } from '@/types/api/stats';

export default function TermStats({ termStats }: { termStats: TermPerformance }) {
    return (
        <Table className='termStatsTable'>
            <thead>
                <tr>
                    <th>Term ID</th>
                    <th>Front</th>
                    <th>Back</th>
                    <th>Correctness</th>
                    <th>No. of Practice</th>
                    <th>Relevant Modules</th>
                </tr>
            </thead>
            <tbody>
                {termStats &&
                    Object.entries(termStats).map(([i, term]) => {
                        return (
                            <tr key={i}>
                                <td>{i}</td>
                                <td>{term.front}</td>
                                <td>{term.back}</td>
                                <td>{(term.correctness * 100).toFixed(2)}%</td>
                                <td>{term.count}</td>
                                <td>{term.modules && Object.values(term.modules).map((module) => module)}</td>
                            </tr>
                        );
                    })}
            </tbody>
        </Table>
    );
}
