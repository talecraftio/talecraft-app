import React, { useState } from 'react';
import Modal from "../components/Modal";
import { useInjection } from "inversify-react";
import { ModalStore } from "../stores/ModalStore";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { toast } from "react-toastify";

interface ITransferModalProps {
    modalId: number;
    data: { balance: number, tokenId: string };
}

const TransferModal = ({ modalId, data: { balance, tokenId } }: ITransferModalProps) => {
    const modalStore = useInjection(ModalStore);
    const walletStore = useInjection(WalletStore);

    const [ address, setAddress ] = useState('');
    const [ amount, setAmount ] = useState('');
    const [ loading, setLoading ] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!walletStore.web3.utils.isAddress(address)) {
            toast.error('Invalid address');
        }
        setLoading(true);
        try {
            const tx = await walletStore.sendTransaction(walletStore.resourceContract.methods.safeTransferFrom(walletStore.address, address, tokenId, amount, []));
            toast.success(
                <>
                    Tokens were successfully transferred<br />
                    <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                </>
            );
            modalStore.hideModal(modalId);
        } catch (e) {
            toast.error('An error has occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal modalId={modalId} closable={!loading}>
            <h2 className="section-title text-center">Transfer</h2>
            <form className="form" onSubmit={onSubmit}>
                <div className="form__wrap">
                    <div className="form__field">
                        <input
                            className="form__input"
                            type="text"
                            required
                            placeholder="Address"
                            disabled={loading}
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                        />
                    </div>
                    <div className="form__field">
                        <input
                            className="form__input"
                            type="number"
                            required
                            min={1}
                            max={balance}
                            placeholder="Amount"
                            disabled={loading}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="form__field-btn">
                        <button className="section-subtitle" type="button" onClick={() => modalStore.hideModal(modalId)} disabled={loading}>Cancel</button>
                        <button className="btn primary" type="submit" disabled={loading}>Send</button>
                    </div>
                </div>
            </form>
        </Modal>
    )
};

export default TransferModal;
