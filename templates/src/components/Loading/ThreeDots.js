import React from "react";
import { usePromiseTracker } from "react-promise-tracker";
import Loader from "react-loader-spinner";
import '../../stylesheets/spinner.css';

const ThreeDots = (props) => {
  const { promiseInProgress } = usePromiseTracker();

  return (
    promiseInProgress && (
        <div className="spinner">
            <Loader type="ThreeDots" color="#3af0f9" height="55" width="62"/>
        </div>
    )
  );
};

export default ThreeDots