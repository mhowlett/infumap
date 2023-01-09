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

import { Component, createMemo, For, onCleanup, onMount } from "solid-js";
import { useItemStore } from "../store/ItemStoreProvider";
import { useLayoutStore } from "../store/LayoutStoreProvider";
import { calcGeometryOfItemInPage, calcGeometryOfItemInTable } from "../store/items/base/item";
import { asPageItem, calcCurrentPageItemGeometry, calcPageInnerSpatialDimensionsBl, isPageItem } from "../store/items/page-item";
import { CHILD_ITEMS_VISIBLE_WIDTH_BL, GRID_SIZE, TOOLBAR_WIDTH } from "../constants";
import { ContextMenu } from "./context/ContextMenu";
import { BoundingBox, clientPxFromMouseEvent, desktopPxFromMouseEvent } from "../util/geometry";
import { useUserStore } from "../store/UserStoreProvider";
import { server } from "../server";
import { Uid } from "../util/uid";
import { ItemGeometry } from "../item-geometry";
import { mouseDownHandler, mouseMoveHandler, mouseUpHandler } from "../mouse";
import { asTableItem, isTableItem, TableItem } from "../store/items/table-item";
import { RenderArea } from "../render-area";
import { ItemOnDesktop } from "./ItemOnDesktop";
import { ItemInTable } from "./ItemInTable";


