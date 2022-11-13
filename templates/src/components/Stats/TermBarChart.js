import React, { Component } from 'react'
import { Bar } from 'react-chartjs-2'; 

class TermBarChart extends Component {
	constructor(props){
		super(props);
    }

    renderBarChart = () => {
        let filteredTerms = Object.entries(this.props.termStats).filter(([i, term]) => 
            term.correctness*100 >= this.props.threshold).map((term) => 
            {return ({front: term[1].front, percentage: term[1].correctness*100})});

        let percentage = (filteredTerms.length/Object.keys(this.props.termStats).length) * 100; 

        let chartColors = this.getColors(filteredTerms.length); 

        let performanceData = {
            labels: filteredTerms.map(term => term.front),
            datasets: [
            {
                label: 'Correctness (%)',
                data: filteredTerms.map(term => term.percentage.toFixed(2)),
                backgroundColor: chartColors
            }
            ]
        };

        return (
            <>
                <Bar 
                    data={performanceData}
                    options={
                        { 
                            scales: {
                                yAxes: [{
                                    ticks: {                  
                                        beginAtZero: true, 
                                        min: 0,
                                        max: 100,
                                        stepSize: 20,
                                        fontColor: 'black'
                                    }
                                }],
                                xAxes: [{
                                    ticks: {
                                        fontColor: 'black'
                                    }
                                }]
                            },
                            legend: {labels: { fontColor: 'black' } }
                        }     
                    }
                />
                <p style={{textAlign: "center", fontSize: "14px"}}>{percentage}% of the terms meet the threshold</p>
            </>
        )
    }

    getColors = (len) => {
        let list = []; 
        let possibleColors = ['#abc9cd', '#658e93', '#7abe80', '#ecf8b1', '#c7eab4', '#7fcdbb', '#40b6c4', '#1e91c0', '#225ea8', '#263494', '#091d58']; 

        let index = 0; 
        for (let i = 0; i < len; i++) {
            list.push(possibleColors[index]); 

            index++; 
            if(index >= possibleColors.length)
                index = 0; 
        }

        return list; 
    }


	render() { 
        return (
            this.renderBarChart()
        );
    }
}

export default TermBarChart