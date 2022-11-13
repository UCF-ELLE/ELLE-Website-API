import React from 'react'; 
import { Card } from 'reactstrap'; 
import '../../stylesheets/loading.css';

const Loading = (props) => {

    return (
        <Card color="info" style={{height:"56vh"}}>
        {
            <div className="loadingContainer">
                <div className="loading">
                    <div className="loading__letter">L</div>
                    <div className="loading__letter">o</div>
                    <div className="loading__letter">a</div>
                    <div className="loading__letter">d</div>
                    <div className="loading__letter">i</div>
                    <div className="loading__letter">n</div>
                    <div className="loading__letter">g</div>
                    <div className="loading__letter">.</div>
                    <div className="loading__letter">.</div>
                    <div className="loading__letter">.</div>
                </div>
            </div>
        }
        </Card>
    );
}

export default Loading