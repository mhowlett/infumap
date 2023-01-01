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
  innerSpatialWidthBl: number;
  naturalAspect: number;
  backgroundColorIndex: number;
  popupPositionBl: Vector;
  popupAlignmentPoint: string,
  popupWidthBl: number;
}

export function calcPageSizeForSpatialBl(item: PageItem): Dimensions {
  let bh = Math.round(item.spatialWidthBl / item.naturalAspect * 2.0) / 2.0;
  return { w: item.spatialWidthBl, h: bh < 0.5 ? 0.5 : bh };
}

export function calcPageInnerSpatialDimensionsCo(page: PageItem): Dimensions {
  return {
    w: page.innerSpatialWidthBl * GRID_SIZE,
    h: Math.floor(page.innerSpatialWidthBl / page.naturalAspect) * GRID_SIZE
  };
}

export function calcGeometryOfPageItem(item: PageItem, containerBoundsPx: BoundingBox, containerInnerSizeCo: Dimensions, level: number): ItemGeometry {
  const boundsPx = {
    x: (item.spatialPositionBl.x * GRID_SIZE / containerInnerSizeCo.w) * containerBoundsPx.w + containerBoundsPx.x,
    y: (item.spatialPositionBl.y * GRID_SIZE / containerInnerSizeCo.h) * containerBoundsPx.h + containerBoundsPx.y,
    w: calcPageSizeForSpatialBl(item).w * GRID_SIZE / containerInnerSizeCo.w * containerBoundsPx.w,
    h: calcPageSizeForSpatialBl(item).h * GRID_SIZE / containerInnerSizeCo.h * containerBoundsPx.h,
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
    level
  };
}

export function calcCurrentPageItemGeometry(item: PageItem, desktopBoundsPx: BoundingBox): ItemGeometry {
  return {
    itemId: item.id,
    boundsPx: desktopBoundsPx,
    hitboxes: [],
    level: 0
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
    spatialPositionBl: cloneVector(item.spatialPositionBl)!,

    spatialWidthBl: item.spatialWidthBl,

    innerSpatialWidthBl: item.innerSpatialWidthBl,
    naturalAspect: item.naturalAspect,
    backgroundColorIndex: item.backgroundColorIndex,
    popupPositionBl: cloneVector(item.popupPositionBl)!,
    popupAlignmentPoint: item.popupAlignmentPoint,
    popupWidthBl: item.popupWidthBl,

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
    spatialPositionBl: { x: 0.0, y: 0.0 },

    spatialWidthBl: 4.0,

    innerSpatialWidthBl: 60.0,
    naturalAspect: 2.0,
    backgroundColorIndex: 0,
    popupPositionBl: { x: 30.0, y: 15.0 },
    popupAlignmentPoint: "center",
    popupWidthBl: 10.0,

    computed_children: [],
    computed_attachments: [],
    computed_fromParentIdMaybe: null,
  };
}
