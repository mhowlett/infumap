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

import { GRID_SIZE } from '../../constants';
import { HitboxType } from '../../hitbox';
import { ItemGeometry } from '../../item-geometry';
import { BoundingBox, cloneVector, Dimensions } from '../../util/geometry';
import { panic } from '../../util/lang';
import { Item } from './base/item';


export interface RatingItem extends Item {
  rating: number,
}

export function calcRatingSizeForSpatialBl(_item: RatingItem): Dimensions {
  return { w: 1.0, h: 1.0 };
}

export function calcGeometryOfRatingItem(item: RatingItem, containerBoundsPx: BoundingBox, containerInnerSizeBl: Dimensions, level: number): ItemGeometry {
  const boundsPx = {
    x: (item.spatialPositionGr.x / (containerInnerSizeBl.w * GRID_SIZE)) * containerBoundsPx.w + containerBoundsPx.x,
    y: (item.spatialPositionGr.y / (containerInnerSizeBl.h * GRID_SIZE)) * containerBoundsPx.h + containerBoundsPx.y,
    w: calcRatingSizeForSpatialBl(item).w / containerInnerSizeBl.w * containerBoundsPx.w,
    h: calcRatingSizeForSpatialBl(item).h / containerInnerSizeBl.h * containerBoundsPx.h,
  };
  return {
    item,
    boundsPx,
    hitboxes: [],
    level,
  }
}

export function calcGeometryOfRatingItemInTable(item: RatingItem, blockSizePx: Dimensions, rowWidthBl: number, index: number, level: number): ItemGeometry {
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
    level
  };
}

export function isRatingItem(item: Item | null): boolean {
  if (item == null) { return false; }
  return item.itemType == "rating";
}

export function asRatingItem(item: Item): RatingItem {
  if (item.itemType == "rating") { return item as RatingItem; }
  panic();
}

export function cloneRatingItem(item: RatingItem): RatingItem {
  return {
    itemType: "rating",
    ownerId: item.ownerId,
    id: item.id,
    parentId: item.parentId,
    relationshipToParent: item.relationshipToParent,
    creationDate: item.creationDate,
    lastModifiedDate: item.lastModifiedDate,
    ordering: item.ordering,
    spatialPositionGr: cloneVector(item.spatialPositionGr)!,

    rating: item.rating,

    computed_fromParentIdMaybe: item.computed_fromParentIdMaybe
  };
}
