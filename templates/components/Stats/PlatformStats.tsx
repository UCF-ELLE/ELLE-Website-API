import Spinner from '@/components/Loading/Spinner';
import ThreeDots from '@/components/Loading/ThreeDots';
import useAxios from '@/hooks/useAxios';
import { Bar, Pie } from 'react-chartjs-2';
import { Col, Row } from 'reactstrap';
import '../../../stylesheets/superadmin.css';

type PlatformStatsType = {
    mb: {
        avg_score: number;
        total_records_avail: number;
        frequency: number;
        avg_time_spent: string;
    };
    cp: {
        avg_score: number;
        total_records_avail: number;
        frequency: number;
        avg_time_spent: string;
    };
    vr: {
        avg_score: number;
        total_records_avail: number;
        frequency: number;
        avg_time_spent: string;
    };
}

export function PlatformStats() {
    const { response, error, loading } = useAxios<PlatformStatsType>({
        url: '/elleapi/platformstats',
        method: 'get',
        trigger: true,
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    });

    const renderPerformanceChart = () => {

        // check if response exists and or if loading
        if (error || loading || response === undefined) {
            return <Spinner chart="performance"/>
        }

        const { mb, cp, vr } = response.data;

        let performanceData = {
            labels: ["Mobile", "PC", "VR"],
            datasets: [
            {
                label: 'Average Score (%)',
                data: [
                    (mb.avg_score).toFixed(2), 
                    (cp.avg_score).toFixed(2), 
                    (vr.avg_score).toFixed(2)
                ],
                backgroundColor: ['#abc9cd', '#658e93', '#7abe80']
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
                            yAxis: {
                                    min: 0,
                                    max: 100,
                                    ticks: {
                                        color: 'white'
                                    }
                            },
                            xAxis: {
                                ticks: {
                                    color: 'white'
                                }
                            }
                        },
                        plugins: {
                            legend: {labels: { color: 'white' } }
                        }
                    }     
                }
            />
                <p style={{margin: "0 0 2px 0", display: "flex", justifyContent: "flex-end", fontSize: "12px"}}>
                    Total Records Available: Mobile({mb.total_records_avail}){' '}
                    PC({cp.total_records_avail}) VR({vr.total_records_avail})
                </p>
            </>
        )
    }

    const renderFrequencyChart = () => {

        // check if response exists and or if loading
        if (error || loading || response === undefined) {
            return <Spinner chart="frequency"/>
        }

        const { mb, cp, vr } = response.data;

        let frequencyData = {
                labels: ['Mobile', 'PC', 'VR'],
                datasets: [
                    {
                        label: 'Platforms',
                        data: [
                            (mb.frequency * 100).toFixed(2), 
                            (cp.frequency * 100).toFixed(2), 
                            (vr.frequency * 100).toFixed(2)
                        ],
                        backgroundColor: ['#96384e', '#eda48e', '#eed284']
                    }
                ]
        };
    
        return (
          <Pie
            data={frequencyData}
            options={
                {
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: 'white'
                            }
                        }
                     }
                }
            }
          />
        )
    }

    const renderPlatformDurations = () => {

        // check if response exists and or if loading
        if (error || loading || response === undefined) {
            return <ThreeDots />
        }

        let platformDuration = []; 
        platformDuration = formatTime(); 

        return (
            <>
            <li style={{fontSize: "14px"}}>Mobile: {platformDuration[0]}</li>
            <li style={{fontSize: "14px"}}>PC: {platformDuration[1]}</li>
            <li style={{fontSize: "14px"}}>VR: {platformDuration[2]}</li>
            </>
        )

    }

    const timeToString = (time: string) => {
        let str = ""; 
        let hoursMinutesSeconds = time.split(/[.:]/);
        let hours = parseInt(hoursMinutesSeconds[0]) > 0 ? parseInt(hoursMinutesSeconds[0]) + "hrs " : ""; 
        let minutes = parseInt(hoursMinutesSeconds[1]) > 0 ? parseInt(hoursMinutesSeconds[1]) + "min " : ""; 
        let seconds = parseInt(hoursMinutesSeconds[2]) > 0 ? parseInt(hoursMinutesSeconds[2]) + "s" : "";      

        str = hours + minutes + seconds; 
        return str; 
    }

    const formatTime = () => {

        // check if response exists and or if loading
        if (error || loading || response === undefined) {
            return [];
        }

        const { mb, cp, vr } = response.data;

        let durations = [];
        let mbAvgDuration = timeToString(mb.avg_time_spent);
        let cpAvgDuration = timeToString(cp.avg_time_spent); 
        let vrAvgDuration = timeToString(vr.avg_time_spent); 

        durations.push(mbAvgDuration);
        durations.push(cpAvgDuration);
        durations.push(vrAvgDuration);

        return durations; 
    }

        return (
            <>
                <Col className="Platform Left Column" xs="4">
                    <Row>
                        <div className="suCardGreen">
                            Average Platform Duration
                            {renderPlatformDurations()}
                        </div>
                    </Row>
                    <br />
                    <Row>
                        <div className="suCardBlue">
                            Average Platform Frequency 
                            {renderFrequencyChart()}
                        </div>
                    </Row>
                </Col>

                <Col className="Platform Right Column">
                    <div className="suCardGreen">
                        Average Platform Performance
                        {renderPerformanceChart()}
                    </div>
                </Col>
            </>
        );
    }

export default PlatformStats
