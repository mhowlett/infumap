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

import { Component, createMemo, For, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { useItemStore } from "../store/ItemStoreProvider";
import { currentDesktopSize, useLayoutStore } from "../store/LayoutStoreProvider";
import { calcItemGeometry } from "../store/items/base/item";
import { isNoteItem, NoteItem } from "../store/items/note-item";
import { asPageItem, calcRootPageItemGeometry, isPageItem, PageItem } from "../store/items/page-item";
import { Note } from "./items/Note";
import { Page } from "./items/Page";
import { CHILD_ITEMS_VISIBLE_WIDTH_BL, GRID_SIZE, TOOLBAR_WIDTH } from "../constants";
import { ContextMenu } from "./context/ContextMenu";
import { produce } from "solid-js/store";
import { BoundingBox, clientPxFromMouseEvent, desktopPxFromMouseEvent } from "../util/geometry";
import { useUserStore } from "../store/UserStoreProvider";
import { server } from "../server";
import { Uid } from "../util/uid";
import { ItemGeometry } from "../item-geometry";
import { mouseDownHandler, mouseMoveHandler, mouseUpHandler } from "../mouse";


export const Desktop: Component = () => {
  const userStore = useUserStore();
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let lastMouseMoveEvent: MouseEvent | undefined;

  function calculateItemGeometry(pageId: Uid | null, boundsPx: BoundingBox, level: number): Array<ItemGeometry> {
    if (pageId == null) { return []; }

    let page = asPageItem(itemStore.items.fixed[pageId]);

    let innerDimensionsCo = {
      w: page.innerSpatialWidthBl * GRID_SIZE,
      h: Math.floor(page.innerSpatialWidthBl / page.naturalAspect) * GRID_SIZE
    };

    let result: Array<ItemGeometry> = [];

    page.computed_children.map(childId => itemStore.items.fixed[childId]).forEach(child => {
      let itemGeometry = calcItemGeometry(child, boundsPx, innerDimensionsCo, level);
      result.push(itemGeometry);
      if (isPageItem(child)) {
        let childPage = asPageItem(child);
        if (childPage.spatialWidthBl >= CHILD_ITEMS_VISIBLE_WIDTH_BL) {
          if (layoutStore.childrenLoaded(childPage.id)) {
            calculateItemGeometry(childPage.id, itemGeometry.boundsPx, level+1).forEach(c => result.push(c));
          } else {
            layoutStore.setChildrenLoaded(childPage.id);
            server.fetchChildItems(userStore.user, childPage.id)
              .catch(e => {
                console.log(`Error occurred feching items for child page '${childPage.id}': ${e}.`);
              })
              .then(children => {
                if (children != null) {
                  itemStore.setChildItems(childPage.id, children);
                } else {
                  console.log(`No items were fetched for child page '${childPage.id}'.`);
                }
                // invalidate the item-geometry calc.
                itemStore.replaceWithClone(layoutStore.currentPageId()!);
              });
          }
        }
      }
    });

    return result;
  }

  const getItemGeometryMemo = createMemo(() => {
    const boundsPx: BoundingBox = { x: 0.0, y: 0.0, w: layoutStore.layout.desktopPx.w, h: layoutStore.layout.desktopPx.h };
    const currentPageId = layoutStore.currentPageId();
    if (currentPageId == null) { return []; }
    const rootPageGeometry = calcRootPageItemGeometry(asPageItem(itemStore.items.fixed[currentPageId!]), boundsPx);
    return [rootPageGeometry, ...calculateItemGeometry(currentPageId, boundsPx, 1)];
  });

  const keyListener = (ev: KeyboardEvent) => {
    // TODO (HIGH): Something better - this doesn't allow slash in data entry in context menu.
    if (ev.code != "Slash") { return; }

    layoutStore.setLayout(produce(state => {
      state.contextMenuPosPx = desktopPxFromMouseEvent(lastMouseMoveEvent!);
      let lastClientPx = clientPxFromMouseEvent(lastMouseMoveEvent!);
      let el = document.elementsFromPoint(lastClientPx.x, lastClientPx.y)!.find(e => e.id != null && e.id != "");
      if (el == null) { return; }
      let item = itemStore.items.fixed[el.id];
      state.contexMenuItem = item;
    }));
  };

  const mouseDownListener = (ev: MouseEvent) => { mouseDownHandler(itemStore, layoutStore, getItemGeometryMemo(), ev); }
  const mouseMoveListener = (ev: MouseEvent) => {
    lastMouseMoveEvent = ev;
    mouseMoveHandler(itemStore, layoutStore, getItemGeometryMemo(), ev);
  }
  const mouseUpListener = (ev: MouseEvent) => { mouseUpHandler(userStore, itemStore, layoutStore, getItemGeometryMemo(), ev); }

  const windowResizeListener = () => { layoutStore.setLayout(produce(state => state.desktopPx = currentDesktopSize())); }

  onMount(() => {
    // TODO (MEDIUM): attach to desktopDiv?. need tab index.
    document.addEventListener('mousedown', mouseDownListener);
    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mouseup', mouseUpListener);
    document.addEventListener('keypress', keyListener);
    window.addEventListener('resize', windowResizeListener);
  });

  onCleanup(() => {
    document.removeEventListener('mousedown', mouseDownListener);
    document.removeEventListener('mousemove', mouseMoveListener);
    document.removeEventListener('mouseup', mouseUpListener);
    document.removeEventListener('keypress', keyListener);
    window.removeEventListener('resize', windowResizeListener);
  });

  function drawItems(hitboxes: Array<ItemGeometry>) {
    let toDrawItems = hitboxes.map(hitbox => ({ item: itemStore.items.fixed[hitbox.itemId], boundsPx: hitbox.boundsPx }));
    return <For each={toDrawItems}>{toDrawItem =>
      <Switch fallback={<div>Not Found</div>}>
        <Match when={isPageItem(toDrawItem.item)}>
          <Page item={toDrawItem.item as PageItem} boundsPx={toDrawItem.boundsPx} />
        </Match>
        <Match when={isNoteItem(toDrawItem.item)}>
          <Note item={toDrawItem.item as NoteItem} boundsPx={toDrawItem.boundsPx} />
        </Match>
      </Switch>
    }</For>
  }

  return (
    <div class="fixed top-0 bottom-0 right-0 select-none outline-none"
         style={`left: ${TOOLBAR_WIDTH}px`}>
      { drawItems(getItemGeometryMemo()) }
      <Show when={layoutStore.layout.contextMenuPosPx != null && layoutStore.layout.contexMenuItem != null}>
        <ContextMenu clickPosPx={layoutStore.layout.contextMenuPosPx!} contextItem={layoutStore.layout.contexMenuItem!} />
      </Show>
    </div>
  );
}
