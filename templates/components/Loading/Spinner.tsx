import React from 'react';
import { Oval } from 'react-loader-spinner';
import '@/public/static/css/spinner.css';

const Spinner = ({ chart }: { chart: string }) => {
    return (
        <div
            className="spinner"
            style={{
                paddingTop: chart === 'performance' ? '50px' : '0px',
                height: '100px',
            }}
        >
            <Oval color="#3af0f9" height="100" width="100" />
        </div>
    );
};

export default Spinner;
