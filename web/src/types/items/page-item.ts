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

import { Uid } from '../../items';
import { BoundingBox } from '../../util/geometry';
import { XSizableItem } from './base/x-sizeable-item';


export interface PageItemTransient {
  children: Array<Uid>;
  attachments: Array<Uid>;
  currentBounds: BoundingBox | null;
  fromParentIdMaybe: Uid | null; // when moving.
}

export interface PageItem extends XSizableItem {
  transient: PageItemTransient | null;

  innerSpatialBw: number;
  naturalAspect: number;
  bgColor: number;
}
