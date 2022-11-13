import React from 'react';
import {Link} from 'react-router-dom';

export default class Template extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      isOpen: false
    };
  }

  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }
  render() {
    return (
      <header id="header">
			<div className="container">
				<div id="logo" className="pull-left">
					<Link to='/home'>
						<img src={require('../Images/ELLE/ELLE-Background-Full.png')}
							alt="ELLE Ultimate"	title="Home" className="mainLogoStyle"/>
					</Link>
				</div>

				<nav id="nav-menu-container">
					<ul className="nav-menu">
						<li><Link to='/downloads'>Downloads</Link></li>
						<li><Link to='/home'>Home</Link></li>
						<li><Link to='/login'>Log In</Link></li>
						<li><Link to='/register'>Sign Up</Link></li>
						<li><a href="https://www.github.com/ItsNotRick/elle" className="github"><i className="fa fa-github fa-lg"></i></a></li>
					</ul>
				</nav>
			</div>
		</header>
    );
  }
}
