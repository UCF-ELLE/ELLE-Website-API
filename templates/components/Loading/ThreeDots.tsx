import React from 'react';
import { ThreeDots } from 'react-loader-spinner';
import '@/public/static/css/spinner.css';

const ThreeDotsComponent = () => {
    return (
        <div className='spinner'>
            <ThreeDots color='#3af0f9' height='55' width='62' />
        </div>
    );
};

export default ThreeDotsComponent;
