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

import { setDefaultComputed } from "./store/items";
import { Item } from "./store/items/base/item";
import { User } from "./store/UserStoreProvider";
import { throwExpression } from "./util/lang";
import { Uid } from "./util/uid";


export const server = {
  fetchChildItems: async (user: User, parentId: Uid): Promise<Array<Item>> => {
    let items = await send("get-children", user, { parentId });
    return items.map((item: Item) => setDefaultComputed(item));
  },

  fetchAttachmentItems: async (user: User, parentId: Uid): Promise<Array<Item>> => {
    let items = await send("get-attachments", user, { parentId });
    return items.map((item: Item) => setDefaultComputed(item));
  },

  addItem: async (user: User, item: Item): Promise<void> => {
    await send("add-item", user, createItemForSend(item));
  },

  updateItem: async (user:User, item: Item): Promise<void> => {
    await send("update-item", user, createItemForSend(item));
  }
}

async function send(command: string, user: User, payload: object): Promise<any> {
  let fetchResult = await fetch('/command', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ command, userId: user.userId!, sessionId: user.sessionId!, jsonData: JSON.stringify(payload) })
  });
  let r = await fetchResult.json();
  if (!r.success) { throwExpression(`'${command}' command failed!`); }
  return JSON.parse(r.jsonData);
}

function createItemForSend(item: Item): Item {
  let result: any = {};
  Object.assign(result, item);
  delete result.computed_boundsPx;
  delete result.computed_fromParentIdMaybe;
  delete result.computed_children;
  delete result.computed_attachments;
  delete result.children_loaded;
  result.ordering = Array.from(item.ordering);
  return result;
}
