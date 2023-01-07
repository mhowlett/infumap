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

import { Component } from "solid-js";
import { server } from "../server";
import { useItemStore } from "../store/ItemStoreProvider";
import { useLayoutStore } from "../store/LayoutStoreProvider";
import { useUserStore } from "../store/UserStoreProvider";

export const Login: Component = () => {
  let userStore = useUserStore();
  let itemStore = useItemStore();
  let layoutStore = useLayoutStore();

  const handleClick = async () => {
    let success = await userStore.login("test", "qwerty");
    if (success) {
      try {
        let user = userStore.getUser()!;
        let rootId = user.rootPageId!;
        let r = await server.fetchChildItems(user, rootId);
        itemStore.setChildItems(rootId, r);
        layoutStore.setCurrentPageId(rootId);
      } catch {
        console.log("problem loading root page, clearing session II.");
        userStore.clear();
      }
    }
  }

  return (
    <div class="border border-slate-700">
      <div>Login</div>
      <div>Username: <input type="text" /></div>
      <div>Password: <input type="password" /></div>
      <button onclick={handleClick}>login</button>
    </div>
  )
}
