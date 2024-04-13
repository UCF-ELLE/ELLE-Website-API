import React, { useMemo } from 'react';
import Image from 'next/image';
import Spinner from './Spinner';

import csvImage from '@/public/static/images/csv.png';
import logImage from '@/public/static/images/log.png';
import pastaImage from '@/public/static/images/pastaCSV.png';
import itemImage from '@/public/static/images/itemCSV.png';

function DownloadSpinner({ loading, type }: { loading: boolean; type?: string }) {
    const ImageComponent = useMemo(() => {
        switch (type) {
            case 'sessionBtn':
                return (
                    <>
                        <Image
                            style={{
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                justifySelf: 'center'
                            }}
                            src={csvImage}
                            alt='csv icon'
                        />{' '}
                        Sessions
                    </>
                );
            case 'pastaBtn':
                return (
                    <>
                        <Image
                            style={{
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                justifySelf: 'center'
                            }}
                            src={pastaImage}
                            alt='pasta icon'
                        />{' '}
                        Pasta
                    </>
                );
            case 'itemBtn':
                return (
                    <>
                        <Image
                            style={{
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                justifySelf: 'center'
                            }}
                            src={itemImage}
                            alt='item icon'
                        />{' '}
                        Items
                    </>
                );
            default:
                return (
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
    }, [type]);

    if (loading) return <Spinner chart='' height='30' width='40' />;
    return ImageComponent;
}

export default DownloadSpinner;
