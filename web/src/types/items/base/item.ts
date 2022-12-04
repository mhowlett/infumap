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

import { Vector } from '../../../util/geometry';
import { newOrdering } from '../../../util/ordering';
import { uuid } from '../../utility';


export interface Item {
  id: uuid,
  parentId: uuid | null,
  originalCreationDate: number,
  creationDate: number,
  lastModifiedDate: number,
  ordering: Uint8Array,
  title: string,
  bxyForSpatial: Vector
}

export function emptyItem() : Item {
  return {
    id: "0",
    parentId: null,
    originalCreationDate: 0,
    creationDate: 0,
    lastModifiedDate: 0,
    ordering: newOrdering(),
    title: "",
    bxyForSpatial: { x: 0, y: 0}
  };
}
