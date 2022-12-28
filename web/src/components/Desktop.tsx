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
import { currentDesktopSize, useLayoutStore } from "../store/LayoutStoreProvider";
import { cloneItem, Item, updateBounds } from "../store/items/base/item";
import { isNoteItem, NoteItem } from "../store/items/note-item";
import { asPageItem, isPageItem, PageItem } from "../store/items/page-item";
import { Note } from "./items/Note";
import { Page } from "./items/Page";
import { CHILD_ITEMS_VISIBLE_WIDTH_BL, GRID_SIZE, TOOLBAR_WIDTH } from "../constants";
import { ContextMenu } from "./context/ContextMenu";
import { produce } from "solid-js/store";
import { clientPosVector, subtract } from "../util/geometry";
import { useUserStore } from "../store/UserStoreProvider";
import { server } from "../server";


export const Desktop: Component = () => {
  const userStore = useUserStore();
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let lastMouseMoveEvent: MouseEvent | undefined;

  function getFixedItems(page: PageItem | null): Array<Item> {
    if (layoutStore.layout.currentPageId == null) { return []; }

    if (page == null) {
      page = asPageItem(itemStore.items.fixed[layoutStore.layout.currentPageId]);
      itemStore.updateItem(page.id, item => {
        asPageItem(item).computed_boundsPx = { x: 0.0, y: 0.0, w: layoutStore.layout.desktopPx.w, h: layoutStore.layout.desktopPx.h };
      });
    }

    let innerDimensionsCo = {
      w: page.innerSpatialWidthBl * GRID_SIZE,
      h: Math.floor(page.innerSpatialWidthBl / page.naturalAspect) * GRID_SIZE
    };

    let result = [page.id];

    page.computed_children.map(c => itemStore.items.fixed[c]).forEach(child => {
      itemStore.updateItem(child.id, item => { updateBounds(item, page!.computed_boundsPx!, innerDimensionsCo); });
      result.push(child.id);
      if (isPageItem(child)) {
        let childPage = asPageItem(child);
        if (childPage.spatialWidthBl >= CHILD_ITEMS_VISIBLE_WIDTH_BL) {
          if (childPage.children_loaded) {
            getFixedItems(childPage).forEach(c => result.push(c.id));
          } else {
            itemStore.updateItem(childPage.id, parentItem => { (parentItem as PageItem).children_loaded = true; });
            server.fetchChildItems(userStore.user, childPage.id)
              .catch(e => {
                console.log(`Error occurred feching items for child page '${childPage.id}'.`);
              })
              .then(children => {
                if (children != null) {
                  itemStore.setChildItems(childPage.id, children);
                } else {
                  console.log(`No items were fetched for child page '${childPage.id}'.`);
                }
              });
          }
        }
      }
    });

    return result.map(a => cloneItem(itemStore.getItem(a)!));
  };

  function getMovingItems(): Array<Item> {
    if (layoutStore.layout.currentPageId == null) { return []; }
    let currentPage = asPageItem(itemStore.items.fixed[layoutStore.layout.currentPageId]);
    let innerDimensionsCo = {
      w: currentPage.innerSpatialWidthBl * GRID_SIZE,
      h: Math.floor(currentPage.innerSpatialWidthBl / currentPage.naturalAspect) * GRID_SIZE
    };
  
    let result: Array<string> = [];
    itemStore.items.moving.forEach(itm => {
      if (itm.parentId == layoutStore.layout.currentPageId) {
        itemStore.updateItem(itm.id, item => { updateBounds(item, currentPage.computed_boundsPx!, innerDimensionsCo); });
        result.push(itm.id);
      }
    });

    return result.map(a => cloneItem(itemStore.getItem(a)!));
  }

  const keyListener = (ev: KeyboardEvent) => {
    // TODO (HIGH): Something better - this doesn't allow slash in data entry in context menu.
    if (ev.code != "Slash") { return; }

    layoutStore.setLayout(produce(state => {
      let lastPos = clientPosVector(lastMouseMoveEvent!);
      state.contextMenuPosPx = subtract(lastPos, { x: TOOLBAR_WIDTH, y: 0 });
      let el = document.elementsFromPoint(lastPos.x, lastPos.y)!.find(e => e.id != null && e.id != "");
      if (el == null) { return; }
      let item = itemStore.items.fixed[el.id];
      state.contexMenuItem = item;
    }));
  };

  const mouseDownHandler = (_ev: MouseEvent) => { layoutStore.hideContextMenu(); }

  const mouseMoveListener = (ev: MouseEvent) => {
    let currentPage = itemStore.items.fixed[layoutStore.layout.currentPageId!];

    lastMouseMoveEvent = ev;
  }

  const windowResizeListener = () => { layoutStore.setLayout(produce(state => state.desktopPx = currentDesktopSize())); }

  onMount(() => {
    // TODO (MEDIUM): attach to desktopDiv?. need tab index.
    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mousedown', mouseDownHandler);
    document.addEventListener('keypress', keyListener);
    window.addEventListener('resize', windowResizeListener);
  });

  onCleanup(() => {
    document.removeEventListener('mousemove', mouseMoveListener);
    document.removeEventListener('mousedown', mouseDownHandler);
    document.removeEventListener('keypress', keyListener);
    window.removeEventListener('resize', windowResizeListener);
  });

  function drawItems(items: Array<Item>) {
    return <For each={items}>{item =>
      <Switch fallback={<div>Not Found</div>}>
        <Match when={isPageItem(item)}>
          <Page item={item as PageItem} />
        </Match>
        <Match when={isNoteItem(item)}>
          <Note item={item as NoteItem} />
        </Match>
      </Switch>
    }</For>
  }

  return (
    <div class="fixed top-0 bottom-0 right-0 select-none outline-none"
         style={`left: ${TOOLBAR_WIDTH}px`}>
      {drawItems(getFixedItems(null))}
      {drawItems(getMovingItems())}
      <Show when={layoutStore.layout.contextMenuPosPx != null && layoutStore.layout.contexMenuItem != null}>
        <ContextMenu clickPosPx={layoutStore.layout.contextMenuPosPx!} contextItem={layoutStore.layout.contexMenuItem!} />
      </Show>
    </div>
  );
}
