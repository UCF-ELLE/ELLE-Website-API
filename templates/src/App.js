import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Home from './pages/Home';
import Games from './pages/Games';
import MazeGame from './pages/MazeGame';
import Modules from './pages/Modules';
import Profile from './pages/Profile';
import Sessions from './pages/Sessions';
import GameCode from './pages/GameCode'; 
import Login from './pages/Login'
import Logout from './pages/Logout'
import Signup from './pages/Signup';
import UserList from './pages/UserList';
import ClassRoster from './pages/ClassRoster'; 
import AuthUser from './components/Auth/AuthUser';
import AuthAdmin from './components/Auth/AuthAdmin';
import ForgotUsername from './pages/ForgotUsername';
import ForgotPassword from './pages/ForgotPassword'; 
import ResetPassword from './pages/ResetPassword'; 
import CardGame from './pages/CardGame';

let flaskIP = 'https://chdr.cs.ucf.edu/elleapi';

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: {}
    };
  }

  updateUserInfo = (user) => {
    this.setState({
      user: user
    })
  }

  render() {
    return (
      <Router>  
        <div>
          <Switch>
            <Route exact path="/home" render={(props)=><Home {...props} serviceIP={flaskIP} user={this.state.user}/>}/>
            <Route path="/games" render={(props)=><Games {...props} serviceIP={flaskIP} user={this.state.user}/>}/>        
            <Route path="/logout" render={(props)=><Logout {...props} serviceIP={flaskIP}/>}/>
            <Route path="/login" render={(props)=><Login {...props} serviceIP={flaskIP} updateUserInfo={this.updateUserInfo}/>}/>
            <Route path="/register" render={(props)=><Signup {...props} serviceIP={flaskIP}/>}/>
            <Route path="/forgotusername" render={(props)=><ForgotUsername {...props} serviceIP={flaskIP}/>}/>
            <Route path="/forgotpassword" render={(props)=><ForgotPassword {...props} serviceIP={flaskIP}/>}/>
            <Route path="/resetpassword" render={(props)=><ResetPassword {...props} serviceIP={flaskIP}/>}/>
            <Route path="/cardgame" render={(props)=><CardGame {...props} serviceIP={flaskIP} user={this.state.user}/>}/>
            <AuthUser>   
              <Route path="/profile" render={(props)=><Profile {...props} serviceIP={flaskIP} user={this.state.user}/>}/>
              <Route path="/modules" render={(props)=><Modules {...props} serviceIP={flaskIP} user={this.state.user}/>}/>
              <Route path="/sessions" render={(props)=><Sessions {...props} serviceIP={flaskIP} user={this.state.user}/>}/>
              <Route path="/gamecode" render={(props)=><GameCode {...props} serviceIP={flaskIP} user={this.state.user}/>}/>
              <Route path="/mazegame" render={(props)=><MazeGame {...props} serviceIP={flaskIP} user={this.state.user}/>}/>
              <AuthAdmin>  
                <Route path="/classroster" render={(props)=><ClassRoster {...props} serviceIP={flaskIP} user={this.state.user}/>}/>
                <Route path="/userlist" render={(props)=><UserList {...props} serviceIP={flaskIP} user={this.state.user}/>}/>
              </AuthAdmin>
            </AuthUser>
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
