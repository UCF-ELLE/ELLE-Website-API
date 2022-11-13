import React, { useState } from 'react'; 
import { Button, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem, Popover, PopoverHeader, PopoverBody, 
  Form, FormGroup, Label, Input, Modal, ModalHeader, ModalBody, ModalFooter, Alert } from 'reactstrap'; 

  const SplitDeckBtn = (props) => {
    const [dropdownOpen, setOpen] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [unlinkModalOpen, setUnlinkModalOpen] = useState(false); 
    const [modalOpen, setModalOpen] = useState(false); 
    const [editedModuleName, setName] = useState("");
  
    const toggle = () => setOpen(!dropdownOpen);
    const togglePopover = () => setPopoverOpen(!popoverOpen);
    const toggleUnlinkModal = () => setUnlinkModalOpen(!unlinkModalOpen);
    const toggleModal = () => setModalOpen(!modalOpen); 

    return (
      <ButtonDropdown isOpen={dropdownOpen} toggle={toggle}> 
        <Button 
          style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", backgroundColor: "#5faeb5",
                  border: "none", borderRadius: '0px', overflowX: "scroll"}} 
          id={"deckButton" + props.curModule.moduleID}
          type="button"
          onClick={ () => { props.updateCurrentModule({ module: props.curModule }) }}
        >
          {props.curModule.name}
        </Button>
        <Popover trigger="legacy" placement="bottom" isOpen={popoverOpen} target={"deckButton" + props.curModule.moduleID}>
          <PopoverHeader>
            Edit Module 
            <Button close onClick={ () => { togglePopover() }}/>
          </PopoverHeader>
          <PopoverBody>
            <Form>
              <FormGroup>
                <Label for="moduleName">Name:</Label>
                <Input type="text" name="mName" id="moduleName" autoComplete="off" placeholder={props.curModule.name} 
                  value={editedModuleName} onChange={ e => setName(e.target.value) }/>
              </FormGroup>
              <Button onClick={ () => {
                props.editModule(editedModuleName, { module: props.curModule })
                togglePopover()
              }}>Submit</Button>
            </Form>
          </PopoverBody>
        </Popover>
        
        {props.permissionLevel !== "st" 
        ? 
          <>
          <DropdownToggle caret color="info" style={{backgroundColor: '#5faeb5', border: 'none', borderRadius: '0px'}}/>
          <DropdownMenu style={{minWidth: '50px', padding: '0px', backgroundColor: 'gray'}}>
              <DropdownItem style={{padding: '4px 24px 4px 10px', backgroundColor: 'lightcyan', color: 'black', outline: 'none'}}
                onClick={ () => { togglePopover() } }>
                <img src={require('../Images/tools.png')} alt="edit icon" style={{width: '18px', height: '18px'}}/> Edit</DropdownItem>
              
              {props.curModule.owned === true || props.permissionLevel === "su" ? 
                <DropdownItem style={{padding: '4px 24px 4px 10px', backgroundColor: 'lightcoral', color: 'black', outline: 'none'}}
                  onClick={ () => { toggleModal() }}>
                  <img src={require('../Images/delete.png')} alt="trash can icon" style={{width: '18px', height: '20px'}}/> Delete</DropdownItem>
              : null}

              {(props.permissionLevel === "pf" || props.permissionLevel === "ta") && props.currentClassView !== 0 && props.curModule.owned === false ?
                <DropdownItem style={{padding: '4px 24px 4px 10px', backgroundColor: 'lightsalmon', color: 'black', outline: 'none'}}
                onClick={ () => { toggleUnlinkModal() }}>
                <img src={require('../Images/unlink.png')} alt="unlink icon" style={{width: '18px', height: '20px'}}/> Unlink</DropdownItem>
              : null}

          </DropdownMenu>
          </>   
        : null}

        <Modal isOpen={unlinkModalOpen}> 
          <ModalHeader toggle={toggleUnlinkModal}>Delete</ModalHeader>
          <ModalBody>
            <p style={{paddingLeft: "20px"}}>Are you sure you want to unlink the module: {props.curModule.name}?</p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={ () => { toggleUnlinkModal() }}>Cancel</Button>
            <Button color="danger" onClick={ () => {
              props.unlinkModule(props.curModule.moduleID) 
              toggleUnlinkModal()
            }}>Unlink</Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={modalOpen}> 
          <ModalHeader toggle={toggleModal}>Delete</ModalHeader>
          <ModalBody>
            <Alert color="primary">
              Deleting this module will remove it from all the users who are currently using this module as well.
            </Alert>
            <p style={{paddingLeft: "20px"}}>Are you sure you want to delete the module: {props.curModule.name}?</p>
          </ModalBody>
          <ModalFooter>
            <Button onClick={ () => {toggleModal()} }>Cancel</Button>
            <Button color="danger" onClick={ () => {
              props.deleteModule(props.curModule.moduleID) 
              toggleModal()
            }}>Delete</Button>
          </ModalFooter>
        </Modal>
      </ButtonDropdown>
    );
  }

  export default SplitDeckBtn