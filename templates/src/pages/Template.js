import React from 'react';
import {Link} from 'react-router-dom';

export default class Template extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <header id="header">
      <div className="container">
        <div id="logo" className="pull-left">
          <Link to='/home'>
            <img src={require('../Images/ELLE/ELLE-Background-Full.png')}
                 alt="ELLE Ultimate" title="Home" className="mainLogoStyle"/>
          </Link>
        </div>
        <nav id="nav-menu-container">
          <ul className="nav-menu">
            <li><Link to='/games'>Games</Link></li>
            <li><Link to='/profile'>Profile</Link></li>
            <li><Link to='/modules'>Modules</Link></li>
            <li><Link to='/sessions'>Sessions</Link></li>
            {this.props.permission === "su" ? <li><Link to='/userlist'>User List</Link></li> : null}
            {this.props.permission === "pf" ? <li><Link to='/classroster'>Class Roster</Link></li> : null}
            <li><Link to='/gamecode'>VR Game Code</Link></li>
            <li><Link to='/logout'>Sign Out</Link></li>
						<li><a href="https://github.com/Naton-1/ELLE-2023-Website-API" className="github"><i className="fa fa-github fa-lg"></i></a></li>
          </ul>
        </nav>
      </div>
    </header>
    );
  }
}
