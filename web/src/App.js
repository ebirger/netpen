import React from 'react'
import { useMediaQuery } from 'react-responsive';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { ExamplesPenLoader } from './components/Examples.js';
import { PersonalPenLoader } from './components/PersonalPens.js';
import { SharedPenLoader } from './components/Share.js';
import PenEditor from './components/PenEditor.js';
import MainPage from './components/MainPage.js';
import 'antd/dist/antd.less';
import './App.css';

function App() {
  if (!useMediaQuery({query: '(min-width: 1224px)'})) {
    return (
      <div className="App">
        <h1>{"Sorry. Netpen doesn't support small screens"}</h1>
        <p>Please use a wider screen or expand the window</p>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/main" />} />
          <Route exact path="/pen">
            <PenEditor />
          </Route>
          <Route exact path="/main">
            <MainPage />
          </Route>
          <Route path="/shared/:id">
            <SharedPenLoader />
          </Route>
          <Route path="/personal/:id">
            <PersonalPenLoader />
          </Route>
          <Route path="/examples/:id">
            <ExamplesPenLoader />
          </Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
