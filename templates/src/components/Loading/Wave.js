import React from "react";
import { usePromiseTracker } from "react-promise-tracker";
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

const Wave = (props) => {
  const { promiseInProgress } = usePromiseTracker();
  let height; 
  let width;
  if (props.chart === "language" || props.chart === "modules") {
    height = 190; 
    width = 50;
  }
  else if (props.chart === "tag") {
    height = 170; 
    width = 50;
  }

  return (
    promiseInProgress && (
        <div>
          <SkeletonTheme color="transparent" highlightColor="#3af0f9">
            <Skeleton width={width} height={height}/>
          </SkeletonTheme>
        </div>
    )
  );
};

export default Wave