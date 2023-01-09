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

import { Hitbox } from "./hitbox";
import { Item } from "./store/items/base/item";
import { BoundingBox } from "./util/geometry";


export interface ItemGeometry {
  item: Item,
  boundsPx: BoundingBox,
  hitboxes: Array<Hitbox>, // higher index => takes precedence.
  level: number,
}
