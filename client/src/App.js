import React, { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import socketIOClient from 'socket.io-client';
import GlobalContext from './contexts/GlobalContext';

import { Config, ImageViewer, NotFound } from './components';

const App = () => {
  const [socketClient, setSocketClient] = useState(null);

  useEffect(() => {
    if (!socketClient) {
      const socket = socketIOClient();

      socket.on('connect', () => {
        const { id } = socket;

        console.log(`Socket connected: ${id}`);
      });

      socket.on('disconnect', () => {
        const { id } = socket;

        console.log(`Socket disconnected: ${id}`);
      });

      setSocketClient(socket);
    }
  }, [socketClient]);

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
