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
import { BoundingBox } from '../../util/geometry';
import { panic } from '../../util/lang';
import { XSizableItem } from './base/x-sizeable-item';


// TODO: re-imagine this as something more general. note == combination of paragraphs and other things.

export interface NoteItemComputed {
  attachments: Array<Uid>,
  fromParentIdMaybe: Uid | null // when moving.
}

export function defaultNoteItemComputed(): NoteItemComputed {
  return {
    attachments: [],
    fromParentIdMaybe: null
  };
}

export interface NoteItem extends XSizableItem {
  computed: NoteItemComputed,

  text: string,
  url: string,
  hasFacIcon: boolean
}

export function isNoteItem(item: Item): boolean {
  return item.type == "note";
}

export function asNoteItem(item: Item): NoteItem {
  if (item.type == "note") { return item as NoteItem; }
  panic();
}
