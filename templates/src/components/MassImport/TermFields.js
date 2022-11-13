import React, { Component } from 'react'
import { Input } from 'reactstrap';
import '../../stylesheets/superadmin.css'

class TermFields extends Component {
	constructor(props){
		super(props);

		this.state = {
            front: this.props.term.front,
            back: this.props.term.back, 
            type: this.props.term.type,
            gender: this.props.term.gender
        }

 
    }

    handleOnChange = (e) => {
        this.setState({ [e.target.name]: e.target.value }); 

        this.props.handleOnFieldChange(
            this.props.index, 
            {
                front: e.target.name === "front" ? e.target.value : this.state.front,
                back: e.target.name === "back" ? e.target.value : this.state.back,
                type: e.target.name === "type" ? e.target.value : this.state.type, 
                gender: e.target.name === "gender" ? e.target.value : this.state.gender
            }
        );
    }

	render() { 
        return (
            <>
                <td>
                    <Input 
                        name="front"
                        onChange={(e) => this.handleOnChange(e)}
                        value={this.props.term.front}
                    />
                </td>
                <td>
                    <Input 
                        name="back"
                        onChange={(e) => this.handleOnChange(e)}
                        value={this.props.term.back}
                    />
                </td>
                <td>
                    <Input 
                        name="type"
                        onChange={(e) => this.handleOnChange(e)}
                        value={this.props.term.type}
                    />
                </td>
                <td>
                    <Input 
                        name="gender"
                        onChange={(e) => this.handleOnChange(e)}
                        value={this.props.term.gender}
                    />
                </td>
            </>
        );
    }
}

export default TermFields