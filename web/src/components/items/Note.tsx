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

import { Component, Show } from "solid-js";
import { BoundingBox } from "../../util/geometry";
import { calcNoteSizeForSpatialBl, NoteItem } from "../../store/items/note-item";
import { GRID_SIZE, LINE_HEIGHT_PX, NOTE_PADDING_PX, RESIZE_BOX_SIZE_PX } from "../../constants";


export const Note: Component<{ item: NoteItem, boundsPx: BoundingBox }> = (props: { item: NoteItem, boundsPx: BoundingBox }) => {
  let outerDiv: HTMLDivElement | undefined;

  let naturalWidthPx = props.item.spatialWidthGr / GRID_SIZE * LINE_HEIGHT_PX;
  let widthScale = props.boundsPx.w / naturalWidthPx;

  let naturalHeightPx = calcNoteSizeForSpatialBl(props.item).h * LINE_HEIGHT_PX;
  let heightScale = props.boundsPx.h / naturalHeightPx

  let scale = Math.min(heightScale, widthScale);

  // console.log("draw note.");
  return (
    <div ref={outerDiv}
         id={props.item.id}
         class={`absolute border border-slate-700 rounded-sm shadow-lg`}
         style={`left: ${props.boundsPx.x}px; top: ${props.boundsPx.y}px; width: ${props.boundsPx.w}px; height: ${props.boundsPx.h}px;`}>
      <div style={`position: absolute; left: 0px; top: ${-LINE_HEIGHT_PX/5}px; width: ${naturalWidthPx}px; ` +
                  `line-height: 24px; transform: scale(${scale}); transform-origin: top left; ` +
                  `overflow-wrap: break-word; padding: ${NOTE_PADDING_PX}px;`}>
        <Show when={props.item.url != null}
              fallback={<span>{props.item.title}</span>}>
          <a href={props.item.url} draggable={false} target="_blank">{props.item.title}</a>
        </Show>
      </div>
      <div class={`absolute opacity-0 cursor-nwse-resize`}
           style={`left: ${props.boundsPx.w-RESIZE_BOX_SIZE_PX}px; top: ${props.boundsPx.h-RESIZE_BOX_SIZE_PX}px; width: ${RESIZE_BOX_SIZE_PX}px; height: ${RESIZE_BOX_SIZE_PX}px;`}></div>
    </div>
  );
}
