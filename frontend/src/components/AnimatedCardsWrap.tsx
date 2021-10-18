import React, { useEffect, useRef, useState } from 'react';
import _ from "lodash";
import classNames from "classnames";
import { motion } from 'framer-motion';

type Position = { top: number, left: number, width?: number, height?: number };

interface IAnimatedCardsWrapProps {
    children: React.ReactNodeArray;
    transitionOrigin: HTMLDivElement;
}

function getElementSize(element: HTMLElement) {
    const style = window.getComputedStyle(element),
        rect = element.getBoundingClientRect(),

        width = rect.width, // or use style.width
        marginH = parseFloat(style.marginLeft) + parseFloat(style.marginRight),
        paddingH = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),

        height = rect.height,
        marginV = parseFloat(style.marginTop) + parseFloat(style.marginBottom),
        paddingV = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);

    return { fullWidth: width + marginH, fullHeight: height + marginV, width, height, paddingH, paddingV };
}

const AnimatedCardsWrap = ({ children, transitionOrigin }: IAnimatedCardsWrapProps) => {
    const prevChildren = useRef<React.ReactNodeArray>([]);
    const initialized = useRef(false);
    const lastChild = useRef<HTMLDivElement>();
    const container = useRef<HTMLDivElement>();
    const flyingClone = useRef<any>();

    const [ animating, setAnimating ] = useState(false);
    const [ initialPositions, setInitialPositions ] = useState<Position[]>([]);
    const [ targetPositions, setTargetPositions ] = useState<Position[]>([]);
    const [ flyingCloneInitialPosition, setFlyingCloneInitialPosition ] = useState<Position>();
    const [ flyingCloneTargetPosition, setFlyingCloneTargetPosition ] = useState<Position>();

    useEffect(() => {
        if (initialized.current) {
            if (children.length !== prevChildren.current.length) {
                console.log(lastChild);
                const { fullWidth: lastChildWidth, fullHeight: lastChildHeight, width, height, paddingH } = getElementSize(lastChild.current);
                const itemsPerRow = Math.round(container.current.getBoundingClientRect().width / lastChildWidth);
                const containerRect = container.current.getBoundingClientRect();
                const originRect = transitionOrigin?.getBoundingClientRect();

                let oldPtr = 0;
                let newPtr = 0;
                let offset = 0;
                const positionsArray = [];

                while (true) {
                    if (prevChildren.current.length < children.length) {  // appended
                        if ((prevChildren.current[oldPtr] as any).key !== (children[newPtr] as any).key) {
                            positionsArray.push(originRect ? {
                                top: originRect.top - containerRect.top,
                                left: originRect.left - containerRect.left - paddingH / 2,
                                width: originRect.width + paddingH,
                                height: originRect.height,
                            } : { top: 0, left: 0 });
                            newPtr++;
                            offset++;
                        } else {
                            positionsArray.push({
                                top: lastChildHeight * Math.floor((oldPtr - offset) / itemsPerRow),
                                left: lastChildWidth * ((oldPtr - offset) % itemsPerRow)
                            });
                        }
                    } else {  // removed
                        if ((prevChildren.current[oldPtr] as any).key !== (children[newPtr] as any).key) {
                            flyingClone.current = React.cloneElement(prevChildren.current[oldPtr] as any);
                            setFlyingCloneInitialPosition({
                                top: lastChildHeight * Math.floor(oldPtr / itemsPerRow),
                                left: lastChildWidth * (oldPtr % itemsPerRow),
                                width,
                                height,
                            })
                            oldPtr++;
                        } else {
                            positionsArray.push({
                                top: lastChildHeight * Math.floor(newPtr / itemsPerRow),
                                left: lastChildWidth * (newPtr % itemsPerRow)
                            });
                        }
                    }
                    oldPtr++; newPtr++;
                    if (oldPtr >= prevChildren.current.length || newPtr >= children.length)
                        break;
                }
                setInitialPositions(positionsArray);
                setTargetPositions(_.range(children.length).map(i => ({
                    top: lastChildHeight * Math.floor(i / itemsPerRow),
                    left: lastChildWidth * (i % itemsPerRow),
                    width,
                    height,
                })));
                if (flyingClone.current) {
                    setFlyingCloneTargetPosition({
                        top: originRect.top - containerRect.top,
                        left: originRect.left - containerRect.left - paddingH / 2,
                        width: originRect.width + paddingH,
                        height: originRect.height,
                    });
                }
                setAnimating(true);
                setTimeout(() => {
                    setAnimating(false);
                    flyingClone.current = undefined;
                }, 300);
            }
        } else if (children.length > 0) {
            initialized.current = true;
        }
        prevChildren.current = children;
    }, [children]);

    return (
        <div className={classNames('cards-wrap', { animating })} style={{ height: animating && container.current.getBoundingClientRect().height }} ref={container}>
            {children.map((c, i) => {
                if (animating)
                    return (
                        <motion.div
                            className='card'
                            key={i}
                            style={initialPositions[i]}
                            animate={targetPositions[i]}
                            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                        >
                            {c}
                        </motion.div>
                    );
                else
                    return (
                        <div
                            className='card'
                            key={i}
                            ref={ref => ref ? lastChild.current = ref : null}
                            style={animating ? initialPositions[i] : undefined}
                        >
                            {c}
                        </div>
                    );
            })}
            {animating && flyingClone.current && (
                <motion.div
                    className='card'
                    style={flyingCloneInitialPosition}
                    animate={flyingCloneTargetPosition}
                    transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                >
                    {flyingClone.current}
                </motion.div>
            )}
        </div>
    )
};

export default AnimatedCardsWrap;
