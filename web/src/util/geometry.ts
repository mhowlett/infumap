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

import { TOOLBAR_WIDTH } from "../constants";


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

export function isInside(point: Vector, boundingBox: BoundingBox): boolean {
  return point.x > boundingBox.x &&
         point.x < boundingBox.x + boundingBox.w &&
         point.y > boundingBox.y &&
         point.y < boundingBox.y + boundingBox.h;
}

export interface Vector {
  x: number;
  y: number;
}

export function cloneVector(vector: Vector | null): Vector | null {
  if (vector == null) { return null; }
  return {
    x: vector.x,
    y: vector.y
  };
}

export interface Dimensions {
  w: number;
  h: number;
}

export function cloneDimensions(dimensions: Dimensions | null): Dimensions | null {
  if (dimensions == null) { return null; }
  return {
    w: dimensions.w,
    h: dimensions.h
  };
}


export function clientPxFromMouseEvent(ev: MouseEvent): Vector {
  return { x: ev.clientX, y: ev.clientY };
}

export function desktopPxFromMouseEvent(ev: MouseEvent): Vector {
  return subtract(clientPxFromMouseEvent(ev), { x: TOOLBAR_WIDTH, y: 0 });
}

export function subtract(a: Vector, b: Vector): Vector {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y };
}
