import React from 'react';
import { Oval } from 'react-loader-spinner';
import '@/public/static/css/spinner.css';

const Spinner = ({ chart, height = '100', width = '100' }: { chart: string; height?: string; width?: string }) => {
    return (
        <div
            className='spinner'
            style={{
                paddingTop: chart === 'performance' ? '50px' : '0px'
            }}
        >
            <Oval color='#3af0f9' height={height} width={width} />
        </div>
    );
};

export default Spinner;
