import React from 'react';
import Modal from "../components/Modal";
import { useInjection } from "inversify-react";
import { ModalStore } from "../stores/ModalStore";

interface ITransferModalProps {
    modalId: number;
}

const TransferModal = ({ modalId }: ITransferModalProps) => {
    const modalStore = useInjection(ModalStore);

    return (
        <Modal modalId={modalId}>
            <h2 className="section-title text-center">Target Address?</h2>
            <form className="form" action="#">
                <div className="form__wrap">
                    <div className="form__field">
                        <input className="form__input" type="text" name="adress" id="adress" placeholder="Type here" />
                    </div>
                    <div className="form__field-btn">
                        <button className="section-subtitle" type="button" onClick={() => modalStore.hideModal(modalId)}>Cancel</button>
                        <button className="btn primary" type="submit">Send</button>
                    </div>
                </div>
            </form>
        </Modal>
    )
};

export default TransferModal;
