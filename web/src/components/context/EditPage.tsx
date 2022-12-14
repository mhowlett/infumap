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

import { Component } from "solid-js";
import { GRID_SIZE } from "../../constants";
import { server } from "../../server";
import { Item } from "../../store/items/base/item";
import { asPageItem } from "../../store/items/page-item";
import { useItemStore } from "../../store/ItemStoreProvider";
import { useUserStore } from "../../store/UserStoreProvider";
import { TextInput } from "../TextInput";
import { ColorSelector } from "./ColorSelector";


export const EditPage: Component<{item: Item}> = (props: {item: Item}) => {
  const userStore = useUserStore();
  const itemStore = useItemStore();

  let pageId = props.item.id;
  let pageItem = asPageItem(props.item);

  const handleBlockWidthChange = (v: string) => {
    itemStore.updateItem(pageId, item => asPageItem(item).innerSpatialWidthGr = parseInt(v) * GRID_SIZE);
    server.updateItem(userStore.getUser()!, itemStore.getItem(pageId)!);
  };
  const handleNaturalAspectChange = (v: string) => {
    itemStore.updateItem(pageId, item => asPageItem(item).naturalAspect = parseFloat(v));
    server.updateItem(userStore.getUser()!, itemStore.getItem(pageId)!);
  };
  const handleTitleChange = (v: string) => { itemStore.updateItem(pageId, item => asPageItem(item).title = v); };
  const handleTitleChanged = (v: string) => { server.updateItem(userStore.getUser()!, itemStore.getItem(pageId)!); }

  return (
    <div class="m-1">
      <div class="text-slate-800 text-sm">Title <TextInput value={pageItem.title} onIncrementalChange={handleTitleChange} onChange={handleTitleChanged} /></div>
      <div class="text-slate-800 text-sm">Inner block width <TextInput value={(pageItem.innerSpatialWidthGr / GRID_SIZE).toString()} onIncrementalChange={null} onChange={handleBlockWidthChange} /></div>
      <div class="text-slate-800 text-sm">Natural Aspect <TextInput value={pageItem.naturalAspect.toString()} onIncrementalChange={null} onChange={handleNaturalAspectChange} /></div>
      <ColorSelector item={props.item} />
    </div>
  );
}
