import React, { Component } from 'react'
import { Button } from 'reactstrap';
import axios from 'axios';

class ExistingModule extends Component {
	constructor(props){
		super(props);

		this.state = {
			linked: false 
		}
    }
    
    link = () => {
        var data = {
            moduleID: this.props.module.moduleID,
            groupID: this.props.selectedClass.value
        }

        let header = {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') }
        }
      
        axios.post(this.props.serviceIP + '/addmoduletogroup', data, header)
        .then(res => {
            this.setState({ linked: true })
            this.props.updateModuleList("add", this.props.module.moduleID);  
        }).catch(function (error) {
            console.log(error.message);
        });
    }

	render() {
	    return (
			<tr>
                <td>{this.props.module.name}</td>
                <td>{this.props.module.language}</td>
                <td>{this.props.module.username}</td>
                <td>
                    <Button size="sm" onClick={() => this.link()} disabled={this.state.linked ? true : false}>
                        {this.state.linked ? "Linked" : "Link"}
                    </Button>
                </td>
		    </tr>
	    )
	}
}

export default ExistingModule