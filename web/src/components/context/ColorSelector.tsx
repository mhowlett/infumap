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
import { Item } from "../../store/items/base/item";
import { Colors } from "../../style";

const ColorButton: Component<{ col: number }> = (props: { col: number }) => {
  return (
    <div class="border rounded w-[29px] h-[28px] inline-block text-center cursor-move ml-[5px] text-[18px]" style={`background-color: ${Colors[props.col]};`}></div>
  );
}

export const ColorSelector: Component<{ item: Item }> = (props: {item: Item }) => {
  return (
    <div>
      <ColorButton col={0} />
      <ColorButton col={1} />
      <ColorButton col={2} />
      <ColorButton col={3} />
      <ColorButton col={4} />
      <ColorButton col={5} />
      <ColorButton col={6} />
      <ColorButton col={7} />
    </div>
  );
}
