import React from 'react'
import {
    Button, Modal, ModalFooter,
    ModalHeader, ModalBody
} from "reactstrap"

function App() {

    // Modal open state
    const [modal, setModal] = React.useState(false);

    // Toggle for Modal
    const toggle = () => setModal(!modal);

    return (
        <div style={{
            display: 'block', width: 700, padding: 30
        }}>
            <h4>ReactJS Reactstrap Modal Component</h4>
            <Button color="primary"
                onClick={toggle}>Open Modal</Button>
            <Modal isOpen={modal}
                toggle={toggle}
                modalTransition={{ timeout: 2000 }}
                fullscreen={true}
                >
                <ModalBody>
                    <p>Simple modal with a modal body...</p>
                </ModalBody>
            </Modal>
        </div >
    );
}

export default App;