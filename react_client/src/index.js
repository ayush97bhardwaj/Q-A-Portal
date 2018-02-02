import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import { Router, Route } from 'react-router-dom';
import createBrowserHistory from 'history/createBrowserHistory'

const history=createBrowserHistory()
ReactDOM.render(
<Router history={history}>
    <App/>
</Router>,
 document.getElementById('root'));
registerServiceWorker();
