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

import { throwExpression } from "../util/lang";
import { newOrderingAtEnd } from "../util/ordering";
import { Uid } from "../util/uid";
import { Item } from "./items/base/item";
import { NoteItem } from "./items/note-item";
import { asPageItem, PageItem } from "./items/page-item";


export type Items = {
  rootId: Uid | null,
  fixed: { [id: Uid]: Item },
  moving: Array<Item>
  // Also need some way to keep track of parent pages that haven't been loaded yet.
}

export function newOrderingAtEndOfChildren(items: Items, parentId: Uid): Uint8Array {
  let parent = asPageItem(items.fixed[parentId]);
  let children = parent.computed_children.map(c => items.fixed[c].ordering);
  return newOrderingAtEnd(children);
}

export function findItemInArray(items: Array<Item>, id: Uid): Item {
  return items.find(a => a.id == id) ?? throwExpression(`no item with id '${id}' found.`);
}
