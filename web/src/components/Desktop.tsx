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

import { Component, createMemo, For, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { useItemStore } from "../store/ItemStoreProvider";
import { currentDesktopSize, useLayoutStore } from "../store/LayoutStoreProvider";
import { calcGeometryOfItemInPage, calcGeometryOfItemInTable, Item } from "../store/items/base/item";
import { isNoteItem, NoteItem } from "../store/items/note-item";
import { asPageItem, calcCurrentPageItemGeometry, calcPageInnerSpatialDimensionsBl, isPageItem, PageItem } from "../store/items/page-item";
import { Note, NoteInTable } from "./items/Note";
import { Page, PageInTable } from "./items/Page";
import { CHILD_ITEMS_VISIBLE_WIDTH_BL, GRID_SIZE, TOOLBAR_WIDTH } from "../constants";
import { ContextMenu } from "./context/ContextMenu";
import { produce } from "solid-js/store";
import { BoundingBox, clientPxFromMouseEvent, desktopPxFromMouseEvent } from "../util/geometry";
import { useUserStore } from "../store/UserStoreProvider";
import { server } from "../server";
import { Uid } from "../util/uid";
import { ItemGeometry } from "../item-geometry";
import { mouseDownHandler, mouseMoveHandler, mouseUpHandler } from "../mouse";
import { asTableItem, isTableItem, TableItem } from "../store/items/table-item";
import { Table, TableInTable } from "./items/Table";
import { RenderArea } from "../render-area";


export const Desktop: Component = () => {
  const userStore = useUserStore();
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let lastMouseMoveEvent: MouseEvent | undefined;


  function loadChildItems(containerId: string) {
    layoutStore.setChildrenLoaded(containerId);
    server.fetchChildItems(userStore.user, containerId)
      .catch(e => {
        console.log(`Error occurred feching items for '${containerId}': ${e}.`);
      })
      .then(children => {
        if (children != null) {
          itemStore.setChildItems(containerId, children);
        } else {
          console.log(`No items were fetched for '${containerId}'.`);
        }
        // Invalidate the item-geometry calc.
        // Without this, the list elements don't show automatically.
        // TODO (HIGH): figure out why...
        itemStore.replaceWithClone(layoutStore.currentPageId()!);
      });
  }


  function calcPageNestedGeometry(pageId: Uid, pageBoundsPx: BoundingBox, level: number, renderArea: RenderArea) {
    if (pageId == null) { return; }

    let page = asPageItem(itemStore.getItem(pageId)!);
    let pageInnerDimensionsBl = calcPageInnerSpatialDimensionsBl(page);

    if (!layoutStore.childrenLoaded(page.id)) {
      loadChildItems(page.id);
      return;
    }

    page.computed_children.map(childId => itemStore.items.fixed[childId]).forEach(childItem => {
      let itemGeometry = calcGeometryOfItemInPage(childItem, pageBoundsPx, pageInnerDimensionsBl, level);
      renderArea.itemGeometry.push(itemGeometry);
      if (isPageItem(childItem)) {
        let childPage = asPageItem(childItem);
        if (childPage.spatialWidthGr / GRID_SIZE >= CHILD_ITEMS_VISIBLE_WIDTH_BL) {
          if (level < 2) {
            if (layoutStore.childrenLoaded(childPage.id)) {
              calcPageNestedGeometry(childPage.id, itemGeometry.boundsPx, level+1, renderArea);
            } else {
              loadChildItems(childPage.id);
            }
          }
        }
      }
      else if (isTableItem(childItem)) {
        let childTable = asTableItem(childItem);
        if (level < 2) {
          if (layoutStore.childrenLoaded(childTable.id)) {
            calcTableNestedGeometry(childTable.id, itemGeometry.boundsPx, level+1, renderArea);
          } else {
            loadChildItems(childTable.id);
          }
        }
      }
    });
  }


  function calcTableNestedGeometry(tableId: Uid, tableBoundsPx: BoundingBox, level: number, renderArea: RenderArea) {
    let table = asTableItem(itemStore.getItem(tableId)!);

    if (!layoutStore.childrenLoaded(table.id)) {
      console.log("DEBUG: should never get here, because table child items should always be loaded on parent page load.");
      loadChildItems(table.id);
      return null;
    }

    let result: Array<ItemGeometry> = [];

    for (let idx=0; idx<table.computed_children.length; ++idx) {
      let childId = table.computed_children[idx];
      let childItem = itemStore.items.fixed[childId];
      let rowWidthBl = table.spatialWidthGr / GRID_SIZE;
      let blockSizePx = {
        w: tableBoundsPx.w / rowWidthBl,
        h: tableBoundsPx.h / (table.spatialHeightGr / GRID_SIZE),
      };
      let itemGeometry = calcGeometryOfItemInTable(childItem, blockSizePx, rowWidthBl, idx, level);
      result.push(itemGeometry);
    }

    renderArea.children.push({
      itemId: tableId,
      boundsPx: tableBoundsPx,
      itemGeometry: result,
      children: []
    });
  }


  const calcFixedGeometryMemoized = createMemo((): RenderArea => {
    const currentPageId = layoutStore.currentPageId();
    if (currentPageId == null) {
      return {
        itemId: "",
        boundsPx: { x: 0, y: 0, w: 0, h: 0 },
        itemGeometry: [],
        children: []
      };
    }
    const currentPageBoundsPx: BoundingBox = { x: 0.0, y: 0.0, w: layoutStore.layout.desktopPx.w, h: layoutStore.layout.desktopPx.h };
    const currentPage = asPageItem(itemStore.items.fixed[currentPageId!]);
    let ra: RenderArea = {
      itemId: currentPageId,
      boundsPx: currentPageBoundsPx,
      itemGeometry: [calcCurrentPageItemGeometry(currentPage, currentPageBoundsPx)],
      children: []
    }
    calcPageNestedGeometry(currentPageId, currentPageBoundsPx, 1, ra);
    return ra;
  });


  const calcMovingGeometry = (): Array<ItemGeometry> => {
    let renderArea = calcFixedGeometryMemoized();

    let result: Array<ItemGeometry> = [];
    for (let i=0; i<itemStore.items.moving.length; ++i) {
      let item = itemStore.items.moving[i];
      let parentGeometry = renderArea?.itemGeometry.find(a => a.itemId == item.parentId);
      let parentPage = asPageItem(itemStore.getItem(parentGeometry!.itemId)!);
      let pageInnerDimensionsBl = calcPageInnerSpatialDimensionsBl(parentPage);
      let movingItemGeometry = calcGeometryOfItemInPage(item, parentGeometry!.boundsPx, pageInnerDimensionsBl, 1);
      if (isPageItem(item)) {
        let ra: RenderArea = {
          itemId: item.id,
          boundsPx: movingItemGeometry.boundsPx,
          itemGeometry: [movingItemGeometry],
          children: []
        }
        calcPageNestedGeometry(item.id, movingItemGeometry.boundsPx, 1, ra);
        result = ra.itemGeometry;
      } else {
        result = [movingItemGeometry];
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
    let renderArea = calcFixedGeometryMemoized();
    if (renderArea != null) {
      mouseDownHandler(itemStore, layoutStore, renderArea, ev);
    }
  }

  const mouseMoveListener = (ev: MouseEvent) => {
    ev.preventDefault();
    lastMouseMoveEvent = ev;
    let renderArea = calcFixedGeometryMemoized();
    if (renderArea != null) {
      mouseMoveHandler(itemStore, layoutStore, renderArea, ev);
    }
  }

  const mouseUpListener = (ev: MouseEvent) => {
    ev.preventDefault();
    let renderArea = calcFixedGeometryMemoized();
    if (renderArea != null) {
      mouseUpHandler(userStore, itemStore, layoutStore, renderArea, ev);
    }
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

  function drawTableItems(itemGeometry: Array<ItemGeometry>, parentTable: TableItem) {
    let toDrawItems = itemGeometry.map(geom => ({ item: itemStore.getItem(geom.itemId), boundsPx: geom.boundsPx }));
    if (toDrawItems.length > 0) {
      return <For each={toDrawItems}>{toDrawItem =>
        <Switch fallback={<div>Not Found</div>}>
          <Match when={isPageItem(toDrawItem.item)}>
            <PageInTable item={toDrawItem.item as PageItem} parentTable={parentTable} boundsPx={toDrawItem.boundsPx} />
          </Match>
          <Match when={isTableItem(toDrawItem.item)}>
            <TableInTable item={toDrawItem.item as TableItem} parentTable={parentTable} boundsPx={toDrawItem.boundsPx} />
          </Match>
          <Match when={isNoteItem(toDrawItem.item)}>
            <NoteInTable item={toDrawItem.item as NoteItem} parentTable={parentTable} boundsPx={toDrawItem.boundsPx} />
          </Match>
        </Switch>
      }</For>
    }
  }


  function draw() {
    let geom = calcFixedGeometryMemoized();

    return (
    <>
    { drawItems(geom.itemGeometry) }

    <For each={geom.children}>{ra => (() => {
      let tableItem = asTableItem(itemStore.getItem(ra.itemId)!);
      let heightBr = tableItem.spatialHeightGr / GRID_SIZE;
      let heightPx = ra.boundsPx.h;
      let blockHeightPx = heightPx / heightBr;
      let headerHeightPx = 1.5 * blockHeightPx;
      let totalItemHeightPx = tableItem.computed_children.length * blockHeightPx;
      return (
        <div class="absolute" style={`left: ${ra.boundsPx.x}px; top: ${ra.boundsPx.y + headerHeightPx}px; width: ${ra.boundsPx.w}px; height: ${ra.boundsPx.h - headerHeightPx}px; overflow-y: auto;`}>
          <div class="absolute" style={`width: ${ra.boundsPx.w}px; height: ${totalItemHeightPx}px;`}>
            { drawTableItems(ra.itemGeometry, tableItem) }
          </div>
        </div>)
      })()
    }</For>

    { drawItems(calcMovingGeometry()) }
    </>);
  }

  return (
    <div class="fixed top-0 bottom-0 right-0 select-none outline-none"
         style={`left: ${TOOLBAR_WIDTH}px`}>
      { draw() }
      <Show when={layoutStore.layout.contextMenuPosPx != null && layoutStore.layout.contexMenuItem != null}>
        <ContextMenu clickPosPx={layoutStore.layout.contextMenuPosPx!} contextItem={layoutStore.layout.contexMenuItem!} />
      </Show>
    </div>
  );
}
