import React from 'react';
import { Bar } from 'react-chartjs-2';
import { TermPerformance } from '@/types/api/stats';
import { Chart, LinearScale, CategoryScale, BarElement, Legend } from 'chart.js';

export default function TermBarChart({ termStats, threshold }: { termStats: TermPerformance; threshold: number }) {
    Chart.register(LinearScale, CategoryScale, BarElement, Legend);

    const renderBarChart = () => {
        let filteredTerms = Object.entries(termStats)
            .filter(([i, term]) => term.correctness * 100 >= threshold)
            .map((term) => {
                return {
                    front: term[1].front,
                    percentage: term[1].correctness * 100
                };
            });

        let percentage = (filteredTerms.length / Object.keys(termStats).length) * 100;

        let chartColors = getColors(filteredTerms.length);

        let performanceData = {
            labels: filteredTerms.map((term) => term.front),
            datasets: [
                {
                    label: 'Correctness (%)',
                    data: filteredTerms.map((term) => term.percentage.toFixed(2)),
                    backgroundColor: chartColors
                }
            ]
        };

        return (
            <>
                <Bar
                    data={performanceData}
                    options={{
                        scales: {
                            yAxis: {
                                min: 0,
                                max: 100,
                                ticks: {
                                    stepSize: 20,
                                    color: 'black'
                                }
                            },
                            xAxis: {
                                ticks: {
                                    color: 'black'
                                }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: 'black' } }
                        }
                    }}
                />
                <p style={{ textAlign: 'center', fontSize: '14px' }}>{percentage}% of the terms meet the threshold</p>
            </>
        );
    };

    const getColors = (len: number) => {
        let list = [];
        let possibleColors = [
            '#abc9cd',
            '#658e93',
            '#7abe80',
            '#ecf8b1',
            '#c7eab4',
            '#7fcdbb',
            '#40b6c4',
            '#1e91c0',
            '#225ea8',
            '#263494',
            '#091d58'
        ];

        let index = 0;
        for (let i = 0; i < len; i++) {
            list.push(possibleColors[index]);

            index++;
            if (index >= possibleColors.length) index = 0;
        }

        return list;
    };

    return renderBarChart();
}
