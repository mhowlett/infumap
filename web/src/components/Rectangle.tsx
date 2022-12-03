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
import { add, clientPosVector, subtract, Vector } from "../geometry";
import { useItemStore } from "../store/ItemStoreProvider";


export const Rectangle: Component = () => {
  const c = useItemStore();

  let lastPos: Vector | null = null;
    
  let mouseMoveHandler = (pos: MouseEvent) => {
    if (lastPos == null) { return ;}
    const delta = subtract(clientPosVector(pos), lastPos);
    lastPos = clientPosVector(pos);
    c.setPos(add(c.pos(), delta));
  };

  let mouseDownHandler = (pos: MouseEvent) => {
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    lastPos = clientPosVector(pos);
  }

  let mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    lastPos = null;
  }

  return (
    <div class={`absolute border border-black w-[40px] h-[40px]`}
       style={`left: ${c.pos().x}px; top: ${c.pos().y}px`}
       onMouseDown={mouseDownHandler}>
    </div>
  );
}
