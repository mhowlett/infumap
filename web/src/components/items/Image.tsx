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
import { GRID_SIZE, LINE_HEIGHT_PX } from "../../constants";
import { ItemGeometry } from "../../item-geometry";
import { ImageItem } from "../../store/items/image-item";
import { TableItem } from "../../store/items/table-item";
import { BoundingBox } from "../../util/geometry";


export const Image: Component<{itemGeometry: ItemGeometry}> = (props: {itemGeometry: ItemGeometry}) => {
  let { item, boundsPx } = props.itemGeometry;

  return (
    <div id={item.id}
         class="absolute border border-slate-700 rounded-sm shadow-lg"
         style={`left: ${boundsPx.x}px; top: ${boundsPx.y}px; width: ${boundsPx.w}px; height: ${boundsPx.h}px;`}>
      <img style={`left: ${boundsPx.x}px; top: ${boundsPx.y}px; width: ${boundsPx.w}px; height: ${boundsPx.h}px;`}
           src={"/files/" + item.id} />
    </div>
  );
}


export const ImageInTable: Component<{ item: ImageItem, parentTable: TableItem, boundsPx: BoundingBox }> = (props: { item: ImageItem, parentTable: TableItem, boundsPx: BoundingBox }) => {
  let scale = props.boundsPx.h / LINE_HEIGHT_PX;
  let widthBl = props.parentTable.spatialWidthGr / GRID_SIZE;
  let oneBlockWidthPx = props.boundsPx.w / widthBl;

  return (
    <>
    <div class="absolute"
         style={`left: ${props.boundsPx.x}px; top: ${props.boundsPx.y}px; width: ${oneBlockWidthPx}px; height: ${props.boundsPx.h}px; `}>
      <div class="text-center" style={`line-height: ${LINE_HEIGHT_PX - 4}px; transform: scale(${scale}); transform-origin: center center;`}>
        <i class={`fas fa-image`} />
      </div>
    </div>
    <div class="absolute overflow-hidden"
         style={`left: ${props.boundsPx.x + oneBlockWidthPx}px; top: ${props.boundsPx.y}px; width: ${props.boundsPx.w - oneBlockWidthPx}px; height: ${props.boundsPx.h}px; `}>
      <div style={`line-height: ${LINE_HEIGHT_PX}px; transform: scale(${scale}); transform-origin: top left;`}>
        { props.item.title }
      </div>
    </div>
    </>
  );
}
