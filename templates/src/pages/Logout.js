import React, { Component } from 'react';

import { Redirect } from 'react-router-dom';


class Logout extends Component {

  constructor(props) {
    super(props);

    localStorage.removeItem('jwt');
    localStorage.removeItem('per');
  }

  render() {
    return (
      <Redirect
        to='/home'
      />
    );
  }
}

export default Logout;
