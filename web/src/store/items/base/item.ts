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

import { GRID_SIZE } from '../../../constants';
import { BoundingBox, Dimensions, Vector } from '../../../util/geometry';
import { throwExpression } from '../../../util/lang';
import { Uid } from '../../../util/uid';
import { asNoteItem, calcNoteSizeForSpatialBl, cloneNoteItem, isNoteItem } from '../note-item';
import { asPageItem, calcPageSizeForSpatialBl, clonePageItem, isPageItem } from '../page-item';


export interface Item {
  itemType: string,
  ownerId: Uid,
  id: Uid,
  parentId: Uid | null,
  relationshipToParent: string,
  creationDate: number,
  lastModifiedDate: number,
  ordering: Uint8Array,
  title: string,
  spatialPositionBl: Vector,

  computed_boundsPx: BoundingBox | null,
  computed_fromParentIdMaybe: Uid | null // when moving.
}

export function cloneItem(item: Item): Item {
  if (isPageItem(item)) { return clonePageItem(asPageItem(item)); }
  if (isNoteItem(item)) { return cloneNoteItem(asNoteItem(item)); }
  throwExpression(`Unknown item type: ${item.itemType}`);
}

export function calcSizeForSpatialBl(item: Item): Dimensions {
  if (isPageItem(item)) { return calcPageSizeForSpatialBl(asPageItem(item)); }
  if (isNoteItem(item)) { return calcNoteSizeForSpatialBl(asNoteItem(item)); }
  throwExpression(`Unknown item type: ${item.itemType}`);
}

export function updateBounds(item: Item, containerBoundsPx: BoundingBox, containerInnerSizeCo: Dimensions): void {
  item.computed_boundsPx = {
    x: (item.spatialPositionBl.x * GRID_SIZE / containerInnerSizeCo.w) * containerBoundsPx.w + containerBoundsPx.x,
    y: (item.spatialPositionBl.y * GRID_SIZE / containerInnerSizeCo.h) * containerBoundsPx.h + containerBoundsPx.y,
    w: calcSizeForSpatialBl(item).w * GRID_SIZE / containerInnerSizeCo.w * containerBoundsPx.w,
    h: calcSizeForSpatialBl(item).h * GRID_SIZE / containerInnerSizeCo.h * containerBoundsPx.h,
  }
}

export function setFromParentId(item: Item, fromParentId: Uid): void {
  item.computed_fromParentIdMaybe = fromParentId;
}
