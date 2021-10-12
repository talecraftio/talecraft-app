import React, { useEffect } from 'react';
import { observer } from "mobx-react";
import { ModalStore } from "../stores/ModalStore";
import { useInjection } from "inversify-react";
import classNames from "classnames";

interface IModalProps {
    onShow?: () => any;
    onHide?: () => any;
    className?: string;
    closable?: boolean;
    modalId: number;
}

type P = React.PropsWithChildren<IModalProps>;

const Modal: React.FC<P> = observer(({ children, onShow, onHide, className, closable = true, modalId }: P) => {
    const modalStore = useInjection(ModalStore);
    const visible = modalStore.visibleModals.includes(modalId);

    useEffect(() => {
        onShow?.();
        return () => onHide?.();
    }, []);

    return (
        <>
            <div className={classNames(visible && 'visible', 'mask')} onClick={() => closable && modalStore.hideModal(modalId)} />
            <div className={classNames('modal', className, visible && 'visible')}>
                <div className="modal__wrap">
                    {children}
                </div>
            </div>
        </>
    )
});

export default Modal;
