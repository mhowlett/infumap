/*
  Copyright (C) 2023 Matt Howlett
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

import { GRID_SIZE, RESIZE_BOX_SIZE_PX } from "../../constants";
import { HitboxType } from "../../hitbox";
import { ItemGeometry } from "../../item-geometry";
import { BoundingBox, cloneVector, Dimensions } from "../../util/geometry";
import { currentUnixTimeSeconds, panic } from "../../util/lang";
import { newUid, Uid } from "../../util/uid";
import { AttachmentsItem } from "./base/attachments-item";
import { ContainerItem } from "./base/container-item";
import { Item } from "./base/item";
import { XSizableItem } from "./base/x-sizeable-item";
import { YSizableItem } from "./base/y-sizeable-item";

export interface TableItem extends XSizableItem, YSizableItem, ContainerItem, AttachmentsItem {
}

export function calcTableSizeForSpatialBl(item: TableItem): Dimensions {
  return { w: item.spatialWidthGr / GRID_SIZE, h: item.spatialHeightGr / GRID_SIZE };
}

export function calcGeometryOfTableItem(item: TableItem, containerBoundsPx: BoundingBox, containerInnerSizeBl: Dimensions, level: number): ItemGeometry {
  const boundsPx = {
    x: (item.spatialPositionGr.x / (containerInnerSizeBl.w * GRID_SIZE)) * containerBoundsPx.w + containerBoundsPx.x,
    y: (item.spatialPositionGr.y / (containerInnerSizeBl.h * GRID_SIZE)) * containerBoundsPx.h + containerBoundsPx.y,
    w: calcTableSizeForSpatialBl(item).w / containerInnerSizeBl.w * containerBoundsPx.w,
    h: calcTableSizeForSpatialBl(item).h / containerInnerSizeBl.h * containerBoundsPx.h,
  };
  return {
    itemId: item.id,
    boundsPx,
    hitboxes: level != 1 ? [] : [
      { type: HitboxType.Move, boundsPx },
      { type: HitboxType.Resize,
        boundsPx: { x: boundsPx.x + boundsPx.w - RESIZE_BOX_SIZE_PX, y: boundsPx.y + boundsPx.h - RESIZE_BOX_SIZE_PX,
                    w: RESIZE_BOX_SIZE_PX, h: RESIZE_BOX_SIZE_PX } }
    ],
    level,
  };
}

export function calcGeometryOfTableItemInTable(item: TableItem, blockSizePx: Dimensions, index: number, level: number): ItemGeometry {
  const boundsPx = {
    x: 0.0,
    y: blockSizePx.h * (index + 1.5),
    w: blockSizePx.w * item.spatialWidthGr / GRID_SIZE,
    h: blockSizePx.h
  };
  return {
    itemId: item.id,
    boundsPx,
    hitboxes: [],
    level
  };
}

export function isTableItem(item: Item | null): boolean {
  if (item == null) { return false; }
  return item.itemType == "table";
}

export function asTableItem(item: Item): TableItem {
  if (item.itemType == "table") { return item as TableItem; }
  panic();
}

export function cloneTableItem(item: TableItem): TableItem {
  return {
    itemType: "table",
    ownerId: item.ownerId,
    id: item.id,
    parentId: item.parentId,
    relationshipToParent: item.relationshipToParent,
    creationDate: item.creationDate,
    lastModifiedDate: item.lastModifiedDate,
    ordering: item.ordering,
    title: item.title,
    spatialPositionGr: cloneVector(item.spatialPositionGr)!,

    spatialWidthGr: item.spatialWidthGr,
    spatialHeightGr: item.spatialHeightGr,

    computed_children: [...item.computed_children],
    computed_attachments: [...item.computed_attachments],
    computed_fromParentIdMaybe: item.computed_fromParentIdMaybe
  };
}

export function newTableItem(ownerId: Uid, parentId: Uid, relationshipToParent: string, title: string, ordering: Uint8Array): TableItem {
  return {
    itemType: "table",
    ownerId,
    id: newUid(),
    parentId,
    relationshipToParent,
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering,
    title,
    spatialPositionGr: { x: 0.0, y: 0.0 },

    spatialWidthGr: 8.0 * GRID_SIZE,
    spatialHeightGr: 6.0 * GRID_SIZE,

    computed_children: [],
    computed_attachments: [],
    computed_fromParentIdMaybe: null,
  };
}
