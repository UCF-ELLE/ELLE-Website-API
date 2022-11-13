import React from 'react'
import { Button } from 'reactstrap';

class AnswerButton extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      removeMode: false //determines whether or not this answer will be able to be deleted via click
    }
  }

  //function that sets the style of the button, either removable or not
  setStyle = () => {
    if (this.state.removeMode === false) {
      return {margin: "3px", border: "1px solid black"}
    } 
    else {
      return {margin: "3px", border: "1px solid black", backgroundColor: "red"}
    }
  };

  render() {
    if (this.props.deletable === true) {
      return (
        <div>
          <Button 
            style={this.setStyle()}  
            color="secondary" 
            onClick={() => {this.props.handleDeleteAnswer({answer: this.props.answer})}}
            onMouseOver={() => {this.setState({removeMode: true})}}
            onMouseOut={() => this.setState({removeMode: false})}
          >
            {this.props.answer}
          </Button>
          {' '}
        </div>
      );
    } 
    else {
      return(
        <div>
          <Button 
            style={this.setStyle()}  
            color="secondary" 
          >
            {this.props.answer}
          </Button>
          {' '}
        </div>
      );
    }
  }
}

export default AnswerButton