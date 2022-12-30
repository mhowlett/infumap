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

import { Accessor, createContext, createSignal, Setter, useContext } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { createStore, produce, SetStoreFunction } from "solid-js/store";
import { TOOLBAR_WIDTH } from "../constants";
import { BoundingBox, Dimensions, Vector } from "../util/geometry";
import { panic } from "../util/lang";
import { Uid } from "../util/uid";
import { Item } from "./items/base/item";

export type Layout = {
  desktopPx: Dimensions,
  contextMenuPosPx: Vector | null,
  contexMenuItem: Item | null,
  childrenLoaded: { [id: Uid]: boolean }
  visibleItemBoundsPx: { [id: Uid]: BoundingBox },
}

export function currentDesktopSize(): Dimensions {
  let rootElement = document.getElementById("root") ?? panic();
  return { w: rootElement.clientWidth - TOOLBAR_WIDTH, h: rootElement.clientHeight };
}

export interface LayoutStoreContextModel {
  currentPageId: Accessor<Uid | null>,
  setCurrentPageId: Setter<Uid | null>,

  layout: Layout,
  setLayout: SetStoreFunction<Layout>,

  hideContextMenu: () => void,
  childrenLoaded: (id: Uid) => boolean,
  setChildrenLoaded: (id: Uid) => void
}

export interface LayoutStoreContextProps {
  children: JSX.Element
}

const LayoutStoreContext = createContext<LayoutStoreContextModel>();

export function LayoutStoreProvider(props: LayoutStoreContextProps) {
  const [currentPageId, setCurrentPageId] = createSignal<Uid | null>(null);

  const [layout, setLayout] = createStore<Layout>({
    desktopPx: currentDesktopSize(),
    contextMenuPosPx: null,
    contexMenuItem: null,
    childrenLoaded: {},
    visibleItemBoundsPx: {}
  });

  const hideContextMenu = () => {
    setLayout(produce(state => { state.contexMenuItem = null; state.contextMenuPosPx = null; }));
  };

  const childrenLoaded = (id: Uid) => {
    return layout.childrenLoaded.hasOwnProperty(id);
  }

  const setChildrenLoaded = (id: Uid) => {
    setLayout(produce(state => { state.childrenLoaded[id] = true; }));
  }

  const value: LayoutStoreContextModel = { currentPageId, setCurrentPageId, layout, setLayout, hideContextMenu, childrenLoaded, setChildrenLoaded };

  return (
    <LayoutStoreContext.Provider value={value}>
      {props.children}
    </LayoutStoreContext.Provider>
  );
}

export function useLayoutStore() : LayoutStoreContextModel {
  return useContext(LayoutStoreContext) ?? panic();
}
