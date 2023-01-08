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

import { Component } from "solid-js";
import { BoundingBox } from "../../util/geometry";
import { calcFileSizeForSpatialBl, FileItem } from "../../store/items/file-item";
import { GRID_SIZE, LINE_HEIGHT_PX, NOTE_PADDING_PX } from "../../constants";
import { TableItem } from "../../store/items/table-item";


export const File: Component<{ item: FileItem, boundsPx: BoundingBox }> = (props: { item: FileItem, boundsPx: BoundingBox }) => {
  let outerDiv: HTMLDivElement | undefined;

  let naturalWidthPx = props.item.spatialWidthGr / GRID_SIZE * LINE_HEIGHT_PX;
  let widthScale = props.boundsPx.w / naturalWidthPx;

  let naturalHeightPx = calcFileSizeForSpatialBl(props.item).h * LINE_HEIGHT_PX;
  let heightScale = props.boundsPx.h / naturalHeightPx

  let scale = Math.min(heightScale, widthScale);

  const clickHandler = () => { window.location.href = "/blob/" + props.item.id }

  return (
    <div ref={outerDiv}
         id={props.item.id}
         class={`absolute border border-slate-700 rounded-sm shadow-lg`}
         style={`left: ${props.boundsPx.x}px; top: ${props.boundsPx.y}px; width: ${props.boundsPx.w}px; height: ${props.boundsPx.h}px;`}>
      <div style={`position: absolute; left: 0px; top: ${-LINE_HEIGHT_PX/5}px; width: ${naturalWidthPx}px; ` +
                  `line-height: ${LINE_HEIGHT_PX}px; transform: scale(${scale}); transform-origin: top left; ` +
                  `overflow-wrap: break-word; padding: ${NOTE_PADDING_PX}px;`}>
        <span class="text-green-800 cursor-pointer" onclick={clickHandler}>{props.item.title}</span>
      </div>
    </div>
  );
}

export const FileInTable: Component<{ item: FileItem, parentTable: TableItem, boundsPx: BoundingBox }> = (props: { item: FileItem, parentTable: TableItem, boundsPx: BoundingBox }) => {
  let scale = props.boundsPx.h / LINE_HEIGHT_PX;
  let widthBl = props.parentTable.spatialWidthGr / GRID_SIZE;
  let oneBlockWidthPx = props.boundsPx.w / widthBl;

  const clickHandler = () => { window.location.href = "/blob/" + props.item.id }

  return (
    <>
    <div class="absolute"
         style={`left: ${props.boundsPx.x}px; top: ${props.boundsPx.y}px; width: ${oneBlockWidthPx}px; height: ${props.boundsPx.h}px; `}>
      <div class="text-center" style={`line-height: ${LINE_HEIGHT_PX - 4}px; transform: scale(${scale}); transform-origin: center center;`}>
        <i class={`fas fa-file`} />
      </div>
    </div>
    <div class="absolute overflow-hidden"
         style={`left: ${props.boundsPx.x + oneBlockWidthPx}px; top: ${props.boundsPx.y}px; width: ${props.boundsPx.w - oneBlockWidthPx}px; height: ${props.boundsPx.h}px; `}>
      <div style={`line-height: ${LINE_HEIGHT_PX}px; transform: scale(${scale}); transform-origin: top left;`}>
        <span class="text-green-800 cursor-pointer" onclick={clickHandler}>{props.item.title}</span>
      </div>
    </div>
    </>
  );
}
