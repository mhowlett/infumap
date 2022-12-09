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
import { panic } from "../util/lang";
import { Layout } from "./layout";


export interface LayoutStoreContextModel {
  layout: Layout,
  setLayout: SetStoreFunction<Layout>,
}

export interface LayoutStoreContextProps {
  children: JSX.Element
}

const LayoutStoreContext = createContext<LayoutStoreContextModel>();

export function LayoutStoreProvider(props: LayoutStoreContextProps) {
  const [layout, setLayout] = createStore<Layout>({ currentPage: null });
  const value: LayoutStoreContextModel = { layout, setLayout };
  return (
    <LayoutStoreContext.Provider value={value}>
      {props.children}
    </LayoutStoreContext.Provider>
  );
}

export function useLayoutStore() : LayoutStoreContextModel {
  return useContext(LayoutStoreContext) ?? panic();
}
