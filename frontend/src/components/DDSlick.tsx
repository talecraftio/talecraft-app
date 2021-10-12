import React, { useEffect, useState } from 'react';
import classNames from "classnames";
import ClickAwayListener from "react-click-away-listener";
import SlideDown from "react-slidedown";

interface IDDSlickProps<T> {
    children: JSX.Element[];
    className?: string;
    selected: T;
    onChange: (val: T) => any;
}

interface Option<T> {
    text: string,
    value: T;
}

const DDSlick = <T extends unknown>({ children, className, selected, onChange }: IDDSlickProps<T>) => {
    const [ items, setItems ] = useState<Option<T>[]>([]);
    const [ open, setOpen ] = useState(false);

    useEffect(() => {
        setItems(children.map((op, i) => ({
            text: op.props.children,
            value: op.props.value,
        })));
    }, [ children ])

    return (
        <div className={classNames('dd-container', className)}>
            <div className="dd-select" onClick={() => setOpen(true)}>
                <a className="dd-selected">
                    <label className="dd-option-text">{items.filter(i => i.value === selected)[0]?.text}</label>
                </a>
                <span className={classNames('dd-pointer dd-pointer-down', { ['dd-pointer-up']: open })}/>
            </div>
            <ClickAwayListener onClickAway={() => open && setOpen(false)}>
                <SlideDown as='ul' closed={!open} className="dd-options">
                    {items.map((op, i) => (
                        <a key={i} className='dd-option' onClick={() => { setOpen(false); onChange(op.value) }}>
                            <label className="dd-option-text">{op.text}</label>
                        </a>
                    ))}
                </SlideDown>
            </ClickAwayListener>
        </div>
    )
};

export default DDSlick;
