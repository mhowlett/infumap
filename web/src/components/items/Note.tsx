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
import { useLayoutStore } from "../../store/LayoutStoreProvider";
import { NoteItem } from "../../store/items/note-item";
import { GRID_SIZE, RESIZE_BOX_SIZE } from "../../constants";
import { asNoteItem } from "../../store/items/note-item";


export const Note: Component<{ item: NoteItem }> = (props: { item: NoteItem }) => {
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let outerDiv: HTMLDivElement | undefined;

  let startPx: Vector | null;
  let startPosBl: Vector | null;
  let startWidthBl: number | null;

  let moving = () => { return startPosBl != null; }

  let mouseDownHandler = (pos: MouseEvent) => {
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    let rect = outerDiv?.getBoundingClientRect();
    startPx = clientPosVector(pos);
    if (rect?.right! - startPx.x < RESIZE_BOX_SIZE && rect?.bottom! - startPx.y < RESIZE_BOX_SIZE) {
      startPosBl = null;
      startWidthBl = props.item.spatialWidthBl;
    } else {
      startWidthBl = null;
      startPosBl = props.item.spatialPositionBl;
      itemStore.transitionToMove(props.item.id);
    }
  };

  let mouseMoveHandler = (pos: MouseEvent) => {
    if (startPx == null) { return; }

    let deltaPx = subtract(clientPosVector(pos), startPx);
    let deltaBl = { x: NaN, y: NaN };

    let wPx = props.item.computed_boundsPx?.w!;
    let wCo = props.item.spatialWidthBl * GRID_SIZE;
    deltaBl.x = deltaPx.x * (wCo / GRID_SIZE) / wPx;

    let hPx = props.item.computed_boundsPx?.h!;
    let hCo = 1.0 * GRID_SIZE;
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
      newWidthBl = Math.round(newWidthBl);
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
    startPx = null;
    startPosBl = null;
    startWidthBl = null;
  };

  let lPx = props.item.computed_boundsPx!.x!;
  let tPx = props.item.computed_boundsPx!.y!;
  let wPx = props.item.computed_boundsPx!.w!;
  let hPx = props.item.computed_boundsPx!.h!;
  return (
    <div ref={outerDiv}
         id={props.item.id}
         class={`absolute border border-teal-500`}
         style={`left: ${lPx}px; top: ${tPx}px; width: ${wPx}px; height: ${hPx}px;`}
         onMouseDown={mouseDownHandler}>
      <Show when={props.item.url != null}
            fallback={<span>{props.item.title}</span>}>
        <a href={props.item.url} draggable={false} target="_blank">{props.item.title}</a>
      </Show>
      <div class={`absolute opacity-0 cursor-nwse-resize`}
          style={`left: ${wPx-RESIZE_BOX_SIZE}px; top: ${hPx-RESIZE_BOX_SIZE}px; width: 5px; height: 5px; background-color: #888`}></div>
    </div>
  );
}
