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
import { add, clientPosVector, subtract, Vector } from "../../util/geometry";
import { useItemStore } from "../../store/ItemStoreProvider";
import { PageItem } from "../../items";


export const Page: Component<{ item: PageItem }> = (props: { item: PageItem }) => {
  const c = useItemStore();

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
    c.updateItem(props.item.id, item => { item.bxyForSpatial = add(item.bxyForSpatial, delta); })
  };

  let mouseUpHandler = () => {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
    lastPos = null;
  }

  if (props.item.id != c.items.rootId) {
    return (
      <div class={`absolute border border-rose-500 w-[40px] h-[40px]`}
           style={`left: ${props.item.bxyForSpatial.x}px; top: ${props.item.bxyForSpatial.y}px`}
           onMouseDown={mouseDownHandler}>
      </div>
    );
  }
}
