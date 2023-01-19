import React, { Component } from 'react';

import MainTemplate from '../pages/MainTemplate'; 
import Template from '../pages/Template';
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form';



import '../stylesheets/style.css';
import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/font-awesome/css/font-awesome.min.css';
import '../lib/owlcarousel/assets/owl.carousel.min.css';
import '../lib/ionicons/css/ionicons.min.css';

export default class MentorQuestions extends Component {

    constructor(props) {
        super(props);
        this.state = {show: false};
    }

    setTrue = () => {
        this.setState({show: true});
        console.log(this.state.show);
    }

    setFalse = () => {
        this.setState({show: false});
        console.log(this.state.show);
    }

    render () {
        return (
            <div>
                <Modal show = {this.state.show} onHide = {this.setFalse}>
                <Modal.Header closeButton>
                    <Modal.Title>Sample Question</Modal.Title>
                </Modal.Header>
                <Modal.Body><Form>This would contain the question to edit.</Form></Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={this.setFalse}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={this.setFalse}>
                        Save Changes
                    </Button>
                </Modal.Footer>
                </Modal>
                {localStorage.getItem('jwt') === null ? <MainTemplate /> : <Template permission={this.state.permission}/>}
                <h1 className="headText">Class 1 Mentor Questions:</h1>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                        <th>Questions:</th>
                        <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <td>Sample Question 1 </td>
                        <td><Button variant="warning" onClick={this.setTrue}>Edit Question</Button></td>
                        </tr>
                        <tr>
                        <td>Sample Question 2</td>
                        <td><Button variant="warning">Edit Question</Button></td>
                        </tr>
                        <tr>
                        <td>Sample Question 3</td>
                        <td><Button variant="warning">Edit Question</Button></td>
                        </tr>
                        <tr>
                        <td>Sample Question 4</td>
                        <td><Button variant="warning">Edit Question</Button></td>
                        </tr>
                        <tr>
                        <td>Sample Question 5</td>
                        <td><Button variant="warning">Edit Question</Button></td>
                        </tr>
                        <tr>
                        <td>Sample Question 6</td>
                        <td><Button variant="warning">Edit Question</Button></td>
                        </tr>
                        <tr>
                        <td>Sample Question 7</td>
                        <td><Button variant="warning">Edit Question</Button></td>
                        </tr>
                    </tbody>
                </Table>
                <Button variant="primary">Add New Question</Button>
                <br></br>
                <br></br>

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