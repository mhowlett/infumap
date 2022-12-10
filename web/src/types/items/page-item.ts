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

import { Item, Uid } from '../../store/ItemStoreProvider';
import { BoundingBox, cloneBoundingBox } from '../../util/geometry';
import { panic } from '../../util/lang';
import { XSizableItem } from './base/x-sizeable-item';


export interface PageItemComputed {
  children: Array<Uid>;
  attachments: Array<Uid>;
  boundsPx: BoundingBox | null,
  fromParentIdMaybe: Uid | null; // when moving.
}

export function defaultPageItemComputed(): PageItemComputed {
  return {
    children: [],
    attachments: [],
    boundsPx: null,
    fromParentIdMaybe: null
  };
}

export interface PageItem extends XSizableItem {
  computed: PageItemComputed;

  innerSpatialWidthBl: number;
  naturalAspect: number;
  bgColor: number;
}

export function isPageItem(item: Item): boolean {
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
    bgColor: item.bgColor,

    computed: {
      children: [...item.computed.children],
      attachments: [...item.computed.attachments],
      boundsPx: cloneBoundingBox(item.computed.boundsPx),
      fromParentIdMaybe: item.computed.fromParentIdMaybe
    }
  };
}
