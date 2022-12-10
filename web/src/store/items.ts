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

import { RelationshipToParent } from '../relationship-to-parent';
import { Item } from '../types/items/base/item';
import { defaultNoteItemComputed, NoteItem } from '../types/items/note-item';
import { defaultPageItemComputed, PageItem } from '../types/items/page-item';
import { base62 } from '../util/base62';
import { currentUnixTimeSeconds, throwExpression } from '../util/lang';
import { newOrdering, newOrderingAtEnd } from '../util/ordering';
import { uuid } from '../util/uuid';


export type { Item } from '../types/items/base/item';
export type { NoteItem } from '../types/items/note-item';
export type { PageItem } from '../types/items/page-item';

export type Uid = string;

export type Items = {
    rootId: Uid | null,
    fixed: { [id: Uid]: Item },
    moving: Array<Item>
    // need some way to keep track of parent pages that haven't been loaded yet.
}

// If id corresponds to a root page, then that page is also returned.
export const fetchContainerItems: ((id: Uid) => Promise<Array<Item>>) = async (id: Uid) => {
  await new Promise(r => setTimeout(r, 100));
  return constructDummyItemsForTesting(id);
}

export function constructDummyItemsForTesting(rootId: Uid): (Array<Item>) {

  let rootItem: PageItem = {
    type: "page",
    computed: defaultPageItemComputed(),
    innerSpatialWidthBl: 80,
    naturalAspect: 1.4,
    bgColor: 0,
    spatialWidthBl: NaN,
    id: rootId,
    parentId: null,
    relationshipToParent: RelationshipToParent.NoParent,
    originalCreationDate: currentUnixTimeSeconds(),
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering: newOrdering(),
    title: 'matt',
    spatialPositionBl: { x: NaN, y: NaN }
  };

  let pageItem: PageItem = {
    type: "page",
    computed: defaultPageItemComputed(),
    innerSpatialWidthBl: 60,
    naturalAspect: 1.4,
    bgColor: 0,
    spatialWidthBl: 4.0,
    id: newUid(),
    parentId: rootId,
    relationshipToParent: RelationshipToParent.Child,
    originalCreationDate: currentUnixTimeSeconds(),
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering: newOrdering(),
    title: 'inside page',
    spatialPositionBl: { x: 5.0, y: 7.0 }
  };

  let noteItem: NoteItem = {
    type: "note",
    computed: defaultNoteItemComputed(),
    text: 'the note text',
    url: 'https://www.google.com',
    hasFavIcon: false,
    spatialWidthBl: 8.0,
    id: newUid(),
    parentId: rootId,
    relationshipToParent: RelationshipToParent.Child,
    originalCreationDate: currentUnixTimeSeconds(),
    creationDate: currentUnixTimeSeconds(),
    lastModifiedDate: currentUnixTimeSeconds(),
    ordering: newOrderingAtEnd(pageItem.ordering),
    title: 'google.com',
    spatialPositionBl: { x: 5.0, y: 12.0 }
  };

  return [rootItem, pageItem, noteItem];
}

export function findItemInArray(items: Array<Item>, id: Uid): Item {
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
