import React from 'react';

interface ICardProps {
}

const Card = ({}: ICardProps) => {
    return (
        <div className="card">
            <div className="card__wrap" style={{ backgroundImage: `url(${require('url:../images/card-bg.jpg')})` }}>
                <div className="card__image"><img src={require('url:../images/card.png')} alt="" /></div>
            </div>
        </div>
    )
};

export default Card;
