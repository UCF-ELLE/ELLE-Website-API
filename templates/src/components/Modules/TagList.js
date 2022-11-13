import React, {Component} from 'react';
import {Label, Row } from 'reactstrap';

import TagItem from './TagItem';

class TagList extends Component {
	constructor(props){
		super(props);

		this.renderList = this.renderList.bind(this);

		this.state = {
			tags: this.props.tags
		};
	}

	//function that returns a list of tagItem elements
	renderList = (tags, handleDeleteTag) => {
		let list = [];
	
		for(let i = 0; i < tags.length; i++){
			
			list.push(<TagItem tag={tags[i]} key={i} 
				handleDeleteTag={handleDeleteTag} deletable={this.props.deletable}/>);
		}

		return list;
	}

	render(){
		return(
			<div>
				<Label> Tags: </Label>
				<Row>					
					{this.renderList(this.props.tags, this.props.handleDeleteTag)}
				</Row>
			</div>
		);
	}
}

export default TagList;