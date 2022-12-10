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
import { useItemStore } from "../../store/ItemStoreProvider";
import { NoteItem } from "../../store/items";


export const Note: Component<{ item: NoteItem }> = (props: { item: NoteItem }) => {
  const c = useItemStore();

  let lastPos: Vector | null = null;

  let mouseDownHandler = (pos: MouseEvent) => {
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    lastPos = clientPosVector(pos);
  }

  let mouseMoveHandler = (pos: MouseEvent) => {
    if (lastPos == null) { return; }
    const delta = subtract(clientPosVector(pos), lastPos);
    lastPos = clientPosVector(pos);
    c.updateItem(props.item.id, item => { item.spatialPositionBl = add(item.spatialPositionBl, delta); });
  };

  let mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    lastPos = null;
  }

  if (props.item.id != c.items.rootId) {
    return (
      <div class={`absolute border border-teal-500 w-[40px] h-[40px]`}
           style={`left: ${props.item.computed.boundsPx?.x}px; top: ${props.item.computed.boundsPx?.y}px; ` +
                  `width: ${props.item.computed.boundsPx?.w}px; height: ${props.item.computed.boundsPx?.h}px;`}
           onMouseDown={mouseDownHandler}>
            {props.item.title} {props.item.text}
      </div>
    );
  }
}
