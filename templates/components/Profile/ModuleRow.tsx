import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkSlash } from '@fortawesome/free-solid-svg-icons';

type ModuleRowProps = {
    module: { name: string };
    onUnlink: () => void;
};

function ModuleRow({ module, onUnlink }: ModuleRowProps) {
    return (
        <tr>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{module.name}</td>
            <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                <FontAwesomeIcon
                    icon={faLinkSlash}
                    style={{ cursor: 'pointer', color: 'red' }}
                    onClick={onUnlink}
                />
            </td>
        </tr>
    );
}

export default ModuleRow;
