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
import { asPageItem } from "../../store/items/page-item";
import { useItemStore } from "../../store/ItemStoreProvider";
import { TextInput } from "../TextInput";
import { ColorSelector } from "./ColorSelector";
import { ContexMenuProps } from "./ContextMenu";


export const EditPage: Component<ContexMenuProps> = (props: ContexMenuProps) => {
  const itemStore = useItemStore();

  let pg = asPageItem(props.contextItem!);

  const handleBlockWidthChange = (v: string) => { itemStore.updateItem(props.contextItem?.id!, item => asPageItem(item).innerSpatialWidthBl = parseInt(v)); };
  const handleNaturalAspectChange = (v: string) => { itemStore.updateItem(props.contextItem?.id!, item => asPageItem(item).naturalAspect = parseFloat(v)); };
  const handleTitleChange = (v: string) => { itemStore.updateItem(props.contextItem!.id, i => i.title = v); };

  return (
    <div class="m-1">
      <div class="text-slate-800 text-sm">Title <TextInput value={pg.title} onIncrementalChange={handleTitleChange} onChange={null} /></div>
      <div class="text-slate-800 text-sm">Inner block width <TextInput value={pg.innerSpatialWidthBl.toString()} onIncrementalChange={null} onChange={handleBlockWidthChange} /></div>
      <div class="text-slate-800 text-sm">Natural Aspect <TextInput value={pg.naturalAspect.toString()} onIncrementalChange={null} onChange={handleNaturalAspectChange} /></div>
      <ColorSelector item={props.contextItem!} />
    </div>
  );
}
