import React from 'react'
import { Table, Alert } from 'reactstrap';

import Term from './Term';
import Phrase from './Phrase';
import Question from './Question';

const CardList = (props) => {
    const removeDuplicates = () => {
      let idList = []; 
      let filteredList = []; 

      props.cards.map((card) => 
      {
          if (idList.indexOf(card.termID) === -1) {
            idList.push(card.termID); 
            filteredList.push(card);
          }
      })
      return filteredList; 
    }

    let list = removeDuplicates(); 
    let len = list.length; 

    if (props.type === 0) {
	    return (
        <div>
        {len === 0 ? 
          <Alert> There are currently no terms in this module. </Alert>
        : 
        <Table hover className="tableList">
          <thead>
            <tr>
              <th style={{width: '32%'}}>English</th>
              <th style={{width: '32%'}}>Translated</th>
              <th style={{width: '12%'}}>Type</th>
              <th style={{width: '12%'}}>Gender</th>
              <th style={{width: '12%'}}>Picture</th>
              <th style={{width: '12%'}}>Audio</th>
              {props.permissionLevel !== "st" ? <th style={{width: '32%'}}> </th> : null}
            </tr>
          </thead>
          <tbody>
            {list.map((card) => {
              return (
                <Term
                  key={card.termID}
                  card={card}
                  currentClass={props.currentClass}
                  permissionLevel={props.permissionLevel}
                  serviceIP={props.serviceIP}
                  curModule={props.curModule}
                  updateCurrentModule={props.updateCurrentModule}
                  deleteTag={props.deleteTag}
                  addTag={props.addTag}
                  allTags={props.allTags}
                />
              )
            })}
          </tbody>
        </Table>
        }
        </div>
      )
    }
    else if (props.type === 1) {
      return (
        <div>
        {len === 0 ? 
          <Alert> There are currently no phrases in this module. </Alert>
        : 
        <Table hover className="tableList">

          <thead>
            <tr>
              <th style={{width: '32%'}}>Phrase (English)</th>
              <th style={{width: '32%'}}>Phrase (Translated)</th>
              <th style={{width: '12%'}}>Picture</th>
              <th style={{width: '12%'}}>Audio</th>
              {props.permissionLevel !== "st" ? <th style={{width: '32%'}}> </th> : null}
            </tr>
          </thead>
          <tbody>
            {list.map((card) => {
              return (
                <Phrase                   
                  key={card.termID}
                  card={card}
                  currentClass={props.currentClass}
                  permissionLevel={props.permissionLevel}
                  serviceIP={props.serviceIP}
                  curModule={props.curModule}
                  updateCurrentModule={props.updateCurrentModule}
                />
              )
            })}
          </tbody>
        </Table>
        }
        </div>
      )
    }
    else if (props.type === 2) {
      return (
        <div>
        {props.cards.length === 0 ? 
          <Alert> There are currently no custom questions in this module. </Alert>
        : 
        <Table hover className="tableList">
          <thead>
            <tr>
              <th style={{width: '64%'}}>Question</th>
              <th style={{width: '9%'}}>Picture</th>
              <th style={{width: '9%'}}>Audio</th>
              {props.permissionLevel !== "st" ? <th style={{width: '9%'}}> </th> : null}
            </tr>
          </thead>
          <tbody>    
            {props.cards.map((card) => {
              return(
                <Question
                  key={card.questionID}
                  question={card}
                  currentClass={props.currentClass}
                  permissionLevel={props.permissionLevel}
                  serviceIP={props.serviceIP}
                  curModule={props.curModule}
                  updateCurrentModule={props.updateCurrentModule}
                  allAnswers={props.allAnswers}
                  deleteTag={props.deleteTag}
                  addTag={props.addTag}
                  allTags={props.allTags}
                />
              )
            })}
          </tbody>

        </Table>
        }
        </div>
      )
    }
}

export default CardList
