/*
  Copyright (C) 2022-2023 Matt Howlett
  This file is part of Infumap.

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as
  published by the Free Software Foundation, either version 3 of the
  License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, Match, onMount, Switch } from 'solid-js';
import { server } from '../server';
import { useItemStore } from '../store/ItemStoreProvider';
import { useLayoutStore } from '../store/LayoutStoreProvider';
import { useUserStore } from '../store/UserStoreProvider';
import { Desktop } from './Desktop';
import { Login } from './Login';
import { Toolbar } from './Toolbar';


const App: Component = () => {
  let userStore = useUserStore();
  let layoutStore = useLayoutStore();
  let itemStore = useItemStore();

  onMount(async () => {
    let user = userStore.getUser()!;
    if (user != null) {
      try {
        let rootId = user.rootPageId!;
        let r = await server.fetchChildItems(user, rootId);
        itemStore.setChildItems(rootId, r);
        layoutStore.setCurrentPageId(rootId);
      } catch {
        console.log("problem loading root page, clearing session.");
        userStore.clear();
      }
    }
  });

  return (
    <div class="fixed top-0 left-0 right-0 bottom-0 select-none touch-none overflow-hidden">
      <Switch>
        <Match when={userStore.getUser() != null}>
          <Desktop />
          <Toolbar />
        </Match>
        <Match when={userStore.getUser() == null}>
          <Login />
        </Match>
      </Switch>
    </div>
  );
};

export default App;
