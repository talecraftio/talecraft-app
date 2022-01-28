import React, { useState } from 'react';
import Modal from "../components/Modal";
import { useInjection } from "inversify-react";
import { ModalStore } from "../stores/ModalStore";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { toast } from "react-toastify";
import { toBN } from "../utils/number";
import { ADDRESSES } from "../utils/contracts";

interface ILendModalProps {
    modalId: number;
    data: { tokenId: string };
}

const LendModal = ({ modalId, data: { tokenId } }: ILendModalProps) => {
    const modalStore = useInjection(ModalStore);
    const walletStore = useInjection(WalletStore);

    const [ price, setPrice ] = useState('');
    const [ duration, setDuration ] = useState('');
    const [ loading, setLoading ] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            if (!await walletStore.resourceContract.methods.isApprovedForAll(walletStore.address, ADDRESSES.lending).call()) {
                const tx = await walletStore.sendTransaction(walletStore.resourceContract.methods.setApprovalForAll(ADDRESSES.lending, true));
                toast.success(
                    <>
                        Approved tokens to lending contract successfully<br />
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
            }
            const tx = await walletStore.sendTransaction(walletStore.gameLendingContract.methods.list(tokenId, duration, toBN(price).times('1e18').toFixed(0)));
            toast.success(
                <>
                    Token was successfully put for lending<br />
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
            <h2 className="section-title text-center">Lend</h2>
            <form className="form" onSubmit={onSubmit}>
                <div className="form__wrap">
                    <div className="form__field">
                        <input
                            className="form__input"
                            type="number"
                            required
                            min={0}
                            step={.01}
                            placeholder="Price"
                            disabled={loading}
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                        />
                    </div>
                    <div className="form__field">
                        <input
                            className="form__input"
                            type="number"
                            required
                            min={1}
                            step={1}
                            placeholder="Duration (seconds)"
                            disabled={loading}
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                        />
                    </div>
                    <div className="form__field-btn">
                        <button className="section-subtitle" type="button" onClick={() => modalStore.hideModal(modalId)} disabled={loading}>Cancel</button>
                        <button className="btn primary" type="submit" disabled={loading}>Lend</button>
                    </div>
                </div>
            </form>
        </Modal>
    )
};

export default LendModal;
