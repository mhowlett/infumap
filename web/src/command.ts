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

import { Item } from "./store/items/base/item";
import { NoteItem } from "./store/items/note-item";
import { PageItem } from "./store/items/page-item";
import { User } from "./store/UserStoreProvider";
import { throwExpression } from "./util/lang";
import { Uid } from "./util/uid";


function setDefaultComputed(item: Item) {
  item.computed_boundsPx = null;
  item.computed_fromParentIdMaybe = null;
  if (item.type == "page") {
    (item as PageItem).computed_children = [];
    (item as PageItem).computed_attachments = [];
  } else if (item.type == "note") {
    (item as NoteItem).computed_attachments = [];
  }
  return item;
}

export async function fetchContainerItems(user: User, containerId: Uid): Promise<Array<Item>> {
  let payload = { containerId };
  let fetchResult = await fetch('/command', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ command: "get-children", "userId": user.userId, "sessionId": user.sessionId, jsonData: JSON.stringify(payload) })
  });
  let r = await fetchResult.json();
  if (!r.success) { throwExpression("fetch container items command failed!"); }
  return JSON.parse(r.jsonData).map((item: Item) => setDefaultComputed(item));
}

export function fetchAttachmentItems(user: User, itemId: Uid): Array<Item> {
  throwExpression("not implemented");
}
