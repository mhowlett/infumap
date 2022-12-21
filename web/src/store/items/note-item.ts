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

import { LINE_HEIGHT_PX, NOTE_PADDING_PX } from '../../constants';
import { RelationshipToParent } from '../../relationship-to-parent';
import { cloneBoundingBox, Dimensions } from '../../util/geometry';
import { currentUnixTimeSeconds, panic } from '../../util/lang';
import { newUid, Uid } from '../../util/uid';
import { Item } from './base/item';
import { XSizableItem } from './base/x-sizeable-item';


// TODO: re-imagine this as something more general. note == combination of paragraphs and other things.

export interface NoteItem extends XSizableItem {
  url: string,

  computed_attachments: Array<Uid>,
}

function measureLineCount(s: string, widthBl: number): number {
  const div = document.createElement("div");
  div.setAttribute("style", `line-height: ${LINE_HEIGHT_PX}px; width: ${widthBl*LINE_HEIGHT_PX}px; overflow-wrap: break-word; padding: ${NOTE_PADDING_PX}px;`);
  const txt = document.createTextNode(s);
  div.appendChild(txt);
  document.body.appendChild(div);
  let lineCount = div.offsetHeight / LINE_HEIGHT_PX;
  document.body.removeChild(div);
  return Math.floor(lineCount);
}

export function calcNoteSizeForSpatialBl(item: NoteItem): Dimensions {
  let lineCount = measureLineCount(item.title, item.spatialWidthBl);
  return { w: item.spatialWidthBl, h: lineCount };
}

export function isNoteItem(item: Item | null): boolean {
  if (item == null) { return false; }
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
    creationDate: item.creationDate,
    lastModifiedDate: item.lastModifiedDate,
    ordering: item.ordering,
    title: item.title,
    spatialPositionBl: item.spatialPositionBl,

    spatialWidthBl: item.spatialWidthBl,

    url: item.url,

    computed_attachments: [...item.computed_attachments],
    computed_boundsPx: cloneBoundingBox(item.computed_boundsPx),
    computed_fromParentIdMaybe: item.computed_fromParentIdMaybe
  };
}

export function newNoteItem(parentId: Uid, relationshipToParent: RelationshipToParent, title: string, ordering: Uint8Array): NoteItem {
  return {
    type: "note",
    id: newUid(),
    parentId,
    relationshipToParent,
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering,
    title,
    spatialPositionBl: { x: 0.0, y: 0.0 },

    spatialWidthBl: 4.0,

    url: "",

    computed_attachments: [],
    computed_boundsPx: null,
    computed_fromParentIdMaybe: null,
  };
}

