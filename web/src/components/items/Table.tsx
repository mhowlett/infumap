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
import { GRID_SIZE, LINE_HEIGHT_PX, RESIZE_BOX_SIZE_PX } from "../../constants";
import { TableItem } from "../../store/items/table-item";
import { BoundingBox } from "../../util/geometry";


export const Table: Component<{ item: TableItem, boundsPx: BoundingBox }> = (props: { item: TableItem, boundsPx: BoundingBox }) => {
  let sizeBl = { x: props.item.spatialWidthGr / GRID_SIZE, y: props.item.spatialHeightGr / GRID_SIZE };
  let blockSizePx = { x: props.boundsPx.w / sizeBl.x, y: props.boundsPx.h / sizeBl.y };
  let headerHeightPx = blockSizePx.y * 1.5;

  return (
    <div id={props.item.id}
         class="absolute"
         style={`left: ${props.boundsPx.x}px; top: ${props.boundsPx.y}px; width: ${props.boundsPx.w}px; height: ${props.boundsPx.h}px;`}>
      <div class="absolute"
           style={`left: 0px; top: 0px; width: ${props.boundsPx.w}px; height: ${headerHeightPx}px;`}>
        {props.item.title}
      </div>
      <div class={`absolute border border-slate-700 rounded-sm shadow-lg`}
           style={`left: 0px; top: ${headerHeightPx}px; width: ${props.boundsPx.w}px; height: ${props.boundsPx.h - headerHeightPx}px;`}>
      </div>
    </div>
  );
}

export const TableInTable: Component<{ item: TableItem, parentTable: TableItem, boundsPx: BoundingBox }> = (props: { item: TableItem, parentTable: TableItem, boundsPx: BoundingBox }) => {
  let scale = props.boundsPx.h / LINE_HEIGHT_PX;
  let widthBl = props.parentTable.spatialWidthGr / GRID_SIZE;
  let oneBlockWidthPx = props.boundsPx.w / widthBl;
  return (
    <div class="absolute overflow-hidden"
         style={`left: ${props.boundsPx.x + oneBlockWidthPx}px; top: ${props.boundsPx.y}px; width: ${props.boundsPx.w - oneBlockWidthPx}px; height: ${props.boundsPx.h}px; `}>
      <div class="absolute"
           style={`line-height: ${LINE_HEIGHT_PX}px; transform: scale(${scale}); transform-origin: top left;`}>
        { props.item.title }
      </div>
    </div>
  );
}
