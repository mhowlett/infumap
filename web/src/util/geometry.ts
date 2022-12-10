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

export interface BoundingBox {
    x: number;
    y: number;
    w: number;
    h: number;
}

export function cloneBoundingBox(boundingBox: BoundingBox | null): BoundingBox | null {
  if (boundingBox == null) { return null; }
  return {
    x: boundingBox.x,
    y: boundingBox.y,
    w: boundingBox.w,
    h: boundingBox.h
  };
}

export interface Vector {
    x: number;
    y: number;
}

export interface Dimensions {
  w: number;
  h: number;
}

export function clientPosVector(e: MouseEvent) : Vector {
  return { x: e.clientX, y: e.clientY}
}

export function subtract(a: Vector, b: Vector) : Vector {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Vector, b: Vector) : Vector {
  return { x: a.x + b.x, y: a.y + b.y };
}
