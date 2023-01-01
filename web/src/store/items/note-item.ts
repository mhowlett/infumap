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

import { GRID_SIZE, LINE_HEIGHT_PX, NOTE_PADDING_PX, RESIZE_BOX_SIZE_PX } from '../../constants';
import { HitboxType } from '../../hitbox';
import { ItemGeometry } from '../../item-geometry';
import { BoundingBox, Dimensions } from '../../util/geometry';
import { currentUnixTimeSeconds, panic } from '../../util/lang';
import { newUid, Uid } from '../../util/uid';
import { AttachmentsItem } from './base/attachments-item';
import { Item } from './base/item';
import { XSizableItem } from './base/x-sizeable-item';


// TODO: re-imagine this as something more general. note == combination of paragraphs and other things.

export interface NoteItem extends XSizableItem, AttachmentsItem {
  url: string,
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

export function calcGeometryOfNoteItem(item: NoteItem, containerBoundsPx: BoundingBox, containerInnerSizeCo: Dimensions, level: number): ItemGeometry {
  const boundsPx = {
    x: (item.spatialPositionBl.x * GRID_SIZE / containerInnerSizeCo.w) * containerBoundsPx.w + containerBoundsPx.x,
    y: (item.spatialPositionBl.y * GRID_SIZE / containerInnerSizeCo.h) * containerBoundsPx.h + containerBoundsPx.y,
    w: calcNoteSizeForSpatialBl(item).w * GRID_SIZE / containerInnerSizeCo.w * containerBoundsPx.w,
    h: calcNoteSizeForSpatialBl(item).h * GRID_SIZE / containerInnerSizeCo.h * containerBoundsPx.h,
  };
  return {
    itemId: item.id,
    boundsPx,
    hitboxes: level != 1 ? [] : [
      { type: HitboxType.Move, boundsPx },
      { type: HitboxType.Resize,
        boundsPx: { x: boundsPx.x + boundsPx.w - RESIZE_BOX_SIZE_PX, y: boundsPx.y + boundsPx.h - RESIZE_BOX_SIZE_PX,
                    w: RESIZE_BOX_SIZE_PX, h: RESIZE_BOX_SIZE_PX } }
    ],
    level
  }
}

export function isNoteItem(item: Item | null): boolean {
  if (item == null) { return false; }
  return item.itemType == "note";
}

export function asNoteItem(item: Item): NoteItem {
  if (item.itemType == "note") { return item as NoteItem; }
  panic();
}

export function cloneNoteItem(item: NoteItem): NoteItem {
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
    spatialPositionBl: item.spatialPositionBl,

    spatialWidthBl: item.spatialWidthBl,

    url: item.url,

    computed_attachments: [...item.computed_attachments],
    computed_fromParentIdMaybe: item.computed_fromParentIdMaybe
  };
}

export function newNoteItem(ownerId: Uid, parentId: Uid, relationshipToParent: string, title: string, ordering: Uint8Array): NoteItem {
  return {
    itemType: "note",
    ownerId,
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
    computed_fromParentIdMaybe: null,
  };
}
