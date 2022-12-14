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

import { GRID_SIZE } from "../../constants";
import { HitboxType } from "../../hitbox";
import { ItemGeometry } from "../../item-geometry";
import { BoundingBox, cloneDimensions, cloneVector, Dimensions } from "../../util/geometry";
import { panic } from "../../util/lang";
import { AttachmentsItem } from "./base/attachments-item";
import { DataItem } from "./base/data-item";
import { Item } from "./base/item";
import { TitledItem } from "./base/titled-item";
import { XSizableItem } from "./base/x-sizeable-item";


export interface ImageItem extends XSizableItem, AttachmentsItem, DataItem, TitledItem {
  imageSizePx: Dimensions,
  thumbnail: string,
}

export function isImageItem(item: Item | null): boolean {
  if (item == null) { return false; }
  return item.itemType == "image";
}

export function asImageItem(item: Item): ImageItem {
  if (item.itemType == "image") { return item as ImageItem; }
  panic();
}

export function calcImageSizeForSpatialBl(item: ImageItem): Dimensions {
  // half block quantization.
  let heightBl = Math.round(((item.spatialWidthGr / GRID_SIZE) * item.imageSizePx.h / item.imageSizePx.w) * 2.0) / 2.0;
  return { w: item.spatialWidthGr / GRID_SIZE, h: heightBl };
}

export function calcGeometryOfImageItem(item: ImageItem, containerBoundsPx: BoundingBox, containerInnerSizeBl: Dimensions, _emitHitboxes: boolean): ItemGeometry {
  const boundsPx = {
    x: (item.spatialPositionGr.x / (containerInnerSizeBl.w * GRID_SIZE)) * containerBoundsPx.w + containerBoundsPx.x,
    y: (item.spatialPositionGr.y / (containerInnerSizeBl.h * GRID_SIZE)) * containerBoundsPx.h + containerBoundsPx.y,
    w: calcImageSizeForSpatialBl(item).w / containerInnerSizeBl.w * containerBoundsPx.w,
    h: calcImageSizeForSpatialBl(item).h / containerInnerSizeBl.h * containerBoundsPx.h,
  };
  return {
    item,
    boundsPx,
    hitboxes: [],
  }
}

export function calcGeometryOfImageItemInTable(item: ImageItem, blockSizePx: Dimensions, rowWidthBl: number, index: number): ItemGeometry {
  const boundsPx = {
    x: 0.0,
    y: blockSizePx.h * index,
    w: blockSizePx.w * rowWidthBl,
    h: blockSizePx.h
  };
  return {
    item,
    boundsPx,
    hitboxes: [ { type: HitboxType.Move, boundsPx } ],
  };
}


export function cloneImageItem(item: ImageItem): ImageItem {
  return {
    itemType: "note",
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

    originalCreationDate: item.originalCreationDate,
    mimeType: item.mimeType,
    fileSizeBytes: item.fileSizeBytes,

    imageSizePx: cloneDimensions(item.imageSizePx)!,
    thumbnail: item.thumbnail,

    computed_attachments: [...item.computed_attachments],
    computed_fromParentIdMaybe: item.computed_fromParentIdMaybe
  };
}
