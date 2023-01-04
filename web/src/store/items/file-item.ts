/*
  Copyright (C) 2023 Matt Howlett
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
import { XSizableItem } from './base/x-sizeable-item';
import { EncryptableItem } from "./base/encryptable-item";


export interface FileItem extends XSizableItem, AttachmentsItem, EncryptableItem {
  originalCreationDate: number,
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

export function calcFileSizeForSpatialBl(item: FileItem): Dimensions {
  let lineCount = measureLineCount(item.title, item.spatialWidthGr / GRID_SIZE);
  return { w: item.spatialWidthGr / GRID_SIZE, h: lineCount };
}

export function calcGeometryOfFileItem(item: FileItem, containerBoundsPx: BoundingBox, containerInnerSizeBl: Dimensions, level: number): ItemGeometry {
  const boundsPx = {
    x: (item.spatialPositionGr.x / (containerInnerSizeBl.w * GRID_SIZE)) * containerBoundsPx.w + containerBoundsPx.x,
    y: (item.spatialPositionGr.y / (containerInnerSizeBl.h * GRID_SIZE)) * containerBoundsPx.h + containerBoundsPx.y,
    w: calcFileSizeForSpatialBl(item).w / containerInnerSizeBl.w * containerBoundsPx.w,
    h: calcFileSizeForSpatialBl(item).h / containerInnerSizeBl.h * containerBoundsPx.h,
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
    level,
  }
}

export function calcGeometryOfFileItemInTable(item: FileItem, blockSizePx: Dimensions, rowWidthBl: number, index: number, level: number): ItemGeometry {
  const boundsPx = {
    x: 0.0,
    y: blockSizePx.h * index,
    w: blockSizePx.w * rowWidthBl,
    h: blockSizePx.h
  };
  return {
    itemId: item.id,
    boundsPx,
    hitboxes: [],
    level
  };
}

export function isFileItem(item: Item | null): boolean {
  if (item == null) { return false; }
  return item.itemType == "file";
}

export function asFileItem(item: Item): FileItem {
  if (item.itemType == "file") { return item as FileItem; }
  panic();
}

export function cloneFileItem(item: FileItem): FileItem {
  return {
    itemType: "file",
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

    passwordName: item.passwordName,

    originalCreationDate: item.originalCreationDate,

    computed_attachments: [...item.computed_attachments],
    computed_fromParentIdMaybe: item.computed_fromParentIdMaybe
  };
}

export function newFileItem(ownerId: Uid, parentId: Uid, relationshipToParent: string, title: string, ordering: Uint8Array): FileItem {
  return {
    itemType: "file",
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

    passwordName: null,

    originalCreationDate: 0,

    computed_attachments: [],
    computed_fromParentIdMaybe: null,
  };
}
