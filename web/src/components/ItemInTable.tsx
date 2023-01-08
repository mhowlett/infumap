/*
  Copyright (C) 2023 Matt Howlett
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

import { Component, Match, Switch } from "solid-js";
import { FileItem, isFileItem } from "../store/items/file-item";
import { ImageItem, isImageItem } from "../store/items/image-item";
import { isNoteItem, NoteItem } from "../store/items/note-item";
import { isPageItem, PageItem } from "../store/items/page-item";
import { isRatingItem, RatingItem } from "../store/items/rating-item";
import { isTableItem, TableItem } from "../store/items/table-item";
import { NoteInTable } from "./items/Note";
import { PageInTable } from "./items/Page";
import { RatingInTable } from "./items/Rating";
import { TableInTable } from "./items/Table";
import { ImageInTable } from "./items/Image";
import { FileInTable } from "./items/File";
import { Item } from "../store/items/base/item";
import { BoundingBox } from "../util/geometry";


export interface ItemAndParentTableAndBounds {
  item: Item,
  parentTable: TableItem,
  boundsPx: BoundingBox,
}

export const ItemInTable: Component<ItemAndParentTableAndBounds> = (props: ItemAndParentTableAndBounds) => {
  let { item, parentTable, boundsPx } = props;

  return (
    <Switch fallback={<div>unkown item type '{item.itemType}'</div>}>
      <Match when={isPageItem(item)}>
        <PageInTable item={item as PageItem} parentTable={parentTable} boundsPx={boundsPx} />
      </Match>
      <Match when={isTableItem(props.item)}>
        <TableInTable item={item as TableItem} parentTable={parentTable} boundsPx={boundsPx} />
      </Match>
      <Match when={isNoteItem(props.item)}>
        <NoteInTable item={item as NoteItem} parentTable={parentTable} boundsPx={boundsPx} />
      </Match>
      <Match when={isImageItem(item)}>
        <ImageInTable item={item as ImageItem} parentTable={parentTable} boundsPx={boundsPx} />
      </Match>
      <Match when={isFileItem(item)}>
        <FileInTable item={item as FileItem} parentTable={parentTable} boundsPx={boundsPx} />
      </Match>
      <Match when={isRatingItem(item)}>
        <RatingInTable item={item as RatingItem} parentTable={parentTable} boundsPx={boundsPx} />
      </Match>
    </Switch>
  );
}
