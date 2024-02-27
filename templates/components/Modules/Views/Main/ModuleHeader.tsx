import { Row, Input, InputGroup, InputGroupText, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem, Button } from 'reactstrap';
import Image from 'next/image';
import searchImage from '@/public/static/images/search.png';
import { useUser } from '@/hooks/useUser';
import { Module } from '@/types/api/modules';

export default function ModuleHeader({
    curModule,
    searchCard,
    updateSearchCard,
    addTermButtonOpen,
    toggleAddTermButton,
    changeOpenForm
}: {
    curModule: Module | undefined;
    searchCard: string;
    updateSearchCard: (e: any) => void;
    addTermButtonOpen: boolean;
    toggleAddTermButton: () => void;
    changeOpenForm: (form: number) => void;
}) {
    const { user } = useUser();
    const permissionLevel = user?.permissionGroup;

    return (
        <Row className='Header' style={{ marginBottom: '15px' }}>
            {/*Search Bar for all cards in a deck, with the buttons for adding new items as appendages*/}
            <InputGroup style={{ borderRadius: '12px', padding: 0 }} className='shadow'>
                <div style={{ display: 'flex' }}>
                    <InputGroupText
                        id='module-name'
                        style={{
                            border: 'none',
                            borderRadius: '12px 0px 0px 12px',
                            color: curModule?.isPastaModule ? 'red' : undefined
                        }}
                    >
                        {curModule?.name}
                    </InputGroupText>
                </div>
                <div style={{ margin: '10px' }}>
                    <Image src={searchImage} alt='Icon made by Freepik from www.flaticon.com' style={{ width: '15px', height: '15px' }} />
                </div>
                <Input style={{ border: 'none' }} type='text' placeholder='Search' value={searchCard} onChange={(e) => updateSearchCard(e)} />

                {permissionLevel !== 'st' && !curModule?.isPastaModule ? (
                    <>
                        {/* The button for the Add Term forms */}
                        <div style={{ display: 'flex' }}>
                            <ButtonDropdown isOpen={addTermButtonOpen} toggle={toggleAddTermButton}>
                                <DropdownToggle
                                    style={{
                                        backgroundColor: '#3e6184',
                                        borderRadius: '0px'
                                    }}
                                    caret
                                >
                                    Add Term
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem onClick={() => changeOpenForm(1)}> Add Existing</DropdownItem>
                                    <DropdownItem onClick={() => changeOpenForm(2)}> Add New</DropdownItem>
                                </DropdownMenu>
                            </ButtonDropdown>
                        </div>

                        {/* The button for the Add Phrase form */}
                        <div style={{ display: 'flex' }}>
                            <Button
                                style={{
                                    backgroundColor: '#3e6184',
                                    borderRadius: '0px'
                                }}
                                onClick={() => changeOpenForm(3)}
                            >
                                Add Phrase
                            </Button>
                        </div>

                        {/* The button for the Add Question form */}
                        <div style={{ display: 'flex' }}>
                            <Button
                                style={{
                                    backgroundColor: '#3e6184',
                                    borderRadius: '0px'
                                }}
                                onClick={() => changeOpenForm(4)}
                            >
                                Add Question
                            </Button>
                        </div>

                        {/* The button for the Add Mentor Question form */}
                        <div style={{ display: 'flex' }}>
                            <Button
                                style={{
                                    backgroundColor: '#3e6184',
                                    borderRadius: '0px 12px 12px 0px'
                                }}
                                onClick={() => changeOpenForm(5)}
                            >
                                Add Mentor Question
                            </Button>
                        </div>
                    </>
                ) : null}
                {permissionLevel !== 'st' && curModule?.isPastaModule ? (
                    <>
                        <div style={{ display: 'flex' }}>
                            <Button
                                style={{
                                    backgroundColor: '#3e6184',
                                    borderRadius: '0px'
                                }}
                                onClick={() => changeOpenForm(6)}
                            >
                                Add Question Frame
                            </Button>
                        </div>
                        {/* The button for the Add Pasta form */}
                        <div style={{ display: 'flex' }}>
                            <Button
                                style={{
                                    backgroundColor: '#3e6184',
                                    borderRadius: '0px 12px 12px 0px'
                                }}
                                onClick={() => changeOpenForm(7)}
                            >
                                Add Pasta
                            </Button>
                        </div>
                    </>
                ) : null}
            </InputGroup>
        </Row>
    );
}
