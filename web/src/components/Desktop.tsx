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
import { calcGeometryOfItem } from "../store/items/base/item";
import { isNoteItem, NoteItem } from "../store/items/note-item";
import { asPageItem, calcCurrentPageItemGeometry, calcPageInnerSpatialDimensionsCo, isPageItem, PageItem } from "../store/items/page-item";
import { Note } from "./items/Note";
import { Page } from "./items/Page";
import { CHILD_ITEMS_VISIBLE_WIDTH_BL, TOOLBAR_WIDTH } from "../constants";
import { ContextMenu } from "./context/ContextMenu";
import { produce } from "solid-js/store";
import { BoundingBox, clientPxFromMouseEvent, desktopPxFromMouseEvent } from "../util/geometry";
import { useUserStore } from "../store/UserStoreProvider";
import { server } from "../server";
import { Uid } from "../util/uid";
import { ItemGeometry } from "../item-geometry";
import { mouseDownHandler, mouseMoveHandler, mouseUpHandler } from "../mouse";
import { isTableItem, TableItem } from "../store/items/table-item";
import { Table } from "./items/Table";


export const Desktop: Component = () => {
  const userStore = useUserStore();
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let lastMouseMoveEvent: MouseEvent | undefined;


  function loadPageItems(pageId: string) {
    layoutStore.setChildrenLoaded(pageId);
    server.fetchChildItems(userStore.user, pageId)
      .catch(e => {
        console.log(`Error occurred feching items for child page '${pageId}': ${e}.`);
      })
      .then(children => {
        if (children != null) {
          itemStore.setChildItems(pageId, children);
        } else {
          console.log(`No items were fetched for child page '${pageId}'.`);
        }
        // invalidate the item-geometry calc.
        itemStore.replaceWithClone(layoutStore.currentPageId()!);
      });
  }

  function calcNestedGeometry(pageId: Uid | null, pageBoundsPx: BoundingBox, level: number): Array<ItemGeometry> {
    if (pageId == null) { return []; }

    let page = asPageItem(itemStore.getItem(pageId)!);
    let pageInnerDimensionsCo = calcPageInnerSpatialDimensionsCo(page);

    let result: Array<ItemGeometry> = [];

    if (!layoutStore.childrenLoaded(page.id)) {
      loadPageItems(page.id);
      return result;
    }

    page.computed_children.map(childId => itemStore.items.fixed[childId]).forEach(childItem => {
      let itemGeometry = calcGeometryOfItem(childItem, pageBoundsPx, pageInnerDimensionsCo, level);
      result.push(itemGeometry);
      if (isPageItem(childItem)) {
        let childPage = asPageItem(childItem);
        if (childPage.spatialWidthBl >= CHILD_ITEMS_VISIBLE_WIDTH_BL) {
          if (layoutStore.childrenLoaded(childPage.id)) {
            calcNestedGeometry(childPage.id, itemGeometry.boundsPx, level+1).forEach(c => result.push(c));
          } else {
            loadPageItems(childPage.id);
          }
        }
      }
    });

    return result;
  }


  const calcFixedGeometryMemoized = createMemo((): Array<ItemGeometry> => {
    const currentPageId = layoutStore.currentPageId();
    if (currentPageId == null) { return []; }
    const currentPageBoundsPx: BoundingBox = { x: 0.0, y: 0.0, w: layoutStore.layout.desktopPx.w, h: layoutStore.layout.desktopPx.h };
    const currentPage = asPageItem(itemStore.items.fixed[currentPageId!]);
    const rootPageGeometry = calcCurrentPageItemGeometry(currentPage, currentPageBoundsPx);
    return [rootPageGeometry, ...calcNestedGeometry(currentPageId, currentPageBoundsPx, 1)];
  });


  const calcMovingGeometry = (): Array<ItemGeometry> => {
    let fixedGeometry = calcFixedGeometryMemoized();

    let result: Array<ItemGeometry> = [];
    for (let i=0; i<itemStore.items.moving.length; ++i) {
      let item = itemStore.items.moving[i];
      let parentGeometry = fixedGeometry.find(a => a.itemId == item.parentId);
      let parentPage = asPageItem(itemStore.getItem(parentGeometry!.itemId)!);
      let pageInnerDimensionsCo = calcPageInnerSpatialDimensionsCo(parentPage);
      let movingItemGeometry = calcGeometryOfItem(item, parentGeometry!.boundsPx, pageInnerDimensionsCo, 1);
      if (isPageItem(item)) {
        result = [...result, movingItemGeometry, ...calcNestedGeometry(item.id, movingItemGeometry.boundsPx, 1)];
      } else {
        result = [...result, movingItemGeometry];
      }
    }

    return result;
  }


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

  const mouseDownListener = (ev: MouseEvent) => {
    ev.preventDefault();
    mouseDownHandler(itemStore, layoutStore, calcFixedGeometryMemoized(), ev);
  }

  const mouseMoveListener = (ev: MouseEvent) => {
    ev.preventDefault();
    lastMouseMoveEvent = ev;
    mouseMoveHandler(itemStore, layoutStore, calcFixedGeometryMemoized(), ev);
  }

  const mouseUpListener = (ev: MouseEvent) => {
    ev.preventDefault();
    mouseUpHandler(userStore, itemStore, layoutStore, calcFixedGeometryMemoized(), ev);
  }

  const windowResizeListener = () => {
    layoutStore.setLayout(produce(state => state.desktopPx = currentDesktopSize()));
  }

  const contextMenuListener = (ev: Event) => {
    ev.preventDefault();
  }

  onMount(() => {
    // TODO (MEDIUM): attach to desktopDiv?. need tab index.
    document.addEventListener('mousedown', mouseDownListener);
    document.addEventListener('mousemove', mouseMoveListener);
    document.addEventListener('mouseup', mouseUpListener);
    document.addEventListener('keypress', keyListener);
    document.addEventListener('contextmenu', contextMenuListener);
    window.addEventListener('resize', windowResizeListener);
  });

  onCleanup(() => {
    document.removeEventListener('mousedown', mouseDownListener);
    document.removeEventListener('mousemove', mouseMoveListener);
    document.removeEventListener('mouseup', mouseUpListener);
    document.removeEventListener('keypress', keyListener);
    document.removeEventListener('contextmenu', contextMenuListener);
    window.removeEventListener('resize', windowResizeListener);
  });


  function drawItems(itemGeometry: Array<ItemGeometry>) {
    let toDrawItems = itemGeometry.map(geom => ({ item: itemStore.getItem(geom.itemId), boundsPx: geom.boundsPx }));
    return <For each={toDrawItems}>{toDrawItem =>
      <Switch fallback={<div>Not Found</div>}>
        <Match when={isPageItem(toDrawItem.item)}>
          <Page item={toDrawItem.item as PageItem} boundsPx={toDrawItem.boundsPx} />
        </Match>
        <Match when={isTableItem(toDrawItem.item)}>
          <Table item={toDrawItem.item as TableItem} boundsPx={toDrawItem.boundsPx} />
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
      { drawItems(calcFixedGeometryMemoized()) }
      { drawItems(calcMovingGeometry()) }
      <Show when={layoutStore.layout.contextMenuPosPx != null && layoutStore.layout.contexMenuItem != null}>
        <ContextMenu clickPosPx={layoutStore.layout.contextMenuPosPx!} contextItem={layoutStore.layout.contexMenuItem!} />
      </Show>
    </div>
  );
}
