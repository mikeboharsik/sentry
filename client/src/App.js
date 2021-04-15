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
        console.log(socket.id, 'whoa');
      });

      socket.on('disconnect', () => {
        console.log(socket.id);
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
