import React from 'react'
import ReactDOM from 'react-dom'
import 'reflect-metadata';
import 'babel-polyfill';

import './sass/main.scss';
import 'react-slidedown/lib/slidedown.css';
import App from './App'
import RootStore from "./stores/RootStore";
import { Provider } from "inversify-react";
import { Router } from "react-router-dom";

export const rootStore = new RootStore();
const container = rootStore.container;

ReactDOM.render(
    <React.StrictMode>
        <Provider container={container}>
            <Router history={rootStore.historyStore}>
                <App />
            </Router>
        </Provider>
    </React.StrictMode>,
  document.getElementById('root')
);

// @ts-ignore
if (module.hot) {
// @ts-ignore
  module.hot.accept();
}
