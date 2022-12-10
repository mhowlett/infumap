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

import { Component, For, Match, Switch } from "solid-js";
import { useItemStore } from "../store/ItemStoreProvider";
import { useLayoutStore } from "../store/LayoutStoreProvider";
import { cloneItem, Item, updateBounds } from "../store/items/base/item";
import { isNoteItem, NoteItem } from "../store/items/note-item";
import { asPageItem, isPageItem, PageItem } from "../store/items/page-item";
import { panic } from "../util/lang";
import { Note } from "./items/Note";
import { Page } from "./items/Page";
import { GRID_SIZE, TOOLBAR_WIDTH } from "../constants";


export const Desktop: Component = () => {
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let getCurrentPageItems = () => {
    if (layoutStore.layout.currentPage == null) { return []; }
    let ds = layoutStore.layout.desktopPx;
    let currentPage = asPageItem(cloneItem(itemStore.items.fixed[layoutStore.layout.currentPage]));
    currentPage.computed.boundsPx = { x: 0.0, y: 0.0, w: ds.w, h: ds.h };
    let wBl = currentPage.innerSpatialWidthBl;
    let hBl = Math.floor(wBl / currentPage.naturalAspect);
    let r = [currentPage as Item];
    currentPage.computed.children.map(c => cloneItem(itemStore.items.fixed[c])).forEach(child => {
      updateBounds(child, currentPage.computed.boundsPx ?? panic(), { w: wBl * GRID_SIZE, h: hBl * GRID_SIZE });
      r.push(child);
    });
    itemStore.items.moving.forEach(itm => {
      if (itm.parentId == currentPage.id) {
        let cloned = cloneItem(itm);
        updateBounds(cloned, currentPage.computed.boundsPx ?? panic(), { w: wBl * GRID_SIZE, h: hBl * GRID_SIZE });
        r.push(cloned);
      }
    })
    return r;
  };

  return (
    <div class="fixed top-0 bottom-0 right-0 select-none outline-none"
         style={`left: ${TOOLBAR_WIDTH}px`}>
      <For each={getCurrentPageItems()}>
        { item => {
          return (
            <Switch fallback={<div>Not Found</div>}>
              <Match when={isPageItem(item)}>
                <Page item={item as PageItem} />
              </Match>
              <Match when={isNoteItem(item)}>
                <Note item={item as NoteItem} />
              </Match>
            </Switch>
          )}
        }
      </For>
    </div>
  );
}
