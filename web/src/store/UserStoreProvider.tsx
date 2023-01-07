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

import { createContext, createSignal, useContext } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { eraseCookie, getCookie, setCookie } from "../util/cookies";
import { panic, throwExpression } from "../util/lang";
import { Uid } from "../util/uid";


const SESSION_NAME = "infusession";
const EXPIRE_DAYS = 30;

export type User = {
  username: string,
  userId: Uid,
  sessionId: Uid,
  rootPageId: Uid
}

export interface UserStoreContextModel {
  login: (username: string, password: string) => Promise<boolean>,
  logout: () => Promise<void>,
  getUser: () => User | null,
  clear: () => void,
}

export interface UserStoreContextProps {
  children: JSX.Element
}

const UserStoreContext = createContext<UserStoreContextModel>();

export function UserStoreProvider(props: UserStoreContextProps) {
  const [sessionDataString, setSessionDataString] = createSignal<string | null>(getCookie(SESSION_NAME));

  const value: UserStoreContextModel = {
    login: async (username: string, password: string): Promise<boolean> => {
      let fetchResult = await fetch('/account/login', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "username": username, "password": password })
      });
      let r = await fetchResult.json();
      if (!r.success) {
        eraseCookie(SESSION_NAME);
        setSessionDataString(null);
        return false;
      }
      const cookiePayload = JSON.stringify({ username, userId: r.userId, sessionId: r.sessionId, rootPageId: r.rootPageId });
      setCookie(SESSION_NAME, cookiePayload, EXPIRE_DAYS);
      setSessionDataString(cookiePayload);
      return true;
    },

    logout: async (): Promise<void> => {
      const data = sessionDataString();
      if (data == null) {
        console.log("not logged in.");
        return;
      };
      const user: User = JSON.parse(data);

      let fetchResult = await fetch('/account/logout', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "userId": user.userId, "sessionId": user.sessionId })
      });

      let r = await fetchResult.json();
      eraseCookie(SESSION_NAME);
      setSessionDataString(null);

      if (!r.success) {
        throwExpression("logout failed!");
      }
    },

    getUser: (): (User | null) => {
      const data = sessionDataString();
      if (data == null) { return null };
      if (getCookie(SESSION_NAME) == null) {
        // Session cookie has expired. Update SolidJS state to reflect this.
        console.log("Session cookie has expired.");
        setSessionDataString(null);
        return null;
      }
      return JSON.parse(data!);
    },

    clear: (): void => {
      eraseCookie(SESSION_NAME);
      setSessionDataString(null);
    }
  };

  return (
    <UserStoreContext.Provider value={value}>
      {props.children}
    </UserStoreContext.Provider>
  );
}

export function useUserStore() : UserStoreContextModel {
  return useContext(UserStoreContext) ?? panic();
}
