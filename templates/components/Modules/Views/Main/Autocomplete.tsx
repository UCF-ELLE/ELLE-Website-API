import { Tag } from '@/types/api/terms';
import React, { Fragment, useState } from 'react';
import { Button, Input } from 'reactstrap';

//TODO: make it so that when you press enter on the input field, it adds an item to the component
//that called it. Also need to make it so that when it renders an "Add new" button, it enables the
//user to add a new thing

export default function Autocomplete({
    name,
    id,
    termIDs,
    needID,
    placeholder,
    handleAddTag,
    handleAddAnswer,
    createTag,
    createAnswer,
    renderButton,
    suggestions,
    autoCompleteStyle
}: {
    name: string;
    id: string;
    termIDs?: number[];
    needID?: number;
    placeholder: string;
    handleAddTag?: (tag: Tag) => void;
    handleAddAnswer?: (event: any) => void;
    createTag?: (tag: Tag) => void;
    createAnswer?: (answer: string) => void;
    renderButton: boolean;
    suggestions: Tag[];
    autoCompleteStyle?: React.CSSProperties;
}) {
    //   static propTypes = {
    //     suggestions: PropTypes.instanceOf(Array)
    //   };

    //   static defaultProps = {
    //     suggestions: []
    //   };

    const [activeSuggestion, setActiveSuggestion] = useState<number>(0);
    const [filteredSuggestions, setFilteredSuggestions] = useState<Tag[]>([]);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [userInput, setUserInput] = useState<string>('');

    const handleCreate = () => {
        if (createTag !== undefined) {
            handleCreateTag();
        } else if (createAnswer !== undefined) {
            handleCreateAnswer();
        }
    };

    const handleCreateTag = () => {
        createTag && createTag(userInput);
        setActiveSuggestion(0);
        setShowSuggestions(false);
        setUserInput('');
    };

    const handleCreateAnswer = () => {
        createAnswer && createAnswer(userInput);
        setActiveSuggestion(0);
        setShowSuggestions(false);
        setUserInput('');
    };

    // Event fired when the input value is changed
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const userInput = e.currentTarget.value;

        // Filter our suggestions that don't contain the user's input
        const filteredSuggestions = suggestions.filter((suggestion) => {
            suggestion ? suggestion.toLowerCase().indexOf(userInput.toLowerCase()) > -1 : null;
        });
        // Update the user input and filtered suggestions, reset the active
        // suggestion and make sure the suggestions are shown
        setActiveSuggestion(0);
        setFilteredSuggestions(filteredSuggestions);
        setShowSuggestions(true);
        setUserInput(e.currentTarget.value);
    };

    // Event fired when the user clicks on a suggestion
    const onClick = (e: React.MouseEvent<HTMLLIElement>) => {
        // Update the user input and reset the rest of the state
        setActiveSuggestion(0);
        setFilteredSuggestions([]);
        setShowSuggestions(false);
        setUserInput('');

        if (handleAddTag !== undefined) {
            handleAddTag(e.currentTarget.innerText);
        } else if (handleAddAnswer !== undefined) {
            if (needID === 0) {
                handleAddAnswer({ answer: e.currentTarget.innerText });
            } else {
                let index = suggestions.findIndex((entry) => entry === e.currentTarget.innerText);
                handleAddAnswer({
                    answer: e.currentTarget.innerText,
                    answerID: termIDs ? termIDs[index] : 0
                });
            }
        }
    };

    // Event fired when the user presses a key down
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // User pressed the enter key, update the input and close the
        // suggestions
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredSuggestions.length === 1) {
                setActiveSuggestion(0);
                setShowSuggestions(false);
                setUserInput('');

                if (handleAddTag !== undefined) {
                    handleAddTag(filteredSuggestions[0]);
                } else if (handleAddAnswer !== undefined) {
                    if (needID === 0) {
                        handleAddAnswer({ answer: filteredSuggestions[0] });
                    } else {
                        let index = suggestions.findIndex((entry) => entry === filteredSuggestions[0]);
                        handleAddAnswer({
                            answer: filteredSuggestions[0],
                            answerID: termIDs ? termIDs[index] : 0
                        });
                    }
                }
            } else if (filteredSuggestions.length > 1) {
                let tempUserInput = filteredSuggestions[activeSuggestion];

                let tempFilteredSuggestions = suggestions.filter((suggestion) => {
                    return suggestion ? suggestion?.toLowerCase().indexOf(tempUserInput ? tempUserInput.toLowerCase() : 'undefined') > -1 : null;
                });

                setActiveSuggestion(0);
                setShowSuggestions(true);
                setUserInput(tempUserInput || '');
                setFilteredSuggestions(tempFilteredSuggestions);
            }
        }
        // User pressed the up arrow, decrement the index
        else if (e.key === 'ArrowUp') {
            if (activeSuggestion === 0) {
                return;
            }

            setActiveSuggestion(activeSuggestion - 1);
        }
        // User pressed the down arrow, increment the index
        else if (e.key === 'ArrowDown') {
            if (activeSuggestion - 1 === filteredSuggestions.length) {
                return;
            }
            setActiveSuggestion(activeSuggestion + 1);
        }
    };

    let suggestionsListComponent;

    if (showSuggestions && userInput) {
        if (filteredSuggestions.length) {
            suggestionsListComponent = (
                <ul className='suggestions'>
                    {filteredSuggestions.map((suggestion, index) => {
                        let className;

                        // Flag the active suggestion with a class
                        if (index === activeSuggestion) {
                            className = 'suggestion-active';
                        }

                        return (
                            <li className={className} key={suggestion} onClick={onClick}>
                                {suggestion}
                            </li>
                        );
                    })}
                </ul>
            );
        } else if (renderButton === true) {
            suggestionsListComponent = (
                <div className='no-suggestions'>
                    <Button style={{ backgroundColor: '#004085' }} onClick={() => handleCreate()}>
                        Add new {placeholder}
                    </Button>
                </div>
            );
        }
    }

    return (
        <Fragment>
            <Input
                type='text'
                onChange={onChange}
                onKeyDown={onKeyDown}
                value={userInput}
                style={autoCompleteStyle}
                name={name}
                id={id}
                placeholder={placeholder}
                autoComplete='off'
            />
            {suggestionsListComponent}
        </Fragment>
    );
}
