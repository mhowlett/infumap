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

import { RelationshipToParent } from '../../relationship-to-parent';
import { BoundingBox, cloneBoundingBox } from '../../util/geometry';
import { currentUnixTimeSeconds, panic } from '../../util/lang';
import { newUid, Uid } from '../../util/uid';
import { Item } from './base/item';
import { XSizableItem } from './base/x-sizeable-item';


export interface PageItem extends XSizableItem {
  innerSpatialWidthBl: number;
  naturalAspect: number;
  bgColorIdx: number;

  computed_children: Array<Uid>;
  computed_attachments: Array<Uid>;
  computed_boundsPx: BoundingBox | null,
  computed_fromParentIdMaybe: Uid | null; // when moving.
}

export function isPageItem(item: Item | null): boolean {
  if (item == null) { return false; }
  return item.type == "page";
}

export function asPageItem(item: Item): PageItem {
  if (item.type == "page") { return item as PageItem; }
  panic();
}

export function clonePageItem(item: PageItem): PageItem {
  return {
    type: "page",
    id: item.id,
    parentId: item.parentId,
    relationshipToParent: item.relationshipToParent,
    originalCreationDate: item.originalCreationDate,
    creationDate: item.creationDate,
    lastModifiedDate: item.lastModifiedDate,
    ordering: item.ordering,
    title: item.title,
    spatialPositionBl: item.spatialPositionBl,

    spatialWidthBl: item.spatialWidthBl,

    innerSpatialWidthBl: item.innerSpatialWidthBl,
    naturalAspect: item.naturalAspect,
    bgColorIdx: item.bgColorIdx,

    computed_children: [...item.computed_children],
    computed_attachments: [...item.computed_attachments],
    computed_boundsPx: cloneBoundingBox(item.computed_boundsPx),
    computed_fromParentIdMaybe: item.computed_fromParentIdMaybe
  };
}

export function newPageItem(parentId: Uid, relationshipToParent: RelationshipToParent, title: string, ordering: Uint8Array): PageItem {
  return {
    type: "page",
    id: newUid(),
    parentId,
    relationshipToParent,
    originalCreationDate: currentUnixTimeSeconds(),
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering,
    title,
    spatialPositionBl: { x: 0.0, y: 0.0 },

    spatialWidthBl: 4.0,

    innerSpatialWidthBl: 60.0,
    naturalAspect: 1.6,
    bgColorIdx: 0,

    computed_children: [],
    computed_attachments: [],
    computed_boundsPx: null,
    computed_fromParentIdMaybe: null,
  };
}
