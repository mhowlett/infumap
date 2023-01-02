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
import { GRID_SIZE, RESIZE_BOX_SIZE_PX } from "../../constants";
import { TableItem } from "../../store/items/table-item";
import { useLayoutStore } from "../../store/LayoutStoreProvider";
import { BoundingBox } from "../../util/geometry";

export const Table: Component<{ item: TableItem, boundsPx: BoundingBox }> = (props: { item: TableItem, boundsPx: BoundingBox }) => {
  const layoutStore = useLayoutStore();

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
        <div class={`absolute opacity-0 cursor-nwse-resize`}
             style={`left: ${props.boundsPx.w-RESIZE_BOX_SIZE_PX}px; top: ${props.boundsPx.h-RESIZE_BOX_SIZE_PX}px; width: ${RESIZE_BOX_SIZE_PX}px; height: ${RESIZE_BOX_SIZE_PX}px;`}>
        </div>
      </div>
    </div>
  );
}
