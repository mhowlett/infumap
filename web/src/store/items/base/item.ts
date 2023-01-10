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

import { ItemGeometry } from '../../../item-geometry';
import { BoundingBox, Dimensions, Vector } from '../../../util/geometry';
import { throwExpression } from '../../../util/lang';
import { Uid } from '../../../util/uid';
import { asFileItem, calcFileSizeForSpatialBl, calcGeometryOfFileItem, calcGeometryOfFileItemInTable, cloneFileItem, isFileItem } from '../file-item';
import { asImageItem, calcGeometryOfImageItem, calcGeometryOfImageItemInTable, calcImageSizeForSpatialBl, cloneImageItem, isImageItem } from '../image-item';
import { asNoteItem, calcGeometryOfNoteItem, calcGeometryOfNoteItemInTable, calcNoteSizeForSpatialBl, cloneNoteItem, isNoteItem } from '../note-item';
import { asPageItem, calcGeometryOfPageItem, calcGeometryOfPageItemInTable, calcPageSizeForSpatialBl, clonePageItem, isPageItem } from '../page-item';
import { asRatingItem, calcGeometryOfRatingItem, calcGeometryOfRatingItemInTable, calcRatingSizeForSpatialBl, cloneRatingItem, isRatingItem } from '../rating-item';
import { asTableItem, calcGeometryOfTableItem, calcGeometryOfTableItemInTable, calcTableSizeForSpatialBl, cloneTableItem, isTableItem } from '../table-item';


export interface Item {
  itemType: string,
  ownerId: Uid,
  id: Uid,
  parentId: Uid | null,
  relationshipToParent: string,
  creationDate: number,
  lastModifiedDate: number,
  ordering: Uint8Array,
  spatialPositionGr: Vector,

  computed_fromParentIdMaybe: Uid | null, // when moving.
}

export function cloneItem(item: Item): Item {
  if (isPageItem(item)) { return clonePageItem(asPageItem(item)); }
  if (isTableItem(item)) { return cloneTableItem(asTableItem(item)); }
  if (isNoteItem(item)) { return cloneNoteItem(asNoteItem(item)); }
  if (isImageItem(item)) { return cloneImageItem(asImageItem(item)); }
  if (isFileItem(item)) { return cloneFileItem(asFileItem(item)); }
  if (isRatingItem(item)) { return cloneRatingItem(asRatingItem(item)); }
  throwExpression(`Unknown item type: ${item.itemType}`);
}

export function calcSizeForSpatialBl(item: Item): Dimensions {
  if (isPageItem(item)) { return calcPageSizeForSpatialBl(asPageItem(item)); }
  if (isTableItem(item)) { return calcTableSizeForSpatialBl(asTableItem(item)); }
  if (isNoteItem(item)) { return calcNoteSizeForSpatialBl(asNoteItem(item)); }
  if (isImageItem(item)) { return calcImageSizeForSpatialBl(asImageItem(item)); }
  if (isFileItem(item)) { return calcFileSizeForSpatialBl(asFileItem(item)); }
  if (isRatingItem(item)) { return calcRatingSizeForSpatialBl(asRatingItem(item)); }
  throwExpression(`Unknown item type: ${item.itemType}`);
}

export function calcGeometryOfItemInPage(item: Item, containerBoundsPx: BoundingBox, containerInnerSizeBl: Dimensions, emitHitboxes: boolean): ItemGeometry {
  if (isPageItem(item)) { return calcGeometryOfPageItem(asPageItem(item), containerBoundsPx, containerInnerSizeBl, emitHitboxes); }
  if (isTableItem(item)) { return calcGeometryOfTableItem(asTableItem(item), containerBoundsPx, containerInnerSizeBl, emitHitboxes); }
  if (isNoteItem(item)) { return calcGeometryOfNoteItem(asNoteItem(item), containerBoundsPx, containerInnerSizeBl, emitHitboxes); }
  if (isImageItem(item)) { return calcGeometryOfImageItem(asImageItem(item), containerBoundsPx, containerInnerSizeBl, emitHitboxes); }
  if (isFileItem(item)) { return calcGeometryOfFileItem(asFileItem(item), containerBoundsPx, containerInnerSizeBl, emitHitboxes); }
  if (isRatingItem(item)) { return calcGeometryOfRatingItem(asRatingItem(item), containerBoundsPx, containerInnerSizeBl, emitHitboxes); }
  throwExpression(`Unknown item type: ${item.itemType}`);
}

export function calcGeometryOfItemInTable(item: Item, blockSizePx: Dimensions, rowWidthBl: number, index: number): ItemGeometry {
  if (isPageItem(item)) { return calcGeometryOfPageItemInTable(asPageItem(item), blockSizePx, rowWidthBl, index); }
  if (isTableItem(item)) { return calcGeometryOfTableItemInTable(asTableItem(item), blockSizePx, rowWidthBl, index); }
  if (isNoteItem(item)) { return calcGeometryOfNoteItemInTable(asNoteItem(item), blockSizePx, rowWidthBl, index); }
  if (isImageItem(item)) { return calcGeometryOfImageItemInTable(asImageItem(item), blockSizePx, rowWidthBl, index); }
  if (isFileItem(item)) { return calcGeometryOfFileItemInTable(asFileItem(item), blockSizePx, rowWidthBl, index); }
  if (isRatingItem(item)) { return calcGeometryOfRatingItemInTable(asRatingItem(item), blockSizePx, rowWidthBl, index); }
  throwExpression(`Unknown item type: ${item.itemType}`);
}

export function setFromParentId(item: Item, fromParentId: Uid): void {
  item.computed_fromParentIdMaybe = fromParentId;
}
