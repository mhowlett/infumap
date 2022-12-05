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
import { produce } from "solid-js/store";
import { add, clientPosVector, subtract, Vector } from "../util/geometry";
import { useItemStore } from "../store/ItemStoreProvider";
import { findItemInArray, Uid } from "../items";


export interface RectangleProps {
  id: Uid
}

export const Rectangle: Component<RectangleProps> = (props: RectangleProps) => {
  const c = useItemStore();
  let item = findItemInArray(c.items.moving, props.id);

  let lastPos: Vector | null = null;

  let mouseDownHandler = (pos: MouseEvent) => {
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    lastPos = clientPosVector(pos);
  }

  let mouseMoveHandler = (pos: MouseEvent) => {
    if (lastPos == null) { return ;}
    const delta = subtract(clientPosVector(pos), lastPos);
    lastPos = clientPosVector(pos);
    c.setItems("moving", produce((items) => {
        let itm = findItemInArray(items, props.id);
        itm.bxyForSpatial = add(itm.bxyForSpatial, delta);
        return items;
    }));
  };

  let mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    lastPos = null;
  }

  return (
    <div class={`absolute border border-black w-[40px] h-[40px]`}
       style={`left: ${item.bxyForSpatial.x}px; top: ${item.bxyForSpatial.y}px`}
       onMouseDown={mouseDownHandler}>
    </div>
  );
}
