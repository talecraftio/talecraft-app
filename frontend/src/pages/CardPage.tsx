import React from 'react';
import { ModalsEnum, ModalStore } from "../stores/ModalStore";
import { useInjection } from "inversify-react";

interface ICardPageProps {
}

const CardPage = ({}: ICardPageProps) => {
    const modalStore = useInjection(ModalStore);

    return (
        <main className="main">
            <section className="card-section">
                <div className="container">
                    <div className="card-wrap">
                        <div className="card card_market">
                            <div className="card__wrapper">
                                <div className="card__wrap">
                                    <div className="card__image"><img src={require('url:../../../contracts/images_utils/images/Penguin.png')} alt="" /></div>
                                </div>
                                <div className="card__body">
                                    <p className="card__text">#4444</p>
                                </div>
                            </div>
                        </div>
                        <div className="card-info">
                            <h2 className="section-title">Penguin</h2>
                            <div className="card-table">
                                <div className="card-row"><span className="card__name">Name</span><span className="card__name">Penguin</span></div>
                                <div className="card-row"><span>ID</span><span>1234</span></div>
                                <div className="card-row"><span>Tier</span><span>Silver</span></div>
                                <div className="card-row"><span>Weight</span><span>56</span></div>
                            </div>
                            <div className="card-footer">
                                <button className="btn primary" type="button" onClick={() => modalStore.showModal(ModalsEnum.Sell)}>Put on Marketplace</button>
                                <button className="btn primary" type="button" onClick={() => modalStore.showModal(ModalsEnum.Transfer)}>Transfer</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="decor-img decor-img--top"><img src={require('url:../images/decor.png')} alt="" /></div>
        </main>
    )
};

export default CardPage;
