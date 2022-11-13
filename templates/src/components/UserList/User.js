import React, { Component } from 'react';
import { Button, Modal, ModalHeader, ModalBody, Table, Card, CardBody, Row, Col, Input, Alert } from 'reactstrap'
import axios from 'axios';

class User extends Component {
	constructor(props){
		super(props);

		this.state = {
			pfDetailModalOpen: false,
			detailModalOpen: false,
			tempPW: "",
			alertOpen: false,
			alertMsg: ""
		}
	}

	change(e) {
		this.setState({
		  [e.target.name]: e.target.value
		})
	}

	toggleDetailModal = () => {
		this.setState({ 
			detailModalOpen: !this.state.detailModalOpen,
			alertOpen: false,
			alertMsg: ""
		})
	}

	toggleProfessorDetailModal = () => {
		this.setState({ pfDetailModalOpen: !this.state.pfDetailModalOpen })
	}

	renderUserInfo = () => {
		return (
			<Card style={{margin: "0 20px 0 20px", border: "none"}}>
				<Row>
					ID: {this.props.user.userID}
				</Row>
				<Row>
					Name: {this.props.user.username}
				</Row>
				<Row>
					Permission Level: {this.props.type === "pf" ? this.props.user.accessLevel : this.props.user.permissionGroup}
				</Row>
				<Row style={{paddingTop: "10px"}}>
					Reset Password:
					<Col xs="7" style={{paddingRight: "0px"}}>
						<Input
							placeholder="Create a temporary password"
							name="tempPW"
							value={this.state.tempPW}
							onChange={e => this.change(e)}
						/>
					</Col>
					<Col xs="1" style={{padding: "0 0 0 10px"}}>
						<Button onClick={() => this.resetPassword()}>Reset</Button>
					</Col>
				</Row>
			</Card>
		)
	}

	generateNewCode = (id) => {
		let header = {
		  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
		  params: {groupID: id}
		}
	
		axios.get(this.props.serviceIP + '/generategroupcode', header)
		.then(res => {
		  this.props.getUsers(); 
		}).catch(error => {
		  console.log("ERROR in generating new group code: ", error);
		})
	}

	resetPassword = () => {
		let header = {
			headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt') },
		}

		let data = {
			userID: this.props.user.userID,
			password: this.state.tempPW
		}
	
		axios.post(this.props.serviceIP + '/changepassword', data, header)
		.then(res => {
			this.setState({ 
				tempPW: "",
				alertOpen: true,
				alertMsg: "Successful Reset"
		 	}); 
		}).catch(error => {
			console.log("ERROR in changing password: ", error.response);
		})
	}

	render() {
	    return (
			<>
			<tr>
				<td>{this.props.user.userID}</td>
				<td>{this.props.user.username}</td>
				{this.props.type === "pf" || this.props.group === "st" || this.props.group === "su" ? 
				<td style={{paddingLeft: "24%"}}>
					<Button 
						style={{backgroundColor: "transparent", border: "none", padding: "0px"}}
						onClick={() => this.toggleDetailModal()}
					>
						<img 
							src={require('../../Images/more.png')}
							alt="Icon made by xnimrodx from www.flaticon.com" 
							name="more"
							style={{width: '20px', height: '20px'}}
						/>
					</Button>
			  	</td> 
				: null}

				{this.props.group === "pf" ?
				<td style={{paddingLeft: "24%"}}>
					<Button 
						style={{backgroundColor: "transparent", border: "none", padding: "0px"}}
						onClick={() => this.toggleProfessorDetailModal()}
					>
						<img 
							src={require('../../Images/more.png')}
							alt="Icon made by xnimrodx from www.flaticon.com" 
							name="more"
							style={{width: '20px', height: '20px'}}
                        />
					</Button>
				</td> 
				: null}
		    </tr>

			<Modal isOpen={this.state.detailModalOpen}>
				<ModalHeader toggle={() => this.toggleDetailModal()}>Details</ModalHeader>
				<ModalBody>
					{this.state.alertOpen ? <Alert>{this.state.alertMsg}</Alert> : null}
					{this.renderUserInfo()}
				</ModalBody>
			</Modal>

			<Modal isOpen={this.state.pfDetailModalOpen}> 
				<ModalHeader toggle={() => this.toggleProfessorDetailModal()}>Professor Details</ModalHeader>
				<ModalBody style={{paddingBottom: "10px"}}>
					{this.renderUserInfo()}
					<br />
					{this.props.group === 'pf' 
					? this.props.user.groups.length !== 0 ?
					<>
					<Row><Col style={{paddingLeft: "20px"}}>Class Info: </Col></Row>
					<Card style={{height: "40vh", overflow: "scroll"}}>
						<Table className="professorDetailsTable">
							<thead>
								<tr>
									<th>ID</th>
									<th>Class</th>
									<th>Code</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{this.props.user.groups.map(
									(group, i) => {
										return (
											<tr key={i}>
												<td>{group.groupID}</td>
												<td>{group.groupName}</td>
												<td>{group.groupCode}</td>
												<td>
													<img 
														src={require('../../Images/shuffle.png')}
														alt="Icon made by Freepik from www.flaticon.com" 
														name="change"
														style={{width: '15px', height: '15px', cursor: "pointer"}}
														onClick={() => this.generateNewCode(group.groupID)}
													/>
												</td>
											</tr>
										)
									}
								)}
							</tbody>
						</Table>
					  </Card>
					  	<p style={{margin: "10px 0 0 0", float: "right", fontSize: "12px"}}>Use {' '} 													
							<img 
								src={require('../../Images/shuffle.png')}
								alt="Icon made by Freepik from www.flaticon.com" 
								name="change"
								style={{width: '10px', height: '10px'}}
							/>
							{' '} to generate a new class code. 
						</p>
					  </>
					: 
					  <Card style={{alignItems: "center"}}>
					  	{this.props.user.username} currently does not have any classes.
					  </Card>
					: null }
				</ModalBody>
			</Modal>
			</>
	    )
	}
}

export default User
