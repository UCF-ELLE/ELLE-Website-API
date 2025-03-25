// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faLinkSlash } from '@fortawesome/free-solid-svg-icons';
import deleteImage from '@/public/static/images/delete.png';
import Image from 'next/image';
import { useState } from 'react';
import { Modal, ModalBody, ModalHeader, Button } from "reactstrap";


type ModuleRowProps = {
    module: { moduleID: number, name: string };
    onUnlink: (moduleID: number) => void;
};

function ModuleRow({ module, onUnlink }: ModuleRowProps) {

    const [confirmationModal, setConfirmationModal] = useState(false);
    const confirmationToggle = () => setConfirmationModal(!confirmationModal);


    return (
        <>
        <tr>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{module.name}</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                <Button onClick={confirmationToggle}>
                    <Image
                        src={deleteImage}
                        alt='trash can icon'
                        style={{
                            width: '25px',
                            height: '25px'
                        }}
                    />
                </Button>
            </td>
        </tr>
        <Modal
            isOpen={confirmationModal}
            toggle={confirmationToggle}
            modalTransition={{ timeout: 2000 }}
            scrollable={ false }
            centered={ true } 
        >
            <ModalHeader>
                Are you sure you want to unlink this module?
            </ModalHeader>
            <ModalBody className='ms-2'>
                <Button color="primary" size="md" onClick={() => onUnlink(module.moduleID)}>Yes</Button>
                <Button className='ms-2' color="secondary" size="md" onClick={confirmationToggle}>No</Button>
            </ModalBody>
        </Modal>
        </>
    );
}

export default ModuleRow;
