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
import { BoundingBox, clientPxFromMouseEvent, cloneBoundingBox, desktopPxFromMouseEvent } from "../util/geometry";
import { useUserStore } from "../store/UserStoreProvider";
import { server } from "../server";
import { Uid } from "../util/uid";
import { ItemGeometry } from "../item-geometry";
import { mouseDownHandler, mouseMoveHandler, mouseUpHandler } from "../mouse";
import { asTableItem, isTableItem, TableItem } from "../store/items/table-item";
import { RenderArea } from "../render-area";
import { ItemOnDesktop } from "./ItemOnDesktop";
import { ItemInTable } from "./ItemInTable";
import { panic } from "../util/lang";


export const Desktop: Component = () => {
  const userStore = useUserStore();
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();


  let lastMouseMoveEvent: MouseEvent | undefined;

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
    let renderAreas = calcFixedGeometryMemoized();
    if (renderAreas != null) {
      mouseDownHandler(itemStore, layoutStore, renderAreas, ev);
    }
  }

  const mouseMoveListener = (ev: MouseEvent) => {
    ev.preventDefault();
    lastMouseMoveEvent = ev;
    let renderAreas = calcFixedGeometryMemoized();
    if (renderAreas != null) {
      mouseMoveHandler(itemStore, layoutStore, renderAreas, ev);
    }
  }

  const mouseUpListener = (ev: MouseEvent) => {
    ev.preventDefault();
    let renderAreas = calcFixedGeometryMemoized();
    if (renderAreas != null) {
      mouseUpHandler(userStore, itemStore, layoutStore, renderAreas, ev);
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


  function loadChildItems(containerId: string) {
    layoutStore.childrenLoadedInitiated[containerId] = true;
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


  function calcPageNestedGeometry(pageId: Uid, pageBoundsPx: BoundingBox, renderDepth: number): Array<RenderArea> {
    if (renderDepth < 1 || renderDepth > 2) { panic(); }

    let page = asPageItem(itemStore.getItem(pageId)!);

    let renderArea: RenderArea = {
      itemId: pageId,
      boundsPx: pageBoundsPx,
      containerGeometry: calcCurrentPageItemGeometry(page, pageBoundsPx),
      childGeometry: [],
      areaType: "page",
    }

    let result = [renderArea];

    if (!layoutStore.childrenLoadedInitiated[pageId]) {
      loadChildItems(pageId);
      return [renderArea];
    }

    let pageInnerDimensionsBl = calcPageInnerSpatialDimensionsBl(page);

    page.computed_children.map(childId => itemStore.getFixedItem(childId)!).forEach(childItem => {
      let itemGeometry = calcGeometryOfItemInPage(childItem, pageBoundsPx, pageInnerDimensionsBl, true);

      if (isPageItem(childItem)) {
        let childPage = asPageItem(childItem);
        if (childPage.spatialWidthGr / GRID_SIZE >= CHILD_ITEMS_VISIBLE_WIDTH_BL && renderDepth == 2) {
          if (!layoutStore.childrenLoadedInitiated[childPage.id]) {
            loadChildItems(childPage.id);
          }
          let childRenderArea: RenderArea = {
            itemId: childPage.id,
            boundsPx: itemGeometry.boundsPx,
            containerGeometry: itemGeometry,
            childGeometry: [],
            areaType: "page",
          }
          let childPageBoundsPx = cloneBoundingBox(itemGeometry.boundsPx)!;
          childPageBoundsPx.x = 0.0;
          childPageBoundsPx.y = 0.0;
          let childPageInnerDimensionsBl = calcPageInnerSpatialDimensionsBl(childPage);
          childPage.computed_children.map(childId => itemStore.getFixedItem(childId)!).forEach(childChildItem => {
            childRenderArea.childGeometry.push(
              calcGeometryOfItemInPage(childChildItem, childPageBoundsPx, childPageInnerDimensionsBl, false)
            );
          });
          result.push(childRenderArea);
        } else {
          renderArea.childGeometry.push(itemGeometry);
        }
      } else if (isTableItem(childItem)) {
        if (renderDepth == 2) {
          let table = asTableItem(childItem);
          let tableBoundsPx = itemGeometry.boundsPx;
          if (!layoutStore.childrenLoadedInitiated[table.id]) {
            loadChildItems(table.id);
          }

          const sizeBl = { w: table.spatialWidthGr / GRID_SIZE, h: table.spatialHeightGr / GRID_SIZE };
          const blockSizePx = { w: tableBoundsPx.w / sizeBl.w, h: tableBoundsPx.h / sizeBl.h };
          const headerHeightPx = blockSizePx.h * 1.5;

          let childGeometry: Array<ItemGeometry> = [];
          for (let idx=0; idx<table.computed_children.length; ++idx) {
            const childId = table.computed_children[idx];
            const childItem = itemStore.getFixedItem(childId)!;
            const itemGeometry = calcGeometryOfItemInTable(childItem, blockSizePx, sizeBl.w, idx);
            childGeometry.push(itemGeometry);
          }

          result.push({
            itemId: table.id,
            containerGeometry: itemGeometry,
            childGeometry,
            boundsPx: {
              x: tableBoundsPx.x, y: tableBoundsPx.y + headerHeightPx,
              w: tableBoundsPx.w, h: tableBoundsPx.h - headerHeightPx
            },
            areaType: "table",
          });

        } else {
          renderArea.childGeometry.push(itemGeometry);
        }
      } else {
        renderArea.childGeometry.push(itemGeometry);
      }
    });

    return result;
  }


  const calcFixedGeometryMemoized = createMemo((): Array<RenderArea> => {
    const currentPageId = layoutStore.currentPageId();
    if (currentPageId == null) { return []; }
    return calcPageNestedGeometry(currentPageId!, layoutStore.desktopBoundsPx(), 2);
  });


  const calcMovingGeometry = (): Array<ItemGeometry> => {
    let renderAreas = calcFixedGeometryMemoized()!;

    let result: Array<ItemGeometry> = [];
    for (let i=0; i<itemStore.getMovingItems().length; ++i) {
      let item = itemStore.getMovingItems()[i];
      let parentGeometry = renderAreas[0]!.containerGeometry;
      let parentPage = asPageItem(itemStore.getFixedItem(parentGeometry!.item.id)!);
      let pageInnerDimensionsBl = calcPageInnerSpatialDimensionsBl(parentPage);
      let movingItemGeometry = calcGeometryOfItemInPage(item, parentGeometry!.boundsPx, pageInnerDimensionsBl, false);
      if (isPageItem(item) && asPageItem(item).spatialWidthGr / GRID_SIZE >= CHILD_ITEMS_VISIBLE_WIDTH_BL) {
        let ra = calcPageNestedGeometry(item.id, movingItemGeometry.boundsPx, 1);
        result = ra[0].childGeometry;
      } else {
        result = [movingItemGeometry];
      }
    }

    return result;
  }


  function drawItems() {
    let renderAreas = calcFixedGeometryMemoized();

    return (
      <>
        <For each={renderAreas}>{renderArea => (() => {
          if (renderArea.areaType == "page") {
            return (
              <>
                <ItemOnDesktop itemGeometry={renderArea.containerGeometry} />
                <div class="absolute"
                    style={`left: ${renderArea.boundsPx.x}px; top: ${renderArea.boundsPx.y}px; ` +
                            `width: ${renderArea.boundsPx.w}px; height: ${renderArea.boundsPx.h}px;`}>
                  <For each={renderArea.childGeometry}>
                    { itemGeometry => <ItemOnDesktop itemGeometry={itemGeometry} /> }
                  </For>
                </div>
              </>
            );
          } else if (renderArea.areaType == "table") {
            let tableItem = asTableItem(itemStore.getItem(renderArea.itemId)!);
            let heightBr = tableItem.spatialHeightGr / GRID_SIZE;
            let heightPx = renderArea.boundsPx.h;
            let blockHeightPx = heightPx / heightBr;
            let scrollableHeightPx = tableItem.computed_children.length * blockHeightPx;
            return (
              <>
                <ItemOnDesktop itemGeometry={renderArea.containerGeometry} />
                <div class="absolute"
                    style={`left: ${renderArea.boundsPx.x}px; top: ${renderArea.boundsPx.y}px; ` +
                            `width: ${renderArea.boundsPx.w}px; height: ${renderArea.boundsPx.h}px; overflow-y: auto;`}>
                  <div class="absolute" style={`width: ${renderArea.boundsPx.w}px; height: ${scrollableHeightPx}px;`}>
                    <For each={renderArea.childGeometry}>
                      { itemGeometry => <ItemInTable itemGeometry={itemGeometry} parentTable={tableItem} /> }
                    </For>
                  </div>
                </div>
              </>
            )
          } else {
            return <></>
          }
          })()
        }</For>

        <For each={calcMovingGeometry()}>
          { itemGeometry => <ItemOnDesktop itemGeometry={itemGeometry} /> }
        </For>
      </>
    );
  }

  return (
    <div class="absolute top-0 bottom-0 right-0 select-none outline-none"
         style={`left: ${TOOLBAR_WIDTH}px`}>
      { drawItems() }
      <ContextMenu />
    </div>
  );
}
