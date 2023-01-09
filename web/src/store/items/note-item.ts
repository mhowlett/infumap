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
import { BoundingBox, cloneVector, Dimensions } from '../../util/geometry';
import { currentUnixTimeSeconds, panic } from '../../util/lang';
import { newUid, Uid } from '../../util/uid';
import { AttachmentsItem } from './base/attachments-item';
import { Item } from './base/item';
import { TitledItem } from './base/titled-item';
import { XSizableItem } from './base/x-sizeable-item';


// TODO: re-imagine this as something more general. note == combination of paragraphs and other things.

export interface NoteItem extends XSizableItem, AttachmentsItem, TitledItem {
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
  let lineCount = measureLineCount(item.title, item.spatialWidthGr / GRID_SIZE);
  return { w: item.spatialWidthGr / GRID_SIZE, h: lineCount };
}

export function calcGeometryOfNoteItem(item: NoteItem, containerBoundsPx: BoundingBox, containerInnerSizeBl: Dimensions, level: number): ItemGeometry {
  const boundsPx = {
    x: (item.spatialPositionGr.x / (containerInnerSizeBl.w * GRID_SIZE)) * containerBoundsPx.w + containerBoundsPx.x,
    y: (item.spatialPositionGr.y / (containerInnerSizeBl.h * GRID_SIZE)) * containerBoundsPx.h + containerBoundsPx.y,
    w: calcNoteSizeForSpatialBl(item).w / containerInnerSizeBl.w * containerBoundsPx.w,
    h: calcNoteSizeForSpatialBl(item).h / containerInnerSizeBl.h * containerBoundsPx.h,
  };
  return {
    item,
    boundsPx,
    hitboxes: level != 1 ? [] : [
      { type: HitboxType.Move, boundsPx },
      { type: HitboxType.Resize,
        boundsPx: { x: boundsPx.x + boundsPx.w - RESIZE_BOX_SIZE_PX, y: boundsPx.y + boundsPx.h - RESIZE_BOX_SIZE_PX,
                    w: RESIZE_BOX_SIZE_PX, h: RESIZE_BOX_SIZE_PX } }
    ],
    level,
  }
}

export function calcGeometryOfNoteItemInTable(item: NoteItem, blockSizePx: Dimensions, rowWidthBl: number, index: number, level: number): ItemGeometry {
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
    spatialPositionGr: cloneVector(item.spatialPositionGr)!,

    spatialWidthGr: item.spatialWidthGr,

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
    spatialPositionGr: { x: 0.0, y: 0.0 },

    spatialWidthGr: 4.0 * GRID_SIZE,

    url: "",

    computed_attachments: [],
    computed_fromParentIdMaybe: null,
  };
}
