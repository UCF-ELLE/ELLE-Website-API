import React from 'react';
import Loader from 'react-loader-spinner';
import Image from 'next/image';
import Spinner from './Spinner';

import csvImage from '@/public/static/images/csv.png';
import logImage from '@/public/static/images/log.png';

function DownloadSpinner({ loading, type }: { loading: boolean; type?: string }) {
    return loading ? (
        <Spinner chart='' height='30' width='40' />
    ) : type === 'sessionBtn' ? (
        <>
            <Image
                style={{
                    width: '25px',
                    height: '25px',
                    display: 'flex',
                    justifySelf: 'center',
                    margin: '5px 2px 0 2px'
                }}
                src={csvImage}
                alt='csv icon'
            />{' '}
            Sessions
        </>
    ) : (
        <>
            <Image
                style={{
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    justifySelf: 'center'
                }}
                src={logImage}
                alt='log icon'
            />{' '}
            Answers
        </>
    );
}

export default DownloadSpinner;
