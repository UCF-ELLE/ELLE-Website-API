import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

const Wave = ({ chart }: { chart: string }) => {
    let height;
    let width;
    if (chart === 'language' || chart === 'modules') {
        height = 190;
        width = 50;
    } else if (chart === 'tag') {
        height = 170;
        width = 50;
    }

    return (
        <div>
            <SkeletonTheme baseColor='transparent' highlightColor='#3af0f9'>
                <Skeleton width={width} height={height} />
            </SkeletonTheme>
        </div>
    );
};

export default Wave;
