import { useCallback, useEffect, useMemo, useState } from 'react';

/* Create a react element that takes in a string and displays each character, minus the last one, followed by a dot or circle. When the circle is clicked, the index of the character(s) that have been clicked is displayed. */
export const SplitComponent = ({
    text,
    indexes,
    setIndexes,
    dotSize,
    fontSize
}: {
    text: string;
    indexes: number[];
    setIndexes: (vals: number[]) => void;
    dotSize?: number;
    fontSize?: number;
}) => {
    const onDotClick = useCallback(
        (index: number) => {
            if (indexes.includes(index)) {
                const newIndexes = indexes.filter((i) => i !== index);
                newIndexes.sort((a, b) => a - b);
                setIndexes(newIndexes);
            } else {
                const newIndexes = [...indexes, index].sort((a, b) => a - b);
                setIndexes(newIndexes);
            }
        },
        [indexes, setIndexes]
    );

    const SplitText = useMemo(() => {
        const curatedText = text.replace(/[^a-zA-Z0-9]/g, '');
        return curatedText.split('').map((char, index) => (
            <span
                key={index}
                style={{
                    fontSize: fontSize ? `${fontSize}px` : undefined,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                {char}
                {index < text.length - 1 ? <Dot sendFeedback={() => onDotClick(index)} size={dotSize} selected={indexes.includes(index)} /> : null}
            </span>
        ));
    }, [text, fontSize, dotSize, indexes, onDotClick]);

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}
        >
            {SplitText}
        </div>
    );
};

/* Create a dot element that is a red circle. When the circle is clicked, change the circle color to green and call a "sendFeedback" function from props. */
const Dot = ({ sendFeedback, selected, size }: { sendFeedback: () => void; selected: boolean; size?: number }) => {
    const [color, setColor] = useState('red');

    useEffect(() => {
        setColor(selected ? 'green' : 'red');
    }, [selected]);

    const styles = useMemo(() => {
        return {
            width: size ? `${size}px` : '20px',
            height: size ? `${size}px` : '20px',
            backgroundColor: selected ? color : undefined,
            display: 'inline-block',
            margin: '0 3px',
            // If selected, circle. It not, triangle.
            borderRadius: selected ? '50%' : undefined,
            borderLeft: !selected ? `${(size ?? 20) / 2}px solid transparent` : undefined,
            borderRight: !selected ? `${(size ?? 20) / 2}px solid transparent` : undefined,
            borderTop: !selected ? `${size}px solid ${color}` : undefined
        };
    }, [color, selected, size]);

    return (
        <div
            style={styles}
            onClick={sendFeedback}
            onMouseEnter={() => setColor('yellow')}
            onMouseLeave={() => setColor(selected ? 'green' : 'red')}
        ></div>
    );
};

export default Dot;