export const Desktop: Component = () => {
  const userStore = useUserStore();
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let lastMouseMoveEvent: MouseEvent | undefined;


  function loadChildItems(containerId: string) {
    layoutStore.childrenLoaded[containerId] = true;
    server.fetchChildItems(userStore.getUser()!, containerId)
      .catch(e => {
        console.log(`Error occurred feching items for '${containerId}': ${e}.`);
      })
      .then(children => {
        if (children != null) {
          itemStore.setChildItems(containerId, children);
        } else {
          console.log(`No items were fetched for '${containerId}'.`);
        }
      });
  }


  function calcTableNestedGeometry(tableId: Uid, tableBoundsPx: BoundingBox, level: number, renderArea: RenderArea) {
    let table = asTableItem(itemStore.getItem(tableId)!);

    if (!layoutStore.childrenLoaded[table.id]) {
      console.log("DEBUG: should never get here, because table child items should always be loaded on parent page load.");
      loadChildItems(table.id);
      return null;
    }

    let result: Array<ItemGeometry> = [];

    const rowWidthBl = table.spatialWidthGr / GRID_SIZE;
    const colHeightBl = table.spatialHeightGr / GRID_SIZE;
    const blockSizePx = {
      w: tableBoundsPx.w / rowWidthBl,
      h: tableBoundsPx.h / colHeightBl,
    };
    const headerHeightPx = blockSizePx.h * 1.5;

    for (let idx=0; idx<table.computed_children.length; ++idx) {
      const childId = table.computed_children[idx];
      const childItem = itemStore.getFixedItem(childId)!;
      const itemGeometry = calcGeometryOfItemInTable(childItem, blockSizePx, rowWidthBl, idx, level);
      result.push(itemGeometry);
    }

    renderArea.children.push({
      itemId: tableId,
      boundsPx: {
        x: tableBoundsPx.x, y: tableBoundsPx.y + headerHeightPx,
        w: tableBoundsPx.w, h: tableBoundsPx.h - headerHeightPx
      },
      itemGeometry: result,
      children: []
    });
  }


  function calcPageNestedGeometry(pageId: Uid, pageBoundsPx: BoundingBox, renderArea: RenderArea, twoLevel: boolean) {
    if (pageId == null) { return; }

    let page = asPageItem(itemStore.getItem(pageId)!);
    let pageInnerDimensionsBl = calcPageInnerSpatialDimensionsBl(page);

    if (!layoutStore.childrenLoaded[page.id]) {
      loadChildItems(page.id);
      return;
    }

    page.computed_children.map(childId => itemStore.getFixedItem(childId)!).forEach(childItem => {
      let itemGeometry = calcGeometryOfItemInPage(childItem, pageBoundsPx, pageInnerDimensionsBl, 1);
      renderArea.itemGeometry.push(itemGeometry);
      if (isPageItem(childItem)) {
        let childPage = asPageItem(childItem);
        if (childPage.spatialWidthGr / GRID_SIZE >= CHILD_ITEMS_VISIBLE_WIDTH_BL) {
          if (layoutStore.childrenLoaded[childPage.id]) {
            // calcPageNestedGeometry(childPage.id, itemGeometry.boundsPx, renderArea);
            if (twoLevel) {
              if (!layoutStore.childrenLoaded[page.id]) {
                loadChildItems(childPage.id);
              } else {
                let childPageBoundsPx = itemGeometry.boundsPx;
                let childPageInnerDimensionsBl = calcPageInnerSpatialDimensionsBl(childPage);
                childPage.computed_children.map(childId => itemStore.getFixedItem(childId)!).forEach(childChildItem => {
                  let childItemGeometry = calcGeometryOfItemInPage(childChildItem, childPageBoundsPx, childPageInnerDimensionsBl, 2);
                  renderArea.itemGeometry.push(childItemGeometry);
                });
              }
            }
          } else {
            loadChildItems(childPage.id);
          }
        }
      } else if (isTableItem(childItem)) {
        if (twoLevel) {
          let childTable = asTableItem(childItem);
          if (layoutStore.childrenLoaded[childTable.id]) {
            calcTableNestedGeometry(childTable.id, itemGeometry.boundsPx, 2, renderArea);
          } else {
            loadChildItems(childTable.id);
          }
        }
      }
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
    const currentPageBoundsPx: BoundingBox = layoutStore.desktopBoundsPx();
    const currentPage = asPageItem(itemStore.getFixedItem(currentPageId!)!);
    let renderArea: RenderArea = {
      itemId: currentPageId,
      boundsPx: currentPageBoundsPx,
      itemGeometry: [calcCurrentPageItemGeometry(currentPage, currentPageBoundsPx)],
      children: []
    }
    calcPageNestedGeometry(currentPageId, currentPageBoundsPx, renderArea, true);
    return renderArea;
  });


  const calcMovingGeometry = (): Array<ItemGeometry> => {
    let renderArea = calcFixedGeometryMemoized();

    let result: Array<ItemGeometry> = [];
    for (let i=0; i<itemStore.getMovingItems().length; ++i) {
      let item = itemStore.getMovingItems()[i];
      let parentGeometry = renderArea?.itemGeometry.find(a => a.item.id == item.parentId);
      let parentPage = asPageItem(itemStore.getFixedItem(parentGeometry!.item.id)!);
      let pageInnerDimensionsBl = calcPageInnerSpatialDimensionsBl(parentPage);
      let movingItemGeometry = calcGeometryOfItemInPage(item, parentGeometry!.boundsPx, pageInnerDimensionsBl, 1);
      if (isPageItem(item)) {
        let ra: RenderArea = {
          itemId: item.id,
          boundsPx: movingItemGeometry.boundsPx,
          itemGeometry: [movingItemGeometry],
          children: []
        }
        if (asPageItem(item).spatialWidthGr / GRID_SIZE >= CHILD_ITEMS_VISIBLE_WIDTH_BL) {
          calcPageNestedGeometry(item.id, movingItemGeometry.boundsPx, renderArea, false);
        }
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

    let lastClientPx = clientPxFromMouseEvent(lastMouseMoveEvent!);
    let el = document.elementsFromPoint(lastClientPx.x, lastClientPx.y)!.find(e => e.id != null && e.id != "");
    if (el == null) { return; }
    let item = itemStore.getFixedItem(el.id)!;
    layoutStore.setContextMenuInfo({ posPx: desktopPxFromMouseEvent(lastMouseMoveEvent!), item });
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
    layoutStore.resetDesktopSizePx();
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


  function drawItems(itemGeometries: Array<ItemGeometry>) {
    return (
      <For each={itemGeometries}>
        { itemGeometry => <ItemOnDesktop itemGeometry={itemGeometry} /> }
      </For>
    );
  }

  function drawTableItems(itemGeometries: Array<ItemGeometry>, parentTable: TableItem) {
    return (
      <For each={itemGeometries}>
        { itemGeometry => <ItemInTable itemGeometry={itemGeometry} parentTable={parentTable} /> }
      </For>
    );
  }

  function draw() {
    let fixedGeometry = calcFixedGeometryMemoized();

    return (
    <>
    { drawItems(fixedGeometry.itemGeometry) }

    <For each={fixedGeometry.children}>{renderArea => (() => {
      let tableItem = asTableItem(itemStore.getItem(renderArea.itemId)!);
      let heightBr = tableItem.spatialHeightGr / GRID_SIZE;
      let heightPx = renderArea.boundsPx.h;
      let blockHeightPx = heightPx / heightBr;
      let totalItemHeightPx = tableItem.computed_children.length * blockHeightPx;
      return (
        <div class="absolute" style={`left: ${renderArea.boundsPx.x}px; top: ${renderArea.boundsPx.y}px; width: ${renderArea.boundsPx.w}px; height: ${renderArea.boundsPx.h}px; overflow-y: auto;`}>
          <div class="absolute" style={`width: ${renderArea.boundsPx.w}px; height: ${totalItemHeightPx}px;`}>
            { drawTableItems(renderArea.itemGeometry, tableItem) }
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
      <ContextMenu />
    </div>
  );
}
