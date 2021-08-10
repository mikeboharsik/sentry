import React from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import GlobalContext from './contexts/GlobalContext';
import { Config, ImageViewer, NotFound } from './components';
import getSocketClient from './util/getSocketClient';

const socketClient = getSocketClient();

const App = () => {
	return (
		<GlobalContext.Provider value={{ socketClient }}>
			<Router>
				<Switch>
					<Route exact path="/config">
						<Config />
					</Route>
					<Route exact path="/">
						<ImageViewer />
					</Route>
					<Route>
						<NotFound />
					</Route>
				</Switch>
			</Router>
		</GlobalContext.Provider>
	);
};

export default App;
