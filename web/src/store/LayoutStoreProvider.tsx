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

import { Accessor, createContext, createSignal, Setter, useContext } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { TOOLBAR_WIDTH } from "../constants";
import { Dimensions, Vector } from "../util/geometry";
import { panic } from "../util/lang";
import { Uid } from "../util/uid";
import { Item } from "./items/base/item";


export interface ContextMenuInfo {
  posPx: Vector,
  item: Item
}

export interface LayoutStoreContextModel {
  currentPageId: Accessor<Uid | null>,
  setCurrentPageId: Setter<Uid | null>,

  desktopSizePx: Accessor<Dimensions>,
  resetDesktopSizePx: () => void,

  contextMenuInfo: Accessor<ContextMenuInfo | null>,
  setContextMenuInfo: Setter<ContextMenuInfo | null>,

  childrenLoaded: { [id: Uid]: boolean }
}

export interface LayoutStoreContextProps {
  children: JSX.Element
}

const LayoutStoreContext = createContext<LayoutStoreContextModel>();
export interface ContextMenuInfo {
  posPx: Vector,
  item: Item
}

export function LayoutStoreProvider(props: LayoutStoreContextProps) {
  function currentDesktopSize(): Dimensions {
    let rootElement = document.getElementById("root") ?? panic();
    return { w: rootElement.clientWidth - TOOLBAR_WIDTH, h: rootElement.clientHeight };
  }

  const [currentPageId, setCurrentPageId] = createSignal<Uid | null>(null);
  const [desktopSizePx, setDesktopSizePx] = createSignal<Dimensions>(currentDesktopSize());
  const [contextMenuInfo, setContextMenuInfo] = createSignal<ContextMenuInfo | null>(null);

  const resetDesktopSizePx = () => { setDesktopSizePx(currentDesktopSize()); }

  const value: LayoutStoreContextModel = {
    currentPageId, setCurrentPageId,
    desktopSizePx, resetDesktopSizePx,
    contextMenuInfo, setContextMenuInfo,
    childrenLoaded: {}
  };

  return (
    <LayoutStoreContext.Provider value={value}>
      {props.children}
    </LayoutStoreContext.Provider>
  );
}

export function useLayoutStore() : LayoutStoreContextModel {
  return useContext(LayoutStoreContext) ?? panic();
}
