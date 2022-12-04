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

import { Item } from './types/items/base/item';
import { uuid } from './types/utility';
import { throwExpression } from './util/lang';


export type { Item } from './types/items/base/item';
export type { NoteItem } from './types/items/note-item';
export type { PageItem } from './types/items/page-item';

export type Items = {
    rootId: Array<string> | null,
    fixed: { [id: string]: Item },
    moving: Array<Item>
}

export function findWithId(items: Array<Item>, id: uuid) : Item {
  return items.find(a => a.id == id) ?? throwExpression(`no item with id '${id}' found.`);
}
