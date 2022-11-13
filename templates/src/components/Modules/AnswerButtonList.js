import React, {Component} from 'react';
import {Row } from 'reactstrap';

import AnswerButton from './AnswerButton';

class AnswerButtonList extends Component {
	constructor(props){
		super(props);

		this.renderList = this.renderList.bind(this);

		this.state = {
			answers: this.props.answers
		};
	}


	//function that returns a list of AnswerButton elements
	renderList = (answers, handleDeleteAnswer) => {
		let list = [];
	
		for(let i = 0; i < answers.length; i++){
			
			list.push(<AnswerButton answer={answers[i]} key={i} 
				handleDeleteAnswer={handleDeleteAnswer} deletable={this.props.deletable}/>);
		}

		return list;
	}

	render() {
		return (
			<div>
				<Row>					
					{this.renderList(this.props.answers, this.props.handleDeleteAnswer)}
				</Row>
			</div>
		);
	}
}

export default AnswerButtonList;