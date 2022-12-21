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

import { RelationshipToParent } from "../relationship-to-parent";
import { currentUnixTimeSeconds, throwExpression } from "../util/lang";
import { newOrdering, newOrderingAfter, newOrderingAtEnd } from "../util/ordering";
import { newUid, Uid } from "../util/uid";
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

// If id corresponds to a root page, then that page is also returned.
export const fetchContainerItems: ((id: Uid) => Promise<Array<Item>>) = async (id: Uid) => {
  await new Promise(r => setTimeout(r, 100));
  return constructDummyItemsForTesting(id);
}

export function constructDummyItemsForTesting(rootId: Uid): (Array<Item>) {
  let rootItem: PageItem = {
    type: "page",
    computed_children: [],
    computed_attachments: [],
    computed_boundsPx: null,
    computed_fromParentIdMaybe: null,
    innerSpatialWidthBl: 80,
    naturalAspect: 1.4,
    bgColorIdx: 0,
    spatialWidthBl: NaN,
    id: rootId,
    parentId: null,
    relationshipToParent: RelationshipToParent.NoParent,
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering: newOrdering(),
    title: 'matt',
    spatialPositionBl: { x: NaN, y: NaN }
  };

  let pageItem: PageItem = {
    type: "page",
    computed_children: [],
    computed_attachments: [],
    computed_boundsPx: null,
    computed_fromParentIdMaybe: null,
    innerSpatialWidthBl: 60,
    naturalAspect: 1.4,
    bgColorIdx: 0,
    spatialWidthBl: 4.0,
    id: newUid(),
    parentId: rootId,
    relationshipToParent: RelationshipToParent.Child,
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering: newOrdering(),
    title: 'inside page',
    spatialPositionBl: { x: 5.0, y: 7.0 }
  };

  let noteItem: NoteItem = {
    type: "note",
    computed_attachments: [],
    computed_boundsPx: null,
    computed_fromParentIdMaybe: null,
    url: 'https://www.google.com',
    spatialWidthBl: 8.0,
    id: newUid(),
    parentId: rootId,
    relationshipToParent: RelationshipToParent.Child,
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering: newOrderingAfter(pageItem.ordering),
    title: 'google.com',
    spatialPositionBl: { x: 5.0, y: 12.0 }
  };

  return [rootItem, pageItem, noteItem];
}

export function findItemInArray(items: Array<Item>, id: Uid): Item {
  return items.find(a => a.id == id) ?? throwExpression(`no item with id '${id}' found.`);
}
