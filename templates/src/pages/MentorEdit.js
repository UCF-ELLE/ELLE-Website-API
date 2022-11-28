import React, { Component } from 'react';

import MainTemplate from '../pages/MainTemplate'; 
import Template from '../pages/Template';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';

import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/font-awesome/css/font-awesome.min.css';
import '../lib/owlcarousel/assets/owl.carousel.min.css';
import '../lib/ionicons/css/ionicons.min.css';

export default class MentorEdit extends Component {
    render() {
        return (
            <div>
		
                {localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={this.state.permission}/>}
                
                <h1 className="headText">Available Modules:</h1>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                        <th>Module List:</th>
                        <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <td>Module 1</td>
                        <td><Button variant="warning">Edit Mentor Questions</Button></td>
                        </tr>
                        <tr>
                        <td>Module 2</td>
                        <td><Button variant="warning">Edit Mentor Questions</Button></td>
                        </tr>
                        <tr>
                        <td>Module 3</td>
                        <td><Button variant="warning">Edit Mentor Questions</Button></td>
                        </tr>
                        <tr>
                        <td>Module 4</td>
                        <td><Button variant="warning">Edit Mentor Questions</Button></td>
                        </tr>
                        <tr>
                        <td>Module 5</td>
                        <td><Button variant="warning">Edit Mentor Questions</Button></td>
                        </tr>
                        <tr>
                        <td>Module 6</td>
                        <td><Button variant="warning">Edit Mentor Questions</Button></td>
                        </tr>
                    </tbody>
                </Table>
                <footer id="footer">
                    <div className="container">
                        <div className="copyright">&copy; Copyright 2022 <strong>Reveal</strong>. All Rights Reserved</div>
                        <div className="credits">
                        {/*
                        All the links in the footer should remain intact.
                        You can delete the links only if you purchased the pro version.
                        Licensing information: https://bootstrapmade.com/license/
                        Purchase the pro version with working PHP/AJAX contact form: https://bootstrapmade.com/buy/?theme=Reveal
                        */}
                        Designed by <a href="https://bootstrapmade.com/">BootstrapMade</a>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }
}