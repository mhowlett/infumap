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
import { RatingItem } from "../../store/items/rating-item";
import { GRID_SIZE } from "../../constants";
import { TableItem } from "../../store/items/table-item";


export const Rating: Component<{ item: RatingItem, boundsPx: BoundingBox }> = (props: { item: RatingItem, boundsPx: BoundingBox }) => {
  let outerDiv: HTMLDivElement | undefined;

  return (
    <div ref={outerDiv}
         id={props.item.id}
         class={`absolute border border-slate-700 rounded-sm shadow-lg`}
         style={`left: ${props.boundsPx.x}px; top: ${props.boundsPx.y}px; width: ${props.boundsPx.w}px; height: ${props.boundsPx.h}px;`}>
      <i class={`fas fa-star text-yellow-400`} />
    </div>
  );
}

export const RatingInTable: Component<{ item: RatingItem, parentTable: TableItem, boundsPx: BoundingBox }> = (props: { item: RatingItem, parentTable: TableItem, boundsPx: BoundingBox }) => {
  let widthBl = props.parentTable.spatialWidthGr / GRID_SIZE;
  let oneBlockWidthPx = props.boundsPx.w / widthBl;

  return (
    <div class="absolute"
         style={`left: ${props.boundsPx.x}px; top: ${props.boundsPx.y}px; width: ${oneBlockWidthPx}px; height: ${props.boundsPx.h}px; `}>
      <i class={`fas fa-star text-yellow-400`} />
    </div>
  );
}
