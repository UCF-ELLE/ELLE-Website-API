// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faLinkSlash } from '@fortawesome/free-solid-svg-icons';
import deleteImage from '@/public/static/images/delete.png';
import { Button } from 'reactstrap';
import Image from 'next/image';


type ModuleRowProps = {
    module: { moduleID: number, name: string };
    onUnlink: (moduleID: number) => void;
};

function ModuleRow({ module, onUnlink }: ModuleRowProps) {

    return (
        <tr>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{module.name}</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                <Button onClick={() => onUnlink(module.moduleID)}>
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
    );
}

export default ModuleRow;
