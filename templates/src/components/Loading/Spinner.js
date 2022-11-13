import React from "react";
import { usePromiseTracker } from "react-promise-tracker";
import Loader from "react-loader-spinner";
import '../../stylesheets/spinner.css';

const Spinner = (props) => {
  const { promiseInProgress } = usePromiseTracker();

  return (
    promiseInProgress && (
      <div className="spinner" style={{paddingTop: props.chart === "performance" ? "50px" : "0px", height: "100px"}}>
          <Loader type="Oval" color="#3af0f9" height="100" width="100"/>
      </div>
    )
  );
};

export default Spinner