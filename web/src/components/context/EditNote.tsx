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
import { asNoteItem } from "../../store/items/note-item";
import { useItemStore } from "../../store/ItemStoreProvider";
import { TextInput } from "../TextInput";
import { ContexMenuProps } from "./ContextMenu";

export const EditNote: Component<ContexMenuProps> = (props: ContexMenuProps) => {
  const itemStore = useItemStore();

  let noteItem = asNoteItem(props.contextItem!);

  const handleTextChange = (v: string) => { itemStore.updateItem(props.contextItem!.id, i => i.title = v); };
  const handleUrlChange = (v: string) => { itemStore.updateItem(props.contextItem!.id, i => asNoteItem(i).url = v); };

  return (
    <div class="m-1">
      <div class="text-slate-800 text-sm">Text <TextInput value={noteItem.title} onChange={handleTextChange} /></div>
      <div class="text-slate-800 text-sm">Text <TextInput value={noteItem.url} onChange={handleUrlChange} /></div>
    </div>
  );
}
