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
import { NoteItem, PageItem } from "../store/items";
import { useItemStore } from "../store/ItemStoreProvider";
import { useLayoutStore } from "../store/LayoutStoreProvider";
import { cloneItem, Item, updateBounds } from "../types/items/base/item";
import { isNoteItem } from "../types/items/note-item";
import { asPageItem, isPageItem } from "../types/items/page-item";
import { panic } from "../util/lang";
import { Note } from "./items/Note";
import { Page } from "./items/Page";


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
      updateBounds(child, currentPage.computed.boundsPx ?? panic(), { w: wBl * 60.0, h: hBl * 60.0 });
      r.push(child);
    });
    return r;
  };

  return (
    <div class="fixed left-[40px] top-0 bottom-0 right-0 select-none outline-none">
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
