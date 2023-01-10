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

import { GRID_SIZE, MOUSE_MOVE_AMBIGUOUS_PX } from "./constants";
import { Hitbox, HitboxType } from "./hitbox";
import { RenderArea } from "./render-area";
import { server } from "./server";
import { calcSizeForSpatialBl, Item } from "./store/items/base/item";
import { asXSizableItem } from "./store/items/base/x-sizeable-item";
import { asYSizableItem, isYSizableItem } from "./store/items/base/y-sizeable-item";
import { isPageItem } from "./store/items/page-item";
import { ItemStoreContextModel } from "./store/ItemStoreProvider";
import { LayoutStoreContextModel } from "./store/LayoutStoreProvider";
import { UserStoreContextModel } from "./store/UserStoreProvider";
import { add, BoundingBox, desktopPxFromMouseEvent, isInside, subtract, Vector } from "./util/geometry";
import { panic } from "./util/lang";
import { Uid } from "./util/uid";

const MOUSE_LEFT = 0;
const MOUSE_RIGHT = 2;

enum MouseAction {
  Ambiguous,
  Moving,
  Resizing,
}

interface HitInfo {
  item: Item,
  hitbox: Hitbox,
  itemBoundsPx: BoundingBox
}

function getHitInfo(renderAreas: Array<RenderArea>, desktopPx: Vector): HitInfo | null {
  let hitPointPx = desktopPx;
  let renderArea = renderAreas[0];

  for (let i=1; i<renderAreas.length; ++i) {
    let childRenderArea = renderAreas[i];
    if (childRenderArea.areaType == "table") { // hittin inner page items is not allowed.
      if (isInside(desktopPx, childRenderArea.boundsPx)) {
        renderArea = childRenderArea;
        hitPointPx = subtract(desktopPx, { x: childRenderArea.boundsPx.x, y: childRenderArea.boundsPx.y });
        break;
      }
    }
  }

  let itemGeometry = renderArea.itemGeometry;
  let geom = itemGeometry.filter(g => isInside(hitPointPx, g.boundsPx))
  for (let i=geom.length-1; i>=0; --i) {
    for (let j=geom[i].hitboxes.length-1; j>=0; --j) {
      if (isInside(hitPointPx, geom[i].hitboxes[j].boundsPx)) {
        return {
          item: geom[i].item,
          hitbox: geom[i].hitboxes[j],
          itemBoundsPx: geom[i].boundsPx
        };
      }
    }
  }

  return null;
}


let hitboxType: HitboxType | null = null;
let activeItem: Item | null = null;
let startPx: Vector | null = null;
let startPosBl: Vector | null = null;
let startWidthBl: number | null = null;
let startHeightBl: number | null = null;
let mouseAction: MouseAction | null = null;
let scale: Vector | null;

function clearState() {
  hitboxType = null;
  activeItem = null;
  startPx = null;
  mouseAction = null;
  startPosBl = null;
  startWidthBl = null;
  startHeightBl = null;
  scale = null;
}

export function mouseDownHandler(
    itemStore: ItemStoreContextModel,
    layoutStore: LayoutStoreContextModel,
    renderAreas: Array<RenderArea>,
    ev: MouseEvent) {
  if (ev.button == MOUSE_LEFT) {
    mouseLeftDownHandler(itemStore, layoutStore, renderAreas, ev);
  } else if (ev.button == MOUSE_RIGHT) {
    mouseRightDownHandler(itemStore, layoutStore, renderAreas, ev);
  } else {
    console.log("unsupported mouse button: " + ev.button);
  }
}

export function mouseLeftDownHandler(
    itemStore: ItemStoreContextModel,
    layoutStore: LayoutStoreContextModel,
    renderAreas: Array<RenderArea>,
    ev: MouseEvent) {
  layoutStore.setContextMenuInfo(null);

  let hitInfo = getHitInfo(renderAreas, desktopPxFromMouseEvent(ev));
  if (hitInfo == null) {
    clearState();
    return;
  }

  hitboxType = hitInfo.hitbox.type;
  activeItem = hitInfo.item;
  mouseAction = MouseAction.Ambiguous;
  startPx = desktopPxFromMouseEvent(ev);
  scale = {
    x: calcSizeForSpatialBl(activeItem!).w / hitInfo.itemBoundsPx.w,
    y: calcSizeForSpatialBl(activeItem!).h / hitInfo.itemBoundsPx.h
  };

  if (hitInfo.hitbox.type == HitboxType.Move) {
    startWidthBl = null;
    startPosBl = { x: activeItem.spatialPositionGr.x / GRID_SIZE, y: activeItem.spatialPositionGr.y / GRID_SIZE };
  } else if (hitInfo.hitbox.type == HitboxType.Resize) {
    startPosBl = null;
    startWidthBl = asXSizableItem(activeItem).spatialWidthGr / GRID_SIZE;
    if (isYSizableItem(activeItem)) {
      startHeightBl = asYSizableItem(activeItem).spatialHeightGr / GRID_SIZE;
    }
  }
}

