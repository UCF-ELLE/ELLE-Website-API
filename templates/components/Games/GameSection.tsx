/* <a id='VirtuELLEMentor'></a>
<section style={{ color: 'white' }}>
    <div className='container'>
        <div className='infoCard' style={{ backgroundColor: '#3f6184' }}>
            <Row>
                <Col>
                    <h3 className='cta-title'>VirtuELLE Mentor</h3>
                    <p className='cta-text'>Original Senior Design Team:</p>
                    <ul style={{ color: '#ffffff' }}>
                        <Row>
                            <Col>
                                <li>Noah Corlew</li>
                                <li>Kalvin Miller</li>
                                <li>Michael Santiago</li>
                            </Col>
                        </Row>
                    </ul>

                    <p className='cta-text'>Version 2 Senior Design Team:</p>
                    <ul style={{ color: '#ffffff' }}>
                        <Row>
                            <Col>
                                <li>Annabel Bland</li>
                                <li>Tyler Morejon</li>
                                <li>Nathan Otis</li>
                            </Col>
                            <Col>
                                <li>Daniel Rodriguez</li>
                                <li>Tanner Williams</li>
                            </Col>
                        </Row>
                    </ul>
                    <p className='cta-text'>Version 3 Senior Design Team</p>
                    <ul style={{ color: '#ffffff' }}>
                        <Row>
                            <Col>
                                <li>Nathan Lim</li>
                                <li>Justin Moy</li>
                                <li>Connor Lysek</li>
                            </Col>
                            <Col>
                                <li>Skylar Marosi</li>
                                <li>Keilvin Tran</li>
                            </Col>
                        </Row>
                    </ul>
                    <br />
                    <p className='cta-text'>
                        {' '}
                        Come learn a language, select your own mentor, and play to unlock unique prizes and customization!{' '}
                    </p>
                    <p className='cta-text'>
                        <Link
                            href={user?.jwt ? '/games/virtuellementor' : '/login'}
                            className={`cardGameButton ${!user?.jwt ? 'disabled' : ''}`}
                        >
                            {user?.jwt ? 'Play Here!' : 'Log In to Play'}
                        </Link>
                    </p>
                </Col>
                <Col>
                    <Image
                        style={{
                            width: 'auto',
                            height: '280px',
                            marginLeft: '70px',
                            marginTop: '80px'
                        }}
                        alt='Card Game Image'
                        src={CardGameImage}
                    />
                </Col>
            </Row>
        </div>
    </div>
</section> */

import Link from 'next/link';
import { Row, Col } from 'reactstrap';
import Image, { StaticImageData } from 'next/image';
import { useUser } from '@/hooks/useUser';
import React, { useMemo } from 'react';

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

    // If team members are more than four, make a new column. The first column will have 3, and the second will have the rest.
    // If team members are four or less, do not make a new column.
    const MemberColumns = useMemo(() => {
        if (teams) {
            return teams.map((team) => (
                <div key={team.name.replace(' ', '-')}>
                    <p className='cta-text'>{team.name}</p>
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
                </div>
            ));
        } else return <></>;
    }, [teams]);

    const buttonColorVar = useMemo(() => {
        if (external) return buttonColor || '#3f6184';
        return user?.jwt ? buttonColor || '#3f6184' : 'gray';
    }, [buttonColor, external, user?.jwt]);

    const linkStyles = useMemo((): React.CSSProperties => {
        return {
            border: '1px solid #3f6184',
            borderRadius: '12px',
            background: buttonColorVar,
            pointerEvents: !user?.jwt && !external ? 'none' : 'auto',
            color: '#ffffff',
            display: 'inline-block',
            padding: '15px',
            opacity: '1'
        };
    }, [buttonColorVar, external, user?.jwt]);

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
                                    <Link
                                        href={!external ? (user?.jwt ? link : '/login') : link}
                                        style={linkStyles}
                                        className={`${!user?.jwt ? 'disabled' : ''}`}
                                    >
                                        {!external ? (user?.jwt ? 'Play Here!' : 'Log In to Play') : 'Available Here!'}
                                    </Link>
                                </p>
                            </Col>
                            <Col>
                                <Image
                                    style={{
                                        width: 'auto',
                                        height: '280px',
                                        marginLeft: '70px'
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
