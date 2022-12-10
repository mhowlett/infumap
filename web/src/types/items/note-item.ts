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

import { Item, Uid } from '../../store/items';
import { BoundingBox, cloneBoundingBox } from '../../util/geometry';
import { panic } from '../../util/lang';
import { XSizableItem } from './base/x-sizeable-item';


// TODO: re-imagine this as something more general. note == combination of paragraphs and other things.

export interface NoteItemComputed {
  attachments: Array<Uid>,
  boundsPx: BoundingBox | null,
  fromParentIdMaybe: Uid | null // when moving.
}

export function defaultNoteItemComputed(): NoteItemComputed {
  return {
    attachments: [],
    boundsPx: null,
    fromParentIdMaybe: null
  };
}

export interface NoteItem extends XSizableItem {
  computed: NoteItemComputed,

  text: string,
  url: string,
  hasFavIcon: boolean
}

export function isNoteItem(item: Item): boolean {
  return item.type == "note";
}

export function asNoteItem(item: Item): NoteItem {
  if (item.type == "note") { return item as NoteItem; }
  panic();
}

export function cloneNoteItem(item: NoteItem): NoteItem {
  return {
    type: "note",
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

    text: item.text,
    url: item.url,
    hasFavIcon: item.hasFavIcon,

    computed: {
      attachments: [...item.computed.attachments],
      boundsPx: cloneBoundingBox(item.computed.boundsPx),
      fromParentIdMaybe: item.computed.fromParentIdMaybe
    }
  };
}
