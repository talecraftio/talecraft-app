import React from 'react';
import Modal from "../components/Modal";
import { useInjection } from "inversify-react";
import { ModalStore } from "../stores/ModalStore";

interface ISellModalProps {
    modalId: number;
}

const SellModal = ({ modalId }: ISellModalProps) => {
    const modalStore = useInjection(ModalStore);

    return (
        <Modal modalId={modalId}>
            <h2 className="section-title text-center"> What is the price?</h2>
            <form className="form" action="#">
                <div className="form__wrap">
                    <div className="form__field">
                        <input className="form__input" type="number" name="price" id="price" placeholder="Type here" />
                        <div className="form__btn">
                            <button className="count-btn count-btn_more" type="button">
                                <img src={require('url:../images/arrow.png')} alt="" />
                                </button>
                            <button className="count-btn count-btn_less" type="button">
                                <img src={require('url:../images/arrow.png')} alt="" />
                            </button>
                        </div>
                    </div>
                    <div className="form__field-btn">
                        <button className="section-subtitle" type="button" onClick={() => modalStore.hideModal(modalId)}>Cancel</button>
                        <button className="btn primary" type="submit">List</button>
                    </div>
                </div>
            </form>
        </Modal>
    )
};

export default SellModal;