export function mouseRightDownHandler(
    itemStore: ItemStoreContextModel,
    layoutStore: LayoutStoreContextModel,
    _renderAreas: Array<RenderArea>,
    _ev: MouseEvent) {
  layoutStore.setContextMenuInfo(null);

  let item = itemStore.getFixedItem(layoutStore.currentPageId()!)!;
  let parentId = item.parentId;
  let loopCount = 0;
  while (!isPageItem(itemStore.getFixedItem(parentId!)!))
  {
    if (parentId == null) { panic(); }
    item = itemStore.getFixedItem(parentId)!;
    parentId = item.parentId;
    if (loopCount++ > 10) { panic(); }
  }
  layoutStore.setCurrentPageId(parentId);
}

export function mouseMoveHandler(
    itemStore: ItemStoreContextModel,
    _layoutStore: LayoutStoreContextModel,
    renderAreas: Array<RenderArea>,
    ev: MouseEvent) {

  let hitInfo = getHitInfo(renderAreas, desktopPxFromMouseEvent(ev));
  if (hitInfo != null) {
    if (hitInfo.hitbox.type == HitboxType.Resize) {
      document.body.style.cursor = "nwse-resize";
    } else {
      document.body.style.cursor = "default";
    }
  } else {
    document.body.style.cursor = "default"
  }

  if (mouseAction == null) { return; }

  let deltaPx = subtract(desktopPxFromMouseEvent(ev), startPx!);
  if (Math.abs(deltaPx.x) > MOUSE_MOVE_AMBIGUOUS_PX || Math.abs(deltaPx.y) > MOUSE_MOVE_AMBIGUOUS_PX) {
    if (mouseAction == MouseAction.Ambiguous) {
      if (hitboxType == HitboxType.Move) {
        itemStore.transitionToMove(activeItem!.id);
        mouseAction = MouseAction.Moving;
      } else if (hitboxType == HitboxType.Resize) {
        mouseAction = MouseAction.Resizing;
      }
    }
  }

  if (mouseAction == MouseAction.Ambiguous) {
    return;
  }

  const deltaBl = {
    x: deltaPx.x * scale!.x,
    y: deltaPx.y * scale!.y
  };

  if (mouseAction == MouseAction.Moving) {
    let newPosBl = add(startPosBl!, deltaBl);
    newPosBl.x = Math.round(newPosBl.x * 2.0) / 2.0;
    newPosBl.y = Math.round(newPosBl.y * 2.0) / 2.0;
    if (newPosBl.x < 0.0) { newPosBl.x = 0.0; }
    if (newPosBl.y < 0.0) { newPosBl.y = 0.0; }
    itemStore.updateItem(activeItem!.id, item => { item.spatialPositionGr = { x: newPosBl.x * GRID_SIZE, y: newPosBl.y * GRID_SIZE }; });
  } else if (mouseAction == MouseAction.Resizing) {
    let newWidthBl = startWidthBl! + deltaBl.x;
    newWidthBl = Math.round(newWidthBl);
    if (newWidthBl < 1) { newWidthBl = 1.0; }
    itemStore.updateItem(activeItem!.id, item => { asXSizableItem(item).spatialWidthGr = newWidthBl * GRID_SIZE; });
    if (isYSizableItem(activeItem)) {
      let newHeightBl = startHeightBl! + deltaBl.y;
      newHeightBl = Math.round(newHeightBl);
      if (newHeightBl < 1) { newHeightBl = 1.0; }
      itemStore.updateItem(activeItem!.id, item => { asYSizableItem(item).spatialHeightGr = newHeightBl * GRID_SIZE; });
    }
  }
}

export function mouseUpHandler(
    userStore: UserStoreContextModel,
    itemStore: ItemStoreContextModel,
    layoutStore: LayoutStoreContextModel,
    _renderAreas: Array<RenderArea>,
    _ev: MouseEvent) {

  if (mouseAction == null) { return; }

  switch (mouseAction) {
    case MouseAction.Ambiguous:
      if (isPageItem(activeItem!)) {
        layoutStore.setCurrentPageId(activeItem!.id);
      }
      break;
    case MouseAction.Moving:
      itemStore.transitionMovingToFixed();
      server.updateItem(userStore.getUser()!, itemStore.getFixedItem(activeItem!.id)!);
      break;
    case MouseAction.Resizing:
      server.updateItem(userStore.getUser()!, itemStore.getFixedItem(activeItem!.id)!);
      break;
    default:
      panic();
  }

  clearState();
}
