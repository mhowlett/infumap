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

import { Component, onCleanup, onMount } from "solid-js";
import { produce } from "solid-js/store";
import { RelationshipToParent } from "../relationship-to-parent";
import { newOrderingAtEndOfChildren } from "../store/items";
import { Item } from "../store/items/base/item";
import { isPageItem, newPageItem } from "../store/items/page-item";
import { useItemStore } from "../store/ItemStoreProvider";
import { useLayoutStore } from "../store/LayoutStoreProvider";
import { Vector } from "../util/geometry";
import ToolbarIcon from "./ToolbarIcon";


export type ContexMenuProps = {
  posPx: Vector,
  item: Item | null
};

export const ContextMenu: Component<ContexMenuProps> = (props: ContexMenuProps) => {
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  let contextMenuDiv: HTMLDivElement | undefined;

  const newPage = () => {
    if (isPageItem(props.item)) {
      let newPage = newPageItem(props.item?.id!, RelationshipToParent.Child, "my new page", newOrderingAtEndOfChildren(itemStore.items, props.item?.id!));
      itemStore.addItem(newPage);
      layoutStore.setLayout(produce(state => { state.contextMenuPosPx = null; state.contexMenuItem = null; }));
    }
  };

  const newNote = () => {

  }

  let moveListener = (ev: MouseEvent) => ev.stopPropagation();
  onMount(() => contextMenuDiv?.addEventListener('mousedown', moveListener));
  onCleanup(() => contextMenuDiv?.removeEventListener('mousedown', moveListener));

  return (
    <div ref={contextMenuDiv}
         class="absolute border rounded w-[200px] h-[150px] bg-slate-50"
         style={`left: ${props.posPx.x}px; top: ${props.posPx.y}px`}>
      {`${props.item?.id}`}
      <ToolbarIcon icon="folder" margin={18} clickHandler={newPage} />
      <ToolbarIcon icon="sticky-note" margin={4} clickHandler={newNote} />
    </div>
  );
}
