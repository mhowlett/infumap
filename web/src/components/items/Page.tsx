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

import { Component } from "solid-js";
import { add, clientPosVector as clientPxFromMouseEvent, subtract, Vector } from "../../util/geometry";
import { useItemStore } from "../../store/ItemStoreProvider";
import { useLayoutStore } from "../../store/LayoutStoreProvider";
import { asPageItem, calcPageSizeForSpatialBl, PageItem } from "../../store/items/page-item";
import { CHILD_ITEMS_VISIBLE_WIDTH_BL, GRID_SIZE, RESIZE_BOX_SIZE } from "../../constants";
import { hexToRGBA } from "../../util/color";
import { Colors } from "../../style";
import { command } from "../../command";
import { useUserStore } from "../../store/UserStoreProvider";


export const Page: Component<{ item: PageItem }> = (props: { item: PageItem }) => {
  const userStore = useUserStore();
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let outerDiv: HTMLDivElement | undefined;

  let startPx: Vector | null;
  let startPosBl: Vector | null;
  let startWidthBl: number | null;

  let moving = () => { return startPosBl != null; }

  let mouseDownHandler = (ev: MouseEvent) => {
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    let rect = outerDiv!.getBoundingClientRect();
    startPx = clientPxFromMouseEvent(ev);
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

    let deltaPx = subtract(clientPxFromMouseEvent(ev), startPx);
    let deltaBl = { x: NaN, y: NaN };

    let wPx = props.item.computed_boundsPx!.w;
    let wCo = props.item.spatialWidthBl * GRID_SIZE;
    deltaBl.x = deltaPx.x * (wCo / GRID_SIZE) / wPx;

    let hPx = props.item.computed_boundsPx!.h;
    let hCo = calcPageSizeForSpatialBl(props.item).h * GRID_SIZE;
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
      itemStore.updateItem(props.item.id, item => { asPageItem(item).spatialWidthBl = newWidthBl; });
    }
  };

  let mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    if (moving()) {
      itemStore.transitionMovingToFixed();
    }
    command.updateItem(userStore.user, itemStore.getItem(props.item.id)!);
    startPx = null;
    startPosBl = null;
    startWidthBl = null;
  };

  let lPx = props.item.computed_boundsPx!.x;
  let tPx = props.item.computed_boundsPx!.y;
  let wPx = props.item.computed_boundsPx!.w;
  let hPx = props.item.computed_boundsPx!.h;

  // Current top page.
  if (props.item.id == layoutStore.layout.currentPageId) {
    return (
      <div ref={outerDiv}
           id={props.item.id}
           class={`absolute`}
           style={`left: ${lPx}px; top: ${tPx}px; width: ${wPx}px; height: ${hPx}px;`}>
      </div>
    );
  }

  // Too small for inside items to be visible. Opaque.
  if (props.item.spatialWidthBl < CHILD_ITEMS_VISIBLE_WIDTH_BL) {
    return (
      <div ref={outerDiv}
           id={props.item.id}
           class={`absolute border border-slate-700 rounded-sm shadow-lg`}
           style={`left: ${lPx}px; top: ${tPx}px; width: ${wPx}px; height: ${hPx}px; ` +
                  `background-image: linear-gradient(270deg, ${hexToRGBA(Colors[props.item.backgroundColorIndex], 0.986)}, ${hexToRGBA(Colors[props.item.backgroundColorIndex], 1.0)});`}
           onMouseDown={mouseDownHandler}>
        <div class="flex items-center justify-center" style={`width: ${wPx}px; height: ${hPx}px;`}>
          <div class="flex items-center text-center text-xs font-bold text-white">
            {props.item.title}
          </div>
        </div>
        <div class={`absolute opacity-0 cursor-nwse-resize`}
             style={`left: ${wPx-RESIZE_BOX_SIZE}px; top: ${hPx-RESIZE_BOX_SIZE}px; width: ${RESIZE_BOX_SIZE}px; height: ${RESIZE_BOX_SIZE}px;`}></div>
      </div>
    );
  }

  // Show child items. Translucent.
  return (
    <div ref={outerDiv}
         id={props.item.id}
         class={`absolute border border-slate-700 rounded-sm shadow-lg`}
         style={`left: ${lPx}px; top: ${tPx}px; width: ${wPx}px; height: ${hPx}px; ` +
                `background-image: linear-gradient(270deg, ${hexToRGBA(Colors[props.item.backgroundColorIndex], 0.386)}, ${hexToRGBA(Colors[props.item.backgroundColorIndex], 0.364)});`}
         onMouseDown={mouseDownHandler}>
      <div class="flex items-center justify-center" style={`width: ${wPx}px; height: ${hPx}px;`}>
        <div class="flex items-center text-center text-xl text-white">
          {props.item.title}
        </div>
      </div>
      <div class={`absolute opacity-0 cursor-nwse-resize`}
           style={`left: ${wPx-RESIZE_BOX_SIZE}px; top: ${hPx-RESIZE_BOX_SIZE}px; width: ${RESIZE_BOX_SIZE}px; height: ${RESIZE_BOX_SIZE}px;`}></div>
    </div>
  );
}
