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
import { add, clientPosVector, subtract, Vector } from "../../util/geometry";
import { NoteItem, useItemStore } from "../../store/ItemStoreProvider";
import { useLayoutStore } from "../../store/LayoutStoreProvider";
import { panic } from "../../util/lang";


export const Note: Component<{ item: NoteItem }> = (props: { item: NoteItem }) => {
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let startPx: Vector | null;
  let startBl: Vector | null;

  let mouseDownHandler = (pos: MouseEvent) => {
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    startPx = clientPosVector(pos);
    startBl = props.item.spatialPositionBl;
    itemStore.transitionToMove(props.item.id);
  };

  let mouseMoveHandler = (pos: MouseEvent) => {
    if (startPx == null) { return; }

    let deltaPx = subtract(clientPosVector(pos), startPx);

    let wPx = props.item.computed.boundsPx?.w ?? panic();
    let wCo = props.item.spatialWidthBl * 60.0;
    deltaPx.x *= (wCo / 60.0) / wPx;

    let hPx = props.item.computed.boundsPx?.h ?? panic();
    let hCo = 60.0;
    deltaPx.y *= (hCo / 60.0) / hPx;

    let np = add(startBl ?? panic(), deltaPx);
    np.x = Math.round(np.x * 2.0) / 2.0;
    np.y = Math.round(np.y * 2.0) / 2.0;

    itemStore.updateItem(props.item.id, item => { item.spatialPositionBl = np; });
  };

  let mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    startPx = null;
    startBl = null;
    itemStore.transitionMovingToFixed();
  };

  if (props.item.id != layoutStore.layout.currentPage) {
    return (
      <div class={`absolute border border-teal-500`}
           style={`left: ${props.item.computed.boundsPx?.x}px; top: ${props.item.computed.boundsPx?.y}px; ` +
                  `width: ${props.item.computed.boundsPx?.w}px; height: ${props.item.computed.boundsPx?.h}px;`}
           onMouseDown={mouseDownHandler}>
        {props.item.title} {props.item.text}
      </div>
    );
  }
}