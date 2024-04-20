import Link from 'next/link';
import { Row, Col, Collapse } from 'reactstrap';
import Image, { StaticImageData } from 'next/image';
import { useUser } from '@/hooks/useAuth';
import React, { useMemo } from 'react';
import { CaretDownFill } from 'react-bootstrap-icons';

// Genericize the above code to be a component that can be used for any game
type GameSectionProps = {
    anchor?: string;
    link: string;
    external?: boolean;
    title: string;
    description: string;
    color?: string;
    buttonColor?: string;
    image: string | StaticImageData;
    altImage?: string;
    teams?: {
        name: string;
        members: string[];
    }[];
};
export default function GameSection({ anchor, link, external, title, description, color, buttonColor, image, altImage, teams }: GameSectionProps) {
    const { user } = useUser();
    const [teamColumns, setTeamColumns] = React.useState<{ isOpen: boolean; members: string[]; name: string }[]>(
        teams?.map((team) => ({ ...team, isOpen: false })) || []
    );

    const rotate = (team: { isOpen: boolean; members: string[]; name: string }) => (team.isOpen ? 'rotate(180deg)' : 'rotate(0deg)');
    const handleCollapse = (team: { isOpen: boolean; members: string[]; name: string }) => {
        setTeamColumns((prev) => prev.map((prevTeam) => (prevTeam.name === team.name ? { ...prevTeam, isOpen: !prevTeam.isOpen } : prevTeam)));
    };

    // If team members are more than four, make a new column. The first column will have 3, and the second will have the rest.
    // If team members are four or less, do not make a new column.
    const MemberColumns = useMemo(() => {
        if (teams) {
            return teamColumns?.map((team) => (
                <div key={team.name.replace(' ', '-')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <p style={{ marginBottom: 8 }}>{team.name}</p>
                        <CaretDownFill
                            style={{ transform: rotate(team), transition: 'all 0.2s linear', marginBottom: 4 }}
                            onClick={() => handleCollapse(team)}
                        />
                    </div>
                    <Collapse isOpen={team.isOpen}>
                        <ul style={{ color: '#ffffff' }}>
                            <Row>
                                {team.members.length > 4 ? (
                                    <>
                                        <Col>
                                            {team.members.slice(0, 3).map((member) => (
                                                <li key={member.replace(' ', '-')}>{member}</li>
                                            ))}
                                        </Col>
                                        <Col>
                                            {team.members.slice(3).map((member) => (
                                                <li key={member.replace(' ', '-')}>{member}</li>
                                            ))}
                                        </Col>
                                    </>
                                ) : (
                                    <Col>
                                        {team.members.map((member) => (
                                            <li key={member.replace(' ', '-')}>{member}</li>
                                        ))}
                                    </Col>
                                )}
                            </Row>
                        </ul>
                    </Collapse>
                </div>
            ));
        } else return <></>;
    }, [teamColumns, teams]);

    const buttonColorVar = useMemo(() => buttonColor || '#3f6184', [buttonColor]);

    const linkStyles = useMemo((): React.CSSProperties => {
        return {
            border: '1px solid #3f6184',
            borderRadius: '12px',
            background: buttonColorVar,
            pointerEvents: 'auto',
            color: '#ffffff',
            display: 'inline-block',
            padding: '15px',
            opacity: '1'
        };
    }, [buttonColorVar]);

    return (
        <>
            <a id={anchor || title.replace(/\s/g, '')}></a>
            <section style={{ color: 'white' }}>
                <div className='container'>
                    <div className='infoCard' style={{ backgroundColor: color || '#3f6184' }}>
                        <Row>
                            <Col style={{ display: 'flex', flexDirection: 'column' }}>
                                <h3 className='cta-title'>{title}</h3>
                                {MemberColumns}
                                <p className='cta-text'>{description}</p>
                                <p style={{ padding: 0, margin: 'auto 0 15px' }}>
                                    <Link href={!external ? (user?.jwt ? link : '/login') : link} style={linkStyles}>
                                        {!external ? (user?.jwt ? 'Play Here!' : 'Log In to Play') : 'Available Here!'}
                                    </Link>
                                </p>
                            </Col>
                            <Col style={{ display: 'flex', justifyContent: 'center' }}>
                                <Image
                                    style={{
                                        width: '500px',
                                        height: '280px'
                                    }}
                                    alt={altImage || 'Card Game Image'}
                                    src={image}
                                />
                            </Col>
                        </Row>
                    </div>
                </div>
            </section>
        </>
    );
}
