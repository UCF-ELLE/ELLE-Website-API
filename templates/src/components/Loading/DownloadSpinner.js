import React from "react";
import Loader from "react-loader-spinner";
import '../../stylesheets/spinner.css';
import { usePromiseTracker } from "react-promise-tracker";

const DownloadSpinner = (props) => {
    const { promiseInProgress } = usePromiseTracker({area: props.area});
    return (
        promiseInProgress ?
        <div className="spinner">
            <Loader type="Oval" color="#8691fa" height="30" width="40"/>
        </div>
        : props.area === "sessionBtn" ?       
        <>             
            <img style={{width: "25px", height: "25px", display:"flex", justifySelf: "center", margin: "5px 2px 0 2px"}} 
                src={require('../../Images/csv.png')} alt="csv icon"/> Sessions
        </> :
        <>
            <img style={{width: "30px", height: "30px", display:"flex", justifySelf: "center"}} 
                src={require('../../Images/log.png')} alt="log icon"/> Answers
        </>
    );
};

export default DownloadSpinner