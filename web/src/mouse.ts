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

import { MOUSE_MOVE_AMBIGUOUS_PX } from "./constants";
import { Hitbox, HitboxType } from "./hitbox";
import { ItemGeometry } from "./item-geometry";
import { server } from "./server";
import { calcSizeForSpatialBl, Item } from "./store/items/base/item";
import { asXSizableItem } from "./store/items/base/x-sizeable-item";
import { ItemStoreContextModel } from "./store/ItemStoreProvider";
import { LayoutStoreContextModel } from "./store/LayoutStoreProvider";
import { UserStoreContextModel } from "./store/UserStoreProvider";
import { add, BoundingBox, desktopPxFromMouseEvent, isInside, subtract, Vector } from "./util/geometry";
import { Uid } from "./util/uid";

enum MouseAction {
  Ambiguous,
  Moving,
  Resizing,
}

interface HitInfo {
  itemId: Uid,
  hitbox: Hitbox,
  itemBoundsPx: BoundingBox
}

function getHitInfo(itemGeometry: Array<ItemGeometry>, desktopPx: Vector): HitInfo | null {
  let geom = itemGeometry.filter(g => isInside(desktopPx, g.boundsPx))
  for (let i=geom.length-1; i>=0; --i) {
    for (let j=geom[i].hitboxes.length-1; j>=0; --j) {
      if (isInside(desktopPx, geom[i].hitboxes[j].boundsPx)) {
        return {
          itemId: geom[i].itemId,
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
let mouseAction: MouseAction | null = null;
let scale: Vector | null;

function clearState() {
  hitboxType = null;
  activeItem = null;
  startPx = null;
  mouseAction = null;
  startPosBl = null;
  startWidthBl = null;
  scale = null;
}

export function mouseDownHandler(itemStore: ItemStoreContextModel, layoutStore: LayoutStoreContextModel, itemGeometry: Array<ItemGeometry>, ev: MouseEvent) {
  layoutStore.hideContextMenu();
  let hi = getHitInfo(itemGeometry, desktopPxFromMouseEvent(ev));
  if (hi == null) {
    clearState();
    return;
  }

  hitboxType = hi.hitbox.type;
  activeItem = itemStore.items.fixed[hi.itemId];
  mouseAction = MouseAction.Ambiguous;
  startPx = desktopPxFromMouseEvent(ev);
  scale = {
    x: calcSizeForSpatialBl(activeItem!).w / hi.itemBoundsPx.w,
    y: calcSizeForSpatialBl(activeItem!).h / hi.itemBoundsPx.h
  };

  if (hi.hitbox.type == HitboxType.Move) {
    startWidthBl = null;
    startPosBl = itemStore.items.fixed[hi.itemId].spatialPositionBl;
  } else if (hi.hitbox.type == HitboxType.Resize) {
    startPosBl = null;
    startWidthBl = asXSizableItem(itemStore.items.fixed[hi.itemId]).spatialWidthBl;
  }
}

export function mouseMoveHandler(itemStore: ItemStoreContextModel, _layoutStore: LayoutStoreContextModel, _itemGeometry: Array<ItemGeometry>, ev: MouseEvent) {
  if (startPx == null) { return; }

  let deltaPx = subtract(desktopPxFromMouseEvent(ev), startPx);
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
    itemStore.updateItem(activeItem!.id, item => { item.spatialPositionBl = newPosBl; });
  } else if (mouseAction == MouseAction.Resizing) {
    let newWidthBl = startWidthBl! + deltaBl.x;
    newWidthBl = Math.round(newWidthBl);
    if (newWidthBl < 1) { newWidthBl = 1.0; }
    itemStore.updateItem(activeItem!.id, item => { asXSizableItem(item).spatialWidthBl = newWidthBl; });
  }
}

export function mouseUpHandler(userStore: UserStoreContextModel, itemStore: ItemStoreContextModel, _layoutStore: LayoutStoreContextModel, _itemGeometry: Array<ItemGeometry>, _ev: MouseEvent) {

    if (mouseAction == MouseAction.Moving) {
      itemStore.transitionMovingToFixed();
    }

    if (mouseAction != MouseAction.Ambiguous) {
      server.updateItem(userStore.user, itemStore.getItem(activeItem!.id)!);
    }

    clearState();
}
