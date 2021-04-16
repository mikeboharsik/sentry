import React, { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';
import socketIOClient from 'socket.io-client';

import Config from './containers/Config';
import ImageViewer from './containers/ImageViewer';
import NotFound from './containers/NotFound';

const App = props => {
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
    <Router>
      <Switch>
        <Route exact path="/config">
          <Config socketClient={socketClient} />
        </Route>
        <Route exact path="/">
          <ImageViewer socketClient={socketClient} />
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
