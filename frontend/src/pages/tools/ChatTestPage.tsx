import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore from "../../stores/WalletStore";
import { observer } from 'mobx-react';
import { toast } from "react-toastify";
import _ from "lodash";
import useStateRef from "react-usestateref";
import Timeout from "await-timeout";
import ChatWidget from "../../components/ChatWidget";

interface IChatTestPageProps {
}

const ChatTestPage = observer(({}: IChatTestPageProps) => {
    return (
        <main className="main chat" style={{ color: 'white' }}>
            <div className="container" style={{ marginTop: 150 }}>
                <ChatWidget chatId='1' />
            </div>
        </main>
    )
});

export default ChatTestPage;
