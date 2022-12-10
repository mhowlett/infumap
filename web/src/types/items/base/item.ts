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

import { RelationshipToParent } from '../../../relationship-to-parent';
import { Uid } from '../../../store/ItemStoreProvider';
import { BoundingBox, Dimensions, Vector } from '../../../util/geometry';
import { throwExpression } from '../../../util/lang';
import { asNoteItem, cloneNoteItem, isNoteItem } from '../note-item';
import { asPageItem, clonePageItem, isPageItem } from '../page-item';


export interface Item {
  type: string,
  id: Uid,
  parentId: Uid | null,
  relationshipToParent: RelationshipToParent,
  originalCreationDate: number,
  creationDate: number,
  lastModifiedDate: number,
  ordering: Uint8Array,
  title: string,
  spatialPositionBl: Vector
}

export function cloneItem(item: Item): Item {
  if (isPageItem(item)) { return clonePageItem(asPageItem(item)); }
  if (isNoteItem(item)) { return cloneNoteItem(asNoteItem(item)); }
  throwExpression(`Unknown item type: ${item.type}`);
}

// TODO (HIGH): movable interface type to remove need for some of these cases.

export function updateBounds(item: Item, containerBoundsPx: BoundingBox, containerInnerSizeCo: Dimensions): void {
  const gridSize = 60.0;
  if (isPageItem(item)) {
    let pageItem = asPageItem(item);
    pageItem.computed.boundsPx = {
      x: (pageItem.spatialPositionBl.x * gridSize / containerInnerSizeCo.w) * containerBoundsPx.w + containerBoundsPx.x,
      y: (pageItem.spatialPositionBl.y * gridSize / containerInnerSizeCo.h) * containerBoundsPx.h + containerBoundsPx.y,
      w: (pageItem.spatialWidthBl * gridSize / containerInnerSizeCo.w) * containerBoundsPx.w,
      h: (Math.floor(pageItem.spatialWidthBl / pageItem.naturalAspect) * gridSize / containerInnerSizeCo.h) * containerBoundsPx.h
    }
  } else if (isNoteItem(item)) {
    let noteItem = asNoteItem(item);
    noteItem.computed.boundsPx = {
      x: (noteItem.spatialPositionBl.x * gridSize / containerInnerSizeCo.w) * containerBoundsPx.w + containerBoundsPx.x,
      y: (noteItem.spatialPositionBl.y * gridSize / containerInnerSizeCo.h) * containerBoundsPx.h + containerBoundsPx.y,
      w: (noteItem.spatialWidthBl * gridSize / containerInnerSizeCo.w) * containerBoundsPx.w,
      h: (1.0 * gridSize / containerInnerSizeCo.h) * containerBoundsPx.h
    }
  } else {
    throwExpression(`Unknown item type: ${item.type}`);
  }
}

export function setFromParentId(item: Item, fromParentId: Uid): void {
  if (isPageItem(item)) {
    let pageItem = asPageItem(item);
    pageItem.computed.fromParentIdMaybe = fromParentId;
  } else if (isNoteItem(item)) {
    let noteItem = asNoteItem(item);
    noteItem.computed.fromParentIdMaybe = fromParentId;
  } else {
    throwExpression(`unnown item type: ${item.type}`);
  }
}