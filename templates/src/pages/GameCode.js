import React, { Component } from 'react';
import { Container, Row, Col, Button, Modal, ModalHeader, ModalBody } from 'reactstrap';
import sample from '../Images/ELLE_blocks.mp4';
import axios from 'axios';

import '../lib/bootstrap/css/bootstrap.min.css';
import '../lib/ionicons/css/ionicons.min.css';
import Template from './Template';

export default class GameCode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      permission: this.props.user.permission,
      modalOpen: false,
      OTC: ""
    }
  }

  componentDidMount() {
    this.verifyPermission();
  }

  verifyPermission = () => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      this.props.history.push('/home');
    }
    else {
      var jwtDecode = require('jwt-decode');

      var decoded = jwtDecode(jwt);

      this.setState({ permission: decoded.user_claims.permission }); 
    }
  }

  toggleModal = () => {
    this.setState({ modalOpen: !this.state.modalOpen })

    if (!this.state.modalOpen === true) {
      this.generateOTC(); 
    }
  }

  generateOTC = () => {
    let header = {
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
    }

    axios.get(this.props.serviceIP + '/generateotc', header)
    .then(res => {
      this.setState({ OTC: res.data.otc }); 
    }).catch(error => {
      console.log("OTC error: ", error); 
    })
  }

  render() {
    return (
        <div>
            <Template permission={this.state.permission}/>

            <Row>
              <Col style={{display: "flex", justifyContent: "center", zIndex: "1", position: "relative", top: "300px"}}>
                  <Button className="gameCodeBtn" id="gameCodeBtn" onClick={() => this.toggleModal()}>
                      Generate Code 
                  </Button>
              </Col>
              <video width="100%" height="100%" style={{marginTop: "-40px"}} autoPlay loop muted>
                <source src={sample} type="video/mp4" />
              </video>
            </Row>

            <Modal isOpen={this.state.modalOpen} toggle={() => this.toggleModal()}>
              <ModalHeader toggle={() => this.toggleModal()}>Your OTC</ModalHeader>
              <ModalBody>
                <p style={{display: "flex", justifyContent: "center", fontSize: "xx-large", fontWeight: "600"}}>
                  {this.state.OTC}
                </p>
              </ModalBody>
            </Modal>
        </div>
    );
  }
}
