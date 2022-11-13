import React, { Component } from 'react'
import User from './../UserList/User';
import { Table } from 'reactstrap';

const styles = {
    transition: "all .5s ease-out"
}

class Class extends Component {
	constructor(props){
		super(props);

		this.state = {
            search: "",
            width: "0px",
            marginLeft: "160px",
            close: true
        }

        this.inputRef = React.createRef();
    }
    
    onExpand = () => {
        this.setState({ 
            marginLeft: this.state.marginLeft === "160px" ? "0px" : "160px",
            width: this.state.width === "0px" ? "160px" : "0px",
            close: !this.state.close //this will take in affect after onExpand() has completed 
        });

        //if the current state of the button is close then that means the button has been toggled to open so focus the input 
        if (this.state.close)
            this.inputRef.current.focus();
    }

    updateSearch(e) {
        this.setState({ search: e.target.value.substr(0,20) });
    }

	render() {
        let filteredStudent = this.props.group.group_users.filter(
            (student) => { 
                return (student.username.toLowerCase().indexOf(this.state.search.toLowerCase()) !== -1);
            }
        );

        filteredStudent.filter((student) => student.accessLevel === this.props.currentGroup);

	    return (
        <Table hover className="classTable">
            <thead>
            {this.props.group.group_users.length !== 0 
            ?
                <tr>
                    <th>Student ID</th>
                    <th>Username</th>
                    <th> 
                        <button
                            size="sm"
                            style={{...styles, marginLeft: this.state.marginLeft, backgroundColor: "transparent", borderStyle: "hidden", outline: "none"}}
                            onClick={() => this.onExpand()}
                        >
                            <img 
                                src={require('../../Images/search.png')} 
                                alt="Icon made by Freepik from www.flaticon.com" 
                                style={{width: '15px', height: '15px'}}
                            />
                        </button>

                        <input 
                            placeholder="Search for a student"
                            style={{
                                ...styles, 
                                width: this.state.width, 
                                borderStyle: "hidden hidden solid",
                                padding: "0px",
                                background: "transparent",
                                outline: "none"
                            }}
                            value={this.state.search} 
                            onChange={this.updateSearch.bind(this)}
                            ref={this.inputRef}
                            onBlur={() => this.onExpand()}
                        />
                    </th>
                </tr>
            : null}
            </thead>

            <tbody> 
                {this.props.group.group_users.length !== 0 ?
                    filteredStudent.length !== 0 
                    ? 
                    filteredStudent.map((user) => {
                        return (
                            <User key={user.userID} serviceIP={this.props.serviceIP} user={user} type="pf" />
                        )
                    })
                    :
                    <tr>
                        <td colSpan="3">
                            {this.state.search} cannot be found in this class.
                        </td> 
                    </tr>
                :
                <tr>
                    <td colSpan="3">
                        You currently have no {this.props.currentGroup === "st" ? "students" : "TAs"}
                    </td> 
                </tr>}
            </tbody>
        </Table>
	    )
	}
}

export default Class