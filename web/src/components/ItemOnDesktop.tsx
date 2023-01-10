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
import { isFileItem } from "../store/items/file-item";
import { isImageItem } from "../store/items/image-item";
import { isNoteItem } from "../store/items/note-item";
import { isPageItem } from "../store/items/page-item";
import { isRatingItem } from "../store/items/rating-item";
import { isTableItem } from "../store/items/table-item";
import { Note } from "./items/Note";
import { Page } from "./items/Page";
import { Rating } from "./items/Rating";
import { Table } from "./items/Table";
import { Image } from "./items/Image";
import { File } from "./items/File";
import { ItemGeometry } from "../item-geometry";


export const ItemOnDesktop: Component<{itemGeometry: ItemGeometry}> = (props: {itemGeometry: ItemGeometry}) => {
  let itemGeometry = props.itemGeometry;
  let item = itemGeometry.item;

  return (
    <Switch fallback={<div>unkown item type '{item.itemType}'</div>}>
      <Match when={isPageItem(item)}>
        <Page itemGeometry={itemGeometry} />
      </Match>
      <Match when={isTableItem(item)}>
        <Table itemGeometry={itemGeometry} />
      </Match>
      <Match when={isNoteItem(item)}>
        <Note itemGeometry={itemGeometry} />
      </Match>
      <Match when={isImageItem(item)}>
        <Image itemGeometry={itemGeometry} />
      </Match>
      <Match when={isFileItem(item)}>
        <File itemGeometry={itemGeometry} />
      </Match>
      <Match when={isRatingItem(item)}>
        <Rating itemGeometry={itemGeometry} />
      </Match>
    </Switch>
  );
}
