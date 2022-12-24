/*
  Copyright (C) 2022 Matt Howlett
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

import { Component, onMount } from 'solid-js';
import { command } from '../command';
import { useItemStore } from '../store/ItemStoreProvider';
import { useLayoutStore } from '../store/LayoutStoreProvider';
import { fetchUser, useUserStore } from '../store/UserStoreProvider';
import { panic } from '../util/lang';
import { Desktop } from './Desktop';
import { Login } from './Login';
import { Toolbar } from './Toolbar';


const App: Component = () => {
  let userStore = useUserStore();
  let layoutStore = useLayoutStore();
  let itemStore = useItemStore();

  onMount(async () => {
    let user = await fetchUser();
    let rootId = user.rootPageId ?? panic();
    userStore.setUser(user);
    itemStore.setRoot(rootId);
    let r = await command.fetchChildItems(user, rootId);
    itemStore.setChildItems(r);
    layoutStore.setLayout({ currentPageId: rootId });
  });

  return (
    <div class="fixed top-0 left-0 right-0 bottom-0 select-none touch-none overflow-hidden">
      <Desktop />
      <Toolbar />
      <Login />
    </div>
  );
};

export default App;
