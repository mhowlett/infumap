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
import { base62 } from './util/base62';
import { throwExpression } from './util/lang';
import { uuid } from './util/uuid';


export type { Item } from './types/items/base/item';
export type { NoteItem } from './types/items/note-item';
export type { PageItem } from './types/items/page-item';

export type Uid = string;

export type Items = {
    rootId: Array<String> | null,
    fixed: { [id: Uid]: Item },
    moving: Array<Item>
}

export function findWithId(items: Array<Item>, id: Uid): Item {
  return items.find(a => a.id == id) ?? throwExpression(`no item with id '${id}' found.`);
}

export function newUid(): Uid {
  return base62.encode(uuid.toBytes(uuid.createV4()));
}

export function testUid(): void {
  let uid = "3d14c109-9934-4717-aef0-be64a95a8550";
  let bytes = uuid.toBytes(uid);
  let encoded = base62.encode(bytes);
  let decoded = base62.decode(encoded);
  let reconstructed = uuid.fromBytes(decoded);
  console.log(uid);
  console.log(reconstructed, encoded);

  for (let i=0; i<10; ++i) {
    let id = uuid.createV4();
    let bytes = uuid.toBytes(id);
    let encoded = base62.encode(bytes);
    let decoded = base62.decode(encoded);
    let reconstructed = uuid.fromBytes(decoded);
    console.log(id);
    console.log(reconstructed, encoded);
  }
}
