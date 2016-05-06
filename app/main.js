import React from 'react';
import { Router } from 'react-router';
import ReactDOM from 'react-dom';
//import createBrowserHistory from 'history/lib/createBrowserHistory';
import { browserHistory } from 'react-router';
import routes from './routes';

/*
Router.run(routes, Router.HistoryLocation, function(Handler) {
  React.render(<Handler />, document.getElementById('app'));
});
*/

//let history = createBrowserHistory();

ReactDOM.render(<Router history={browserHistory}>{routes}</Router>,document.getElementById('app'));

