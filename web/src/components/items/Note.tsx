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
import { add, clientPosVector, subtract, Vector } from "../../util/geometry";
import { useItemStore } from "../../store/ItemStoreProvider";
import { calcNoteSizeForSpatialBl, NoteItem } from "../../store/items/note-item";
import { GRID_SIZE, LINE_HEIGHT_PX, NOTE_PADDING_PX, RESIZE_BOX_SIZE } from "../../constants";
import { asNoteItem } from "../../store/items/note-item";
import { useUserStore } from "../../store/UserStoreProvider";
import { server } from "../../server";


export const Note: Component<{ item: NoteItem }> = (props: { item: NoteItem }) => {
  const userStore = useUserStore();
  const itemStore = useItemStore();

  let outerDiv: HTMLDivElement | undefined;

  let startPx: Vector | null;
  let startPosBl: Vector | null;
  let startWidthBl: number | null;

  let moving = () => { return startPosBl != null; }

  let mouseDownHandler = (ev: MouseEvent) => {
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    let rect = outerDiv!.getBoundingClientRect();
    startPx = clientPosVector(ev);
    if (rect.right - startPx.x < RESIZE_BOX_SIZE && rect.bottom - startPx.y < RESIZE_BOX_SIZE) {
      startPosBl = null;
      startWidthBl = props.item.spatialWidthBl;
    } else {
      startWidthBl = null;
      startPosBl = props.item.spatialPositionBl;
      itemStore.transitionToMove(props.item.id);
    }
  };

  let mouseMoveHandler = (ev: MouseEvent) => {
    if (startPx == null) { return; }

    let deltaPx = subtract(clientPosVector(ev), startPx);
    let deltaBl = { x: NaN, y: NaN };

    let wPx = props.item.computed_boundsPx!.w;
    let wCo = props.item.spatialWidthBl * GRID_SIZE;
    deltaBl.x = deltaPx.x * (wCo / GRID_SIZE) / wPx;

    let hPx = props.item.computed_boundsPx!.h;
    let hCo = calcNoteSizeForSpatialBl(props.item).h * GRID_SIZE;
    deltaBl.y = deltaPx.y * (hCo / GRID_SIZE) / hPx;

    if (moving()) {
      let newPosBl = add(startPosBl!, deltaBl);
      newPosBl.x = Math.round(newPosBl.x * 2.0) / 2.0;
      newPosBl.y = Math.round(newPosBl.y * 2.0) / 2.0;
      if (newPosBl.x < 0.0) { newPosBl.x = 0.0; }
      if (newPosBl.y < 0.0) { newPosBl.y = 0.0; }
      itemStore.updateItem(props.item.id, item => { item.spatialPositionBl = newPosBl; });
    } else {
      let newWidthBl = startWidthBl! + deltaBl.x;
      newWidthBl = Math.round(newWidthBl * 2.0) / 2.0;
      if (newWidthBl < 1) { newWidthBl = 1.0; }
      itemStore.updateItem(props.item.id, item => { asNoteItem(item).spatialWidthBl = newWidthBl; });
    }
  };

  let mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    if (moving()) {
      itemStore.transitionMovingToFixed();
    }
    server.updateItem(userStore.user, itemStore.getItem(props.item.id)!);
    startPx = null;
    startPosBl = null;
    startWidthBl = null;
  };

  let lPx = props.item.computed_boundsPx!.x;
  let tPx = props.item.computed_boundsPx!.y;
  let wPx = props.item.computed_boundsPx!.w;
  let hPx = props.item.computed_boundsPx!.h;

  let naturalWidthPx = props.item.spatialWidthBl * LINE_HEIGHT_PX;
  let widthScale = wPx / naturalWidthPx;

  let naturalHeightPx = calcNoteSizeForSpatialBl(props.item).h * LINE_HEIGHT_PX;
  let heightScale = hPx / naturalHeightPx

  let scale = Math.min(heightScale, widthScale);

  return (
    <div ref={outerDiv}
         id={props.item.id}
         class={`absolute border border-slate-700 rounded-sm shadow-lg`}
         style={`left: ${lPx}px; top: ${tPx}px; width: ${wPx}px; height: ${hPx}px;`}
         onMouseDown={mouseDownHandler}>
      <div style={`position: absolute; left: 0px; top: ${-LINE_HEIGHT_PX/5}px; width: ${naturalWidthPx}px; ` +
                  `line-height: 24px; transform: scale(${scale}); transform-origin: top left; ` +
                  `overflow-wrap: break-word; padding: ${NOTE_PADDING_PX}px;`}>
        <Show when={props.item.url != null}
              fallback={<span>{props.item.title}</span>}>
          <a href={props.item.url} draggable={false} target="_blank">{props.item.title}</a>
        </Show>
      </div>
      <div class={`absolute opacity-0 cursor-nwse-resize`}
           style={`left: ${wPx-RESIZE_BOX_SIZE}px; top: ${hPx-RESIZE_BOX_SIZE}px; width: ${RESIZE_BOX_SIZE}px; height: ${RESIZE_BOX_SIZE}px;`}></div>
    </div>
  );
}
