import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';

class AuthUser extends Component {
  constructor(props) {
    super(props);
  }  

  componentDidMount() {
    const jwt = localStorage.getItem('jwt');  

    if(!jwt) {
      this.props.history.push('/home');
    } 
  }

  render () {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
}

export default withRouter(AuthUser);
