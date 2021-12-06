import React, { useState } from 'react';
import Modal from "../components/Modal";
import { useInjection } from "inversify-react";
import { ModalStore } from "../stores/ModalStore";
import WalletStore, { BLOCK_EXPLORER } from "../stores/WalletStore";
import { ADDRESSES } from "../utils/contracts";
import { toast } from "react-toastify";
import { toBN } from "../utils/number";

interface ISellModalProps {
    modalId: number;
    data: { tokenId: string, balance: number };
}

const SellModal = ({ modalId, data: { tokenId, balance } }: ISellModalProps) => {
    const modalStore = useInjection(ModalStore);
    const walletStore = useInjection(WalletStore);

    const [ amount, setAmount ] = useState('1');
    const [ price, setPrice ] = useState('');
    const [ loading, setLoading ] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            const resource = walletStore.resourceContract;
            const marketplace = walletStore.marketplaceContract;

            const approved = await resource.methods.isApprovedForAll(walletStore.address, ADDRESSES.marketplace).call();
            if (!approved) {
                const tx = await walletStore.sendTransaction(resource.methods.setApprovalForAll(ADDRESSES.marketplace, true));
                toast.success(
                    <>
                        Approved tokens to marketplace contract successfully<br />
                        <a href={`${BLOCK_EXPLORER}/tx/${tx.transactionHash}`} target='_blank'>View in explorer</a>
                    </>
                );
            }
            const tx = await walletStore.sendTransaction(marketplace.methods.putOnSale(tokenId, amount, toBN(price).times('1e18').toFixed(0)));
            toast.success(
                <>
                    Put on sale successfully<br />
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
        <Modal modalId={modalId}>
            <h2 className="section-title text-center">Sell tokens</h2>
            <form className="form" onSubmit={onSubmit}>
                <div className="form__wrap">
                    <div className="form__field">
                        <input
                            className="form__input"
                            type="number"
                            min={1}
                            max={balance}
                            step={1}
                            placeholder="Amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />
                        <div className="form__btn">
                            <button className="count-btn count-btn_more" type="button" onClick={() => setAmount(Math.min(balance, parseInt(amount) + 1).toString())}>
                                <img src={require('url:../images/arrow.png')} alt="" />
                            </button>
                            <button className="count-btn count-btn_less" type="button" onClick={() => setAmount(Math.max(1, parseInt(amount) - 1).toString())}>
                                <img src={require('url:../images/arrow.png')} alt="" />
                            </button>
                        </div>
                    </div>
                    <div className="form__field">
                        <input
                            className="form__input"
                            type="number"
                            placeholder="Total Price in CRAFT (for all cards)"
                            min={0}
                            step={.01}
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                        />
                    </div>
                    <div className="form__field-btn">
                        <button className="section-subtitle" type="button" onClick={() => modalStore.hideModal(modalId)}>Cancel</button>
                        <button className="btn primary" type="submit" disabled={loading || toBN(price).isZero() || toBN(amount).isZero()}>List</button>
                    </div>
                </div>
            </form>
        </Modal>
    )
};

export default SellModal;
