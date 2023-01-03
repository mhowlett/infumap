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

import { GRID_SIZE, RESIZE_BOX_SIZE_PX } from '../../constants';
import { HitboxType } from '../../hitbox';
import { ItemGeometry } from '../../item-geometry';
import { BoundingBox, cloneVector, Dimensions, Vector } from '../../util/geometry';
import { currentUnixTimeSeconds, panic } from '../../util/lang';
import { newUid, Uid } from '../../util/uid';
import { AttachmentsItem } from './base/attachments-item';
import { ContainerItem } from './base/container-item';
import { Item } from './base/item';
import { XSizableItem } from './base/x-sizeable-item';


export interface PageItem extends XSizableItem, ContainerItem, AttachmentsItem {
  innerSpatialWidthGr: number;
  naturalAspect: number;
  backgroundColorIndex: number;
  popupPositionGr: Vector;
  popupAlignmentPoint: string,
  popupWidthGr: number;
}

export function calcPageSizeForSpatialBl(item: PageItem): Dimensions {
  let bh = Math.round(item.spatialWidthGr / GRID_SIZE / item.naturalAspect * 2.0) / 2.0;
  return { w: item.spatialWidthGr / GRID_SIZE, h: bh < 0.5 ? 0.5 : bh };
}

export function calcPageInnerSpatialDimensionsBl(page: PageItem): Dimensions {
  return {
    w: page.innerSpatialWidthGr / GRID_SIZE,
    h: Math.floor(page.innerSpatialWidthGr / GRID_SIZE / page.naturalAspect)
  };
}

export function calcGeometryOfPageItem(item: PageItem, containerBoundsPx: BoundingBox, containerInnerSizeBl: Dimensions, level: number): ItemGeometry {
  const boundsPx = {
    x: (item.spatialPositionGr.x / (containerInnerSizeBl.w * GRID_SIZE)) * containerBoundsPx.w + containerBoundsPx.x,
    y: (item.spatialPositionGr.y / (containerInnerSizeBl.h * GRID_SIZE)) * containerBoundsPx.h + containerBoundsPx.y,
    w: calcPageSizeForSpatialBl(item).w / containerInnerSizeBl.w * containerBoundsPx.w,
    h: calcPageSizeForSpatialBl(item).h / containerInnerSizeBl.h * containerBoundsPx.h,
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

export function calcGeometryOfPageItemInTable(item: PageItem, blockSizePx: Dimensions, rowWidthBl: number, index: number, level: number): ItemGeometry {
  const boundsPx = {
    x: 0.0,
    y: blockSizePx.h * (index + 1.5),
    w: blockSizePx.w * rowWidthBl,
    h: blockSizePx.h
  };
  return {
    itemId: item.id,
    boundsPx,
    hitboxes: [],
    level
  };
}

export function calcCurrentPageItemGeometry(item: PageItem, desktopBoundsPx: BoundingBox): ItemGeometry {
  return {
    itemId: item.id,
    boundsPx: desktopBoundsPx,
    hitboxes: [],
    level: 0,
  };
}

export function isPageItem(item: Item | null): boolean {
  if (item == null) { return false; }
  return item.itemType == "page";
}

export function asPageItem(item: Item): PageItem {
  if (item.itemType == "page") { return item as PageItem; }
  panic();
}

export function clonePageItem(item: PageItem): PageItem {
  return {
    itemType: "page",
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

    innerSpatialWidthGr: item.innerSpatialWidthGr,
    naturalAspect: item.naturalAspect,
    backgroundColorIndex: item.backgroundColorIndex,
    popupPositionGr: cloneVector(item.popupPositionGr)!,
    popupAlignmentPoint: item.popupAlignmentPoint,
    popupWidthGr: item.popupWidthGr,

    computed_children: [...item.computed_children],
    computed_attachments: [...item.computed_attachments],
    computed_fromParentIdMaybe: item.computed_fromParentIdMaybe
  };
}

export function newPageItem(ownerId: Uid, parentId: Uid, relationshipToParent: string, title: string, ordering: Uint8Array): PageItem {
  return {
    itemType: "page",
    ownerId,
    id: newUid(),
    parentId,
    relationshipToParent,
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering,
    title,
    spatialPositionGr: { x: 0.0, y: 0.0 },

    spatialWidthGr: 4.0 * GRID_SIZE,

    innerSpatialWidthGr: 60.0 * GRID_SIZE,
    naturalAspect: 2.0,
    backgroundColorIndex: 0,
    popupPositionGr: { x: 30.0 * GRID_SIZE, y: 15.0 * GRID_SIZE },
    popupAlignmentPoint: "center",
    popupWidthGr: 10.0 * GRID_SIZE,

    computed_children: [],
    computed_attachments: [],
    computed_fromParentIdMaybe: null,
  };
}
