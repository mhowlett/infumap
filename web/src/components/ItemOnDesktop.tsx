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
import { Note } from "./items/Note";
import { Page } from "./items/Page";
import { Rating } from "./items/Rating";
import { Table } from "./items/Table";
import { Image } from "./items/Image";
import { File } from "./items/File";
import { Item } from "../store/items/base/item";
import { BoundingBox } from "../util/geometry";


export interface ItemAndBounds {
  item: Item,
  boundsPx: BoundingBox,
}

export const ItemOnDesktop: Component<ItemAndBounds> = (props: ItemAndBounds) => {
  let { item, boundsPx } = props;

  return (
    <Switch fallback={<div>unkown item type '{item.itemType}'</div>}>
      <Match when={isPageItem(item)}>
        <Page item={item as PageItem} boundsPx={boundsPx} />
      </Match>
      <Match when={isTableItem(props.item)}>
        <Table item={item as TableItem} boundsPx={boundsPx} />
      </Match>
      <Match when={isNoteItem(props.item)}>
        <Note item={item as NoteItem} boundsPx={boundsPx} />
      </Match>
      <Match when={isImageItem(item)}>
        <Image item={item as ImageItem} boundsPx={boundsPx} />
      </Match>
      <Match when={isFileItem(item)}>
        <File item={item as FileItem} boundsPx={boundsPx} />
      </Match>
      <Match when={isRatingItem(item)}>
        <Rating item={item as RatingItem} boundsPx={boundsPx} />
      </Match>
    </Switch>
  );
}
