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

import { createContext, useContext } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { createStore, SetStoreFunction } from "solid-js/store";
import { panic, throwExpression } from "../util/lang";
import { Uid } from "../util/uid";

export const fetchUser: (() => Promise<User>) = async () => {
  let username = "test";
  let password = "qwerty";
  let fetchResult = await fetch('/account/login', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "username": username, "password": password })
  });
  let r = await fetchResult.json();
  if (!r.success) { throwExpression("login failed!"); }
  return { username, password, userId: r.userId, sessionId: r.sessionId, rootPageId: r.rootPageId };
}

export type User = {
  username: string | null,
  password: string | null,
  userId: Uid | null,
  sessionId: Uid | null,
  rootPageId: Uid | null
}

export interface UserStoreContextModel {
  user: User,
  setUser: SetStoreFunction<User>,
}

export interface UserStoreContextProps {
  children: JSX.Element
}

const UserStoreContext = createContext<UserStoreContextModel>();

export function UserStoreProvider(props: UserStoreContextProps) {
  const [user, setUser] = createStore<User>({ username: null, password: null, userId: null, sessionId: null, rootPageId: null });
  const value: UserStoreContextModel = { user, setUser };
  return (
    <UserStoreContext.Provider value={value}>
      {props.children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore() : UserStoreContextModel {
  return useContext(UserStoreContext) ?? panic();
}
