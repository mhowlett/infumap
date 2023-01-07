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

import { Component, onMount } from 'solid-js';
import { server } from '../server';
import { useItemStore } from '../store/ItemStoreProvider';
import { useLayoutStore } from '../store/LayoutStoreProvider';
import { useUserStore } from '../store/UserStoreProvider';
import { Desktop } from './Desktop';
import { Toolbar } from './Toolbar';


const App: Component = () => {
  let userStore = useUserStore();
  let layoutStore = useLayoutStore();
  let itemStore = useItemStore();

  const init = async () => {
    if (userStore.getUser() == null) {
      console.log("logging in");
      await userStore.login("test", "qwerty");
    } else {
      console.log("using previous session");
    }
    let user = userStore.getUser()!;
    let rootId = user.rootPageId!;
    itemStore.setRoot(rootId);
    let r = await server.fetchChildItems(user, rootId);
    itemStore.setChildItems(rootId, r);
    layoutStore.setCurrentPageId(rootId);
  }

  onMount(async () => {
    try {
      await init();
    } catch {
      console.log("clearing session and retrying. session probably gone from server.");
      userStore.clear();
      await init();
    }
  });

  return (
    <div class="fixed top-0 left-0 right-0 bottom-0 select-none touch-none overflow-hidden">
      <Desktop />
      <Toolbar />
    </div>
  );
};

export default App;
