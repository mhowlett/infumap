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
import { server } from "../../server";
import { Item } from "../../store/items/base/item";
import { asNoteItem } from "../../store/items/note-item";
import { useItemStore } from "../../store/ItemStoreProvider";
import { useUserStore } from "../../store/UserStoreProvider";
import { TextInput } from "../TextInput";


export const EditNote: Component<{item: Item}> = (props: {item: Item}) => {
  const userStore = useUserStore();
  const itemStore = useItemStore();

  let noteId = props.item.id;
  let noteItem = asNoteItem(props.item);

  const handleTextChange = (v: string) => { itemStore.updateItem(noteId, item => item.title = v); };
  const handleTextChanged = (v: string) => { server.updateItem(userStore.getUser()!, itemStore.getItem(noteId)!); }
  const handleUrlChange = (v: string) => {
    itemStore.updateItem(noteId, item => asNoteItem(item).url = v);
    server.updateItem(userStore.getUser()!, itemStore.getItem(noteId)!);
  };

  return (
    <div class="m-1">
      <div class="text-slate-800 text-sm">Text <TextInput value={noteItem.title} onIncrementalChange={handleTextChange} onChange={handleTextChanged} /></div>
      <div class="text-slate-800 text-sm">Url <TextInput value={noteItem.url} onIncrementalChange={null} onChange={handleUrlChange} /></div>
    </div>
  );
}
