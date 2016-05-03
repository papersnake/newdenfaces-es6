import React from 'react';
import {Route} from 'react-router';
import App from './components/App';
import Home from './components/Home';
import AddCharacter from './components/AddCharacter';
import Character from './components/Character';
import CharacterList from './components/CharacterList';

export default (
  <Route handler={App}>
    <Route path='/' handler={Home} />
    <Route path='/add' handler={AddCharacter} />
    <Route path='/character/:id' handler={Character} />
    <Route path=':category' handler={CharacterList}>
    	<Route path=':race' handler={CharacterList}>
    		<Route path=':bloodline' handler={CharacterList} />
    	</Route>
    </Route>
  </Route>
);