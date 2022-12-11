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

import { Component, For, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { useItemStore } from "../store/ItemStoreProvider";
import { useLayoutStore } from "../store/LayoutStoreProvider";
import { cloneItem, Item, updateBounds } from "../store/items/base/item";
import { isNoteItem, NoteItem } from "../store/items/note-item";
import { asPageItem, isPageItem, PageItem } from "../store/items/page-item";
import { panic } from "../util/lang";
import { Note } from "./items/Note";
import { Page } from "./items/Page";
import { GRID_SIZE, TOOLBAR_WIDTH } from "../constants";
import { ContextMenu } from "./ContextMenu";
import { produce } from "solid-js/store";
import { add, clientPosVector, subtract } from "../util/geometry";


export const Desktop: Component = () => {
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let desktopDiv: HTMLDivElement | undefined;
  let lastMouseMoveEvent: MouseEvent | undefined;

  let getCurrentPageItems = () => {
    if (layoutStore.layout.currentPage == null) { return []; }

    let ds = layoutStore.layout.desktopPx;
    let currentPage = asPageItem(cloneItem(itemStore.items.fixed[layoutStore.layout.currentPage]));
    currentPage.computed_boundsPx = { x: 0.0, y: 0.0, w: ds.w, h: ds.h };
    let wBl = currentPage.innerSpatialWidthBl;
    let hBl = Math.floor(wBl / currentPage.naturalAspect);

    let r = [currentPage as Item];

    currentPage.computed_children.map(c => cloneItem(itemStore.items.fixed[c])).forEach(child => {
      updateBounds(child, currentPage.computed_boundsPx ?? panic(), { w: wBl * GRID_SIZE, h: hBl * GRID_SIZE });
      r.push(child);
    });

    itemStore.items.moving.forEach(itm => {
      if (itm.parentId == currentPage.id) {
        let cloned = cloneItem(itm);
        updateBounds(cloned, currentPage.computed_boundsPx ?? panic(), { w: wBl * GRID_SIZE, h: hBl * GRID_SIZE });
        r.push(cloned);
      }
    })

    return r;
  };

  const keyListener = (ev: KeyboardEvent) => {
    layoutStore.setLayout(produce(state => {
      let lastPos = clientPosVector(lastMouseMoveEvent!);
      state.contextMenuPosPx = subtract(lastPos, { x: TOOLBAR_WIDTH, y: 0 });
      let el = document.elementFromPoint(lastPos.x, lastPos.y)!;
      let item = itemStore.items.fixed[el.id];
      state.contexMenuItem = item;
    }));
  };

  const mouseDownHandler = (_ev: MouseEvent) => { layoutStore.hideContextMenu(); }

  const mouseMoveListener = (ev: MouseEvent) => { lastMouseMoveEvent = ev; }

  onMount(() => {
    // TODO (MEDIUM): attach to desktopDiv?. need tab index.
    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('keypress', keyListener);
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', mouseMoveListener);
    document.removeEventListener('mousedown', mouseDownHandler);
    document.removeEventListener('keypress', keyListener);
  });

  return (
    <div ref={desktopDiv}
         class="fixed top-0 bottom-0 right-0 select-none outline-none"
         style={`left: ${TOOLBAR_WIDTH}px`}>
      <For each={getCurrentPageItems()}>{item =>
        <Switch fallback={<div>Not Found</div>}>
          <Match when={isPageItem(item)}>
            <Page item={item as PageItem} />
          </Match>
          <Match when={isNoteItem(item)}>
            <Note item={item as NoteItem} />
          </Match>
        </Switch>
      }</For>
      <Show when={layoutStore.layout.contextMenuPosPx != null}>
        <ContextMenu clickPosPx={layoutStore.layout.contextMenuPosPx!} contextItem={layoutStore.layout.contexMenuItem} />
      </Show>
    </div>
  );
}
