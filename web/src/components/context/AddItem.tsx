/*
  Copyright (C) 2022-2023 Matt Howlett
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
import { Child } from "../../relationship-to-parent";
import { newNoteItem } from "../../store/items/note-item";
import { asPageItem, isPageItem, newPageItem, PageItem } from "../../store/items/page-item";
import { useItemStore } from "../../store/ItemStoreProvider";
import { useLayoutStore } from "../../store/LayoutStoreProvider";
import { Vector } from "../../util/geometry";
import ToolbarIcon from "../ToolbarIcon";
import { server } from "../../server";
import { useUserStore } from "../../store/UserStoreProvider";
import { newTableItem } from "../../store/items/table-item";
import { GRID_SIZE } from "../../constants";
import { Item } from "../../store/items/base/item";


type ContexMenuProps = {
  clickPosPx: Vector,
  contextItem: Item
};

export const AddItem: Component<ContexMenuProps> = (props: ContexMenuProps) => {
  const userStore = useUserStore();
  const itemStore = useItemStore();
  const layoutStore = useLayoutStore();

  const calcBlockPositionGr = (page: PageItem, clickPosXPx: number, clickPosYPs: number): Vector => {
    // let propX = (clickPosXPx - page.computed_boundsPx?.x!) / page.computed_boundsPx?.w!;
    // let propY = (clickPosYPs - page.computed_boundsPx?.y!) / page.computed_boundsPx?.h!;
    const propX = 0.0;
    const propY = 0.0;
    return {
      x: Math.floor(page.innerSpatialWidthGr / GRID_SIZE * propX * 2.0) / 2.0,
      y: Math.floor(page.innerSpatialWidthGr / GRID_SIZE / page.naturalAspect * propY * 2.0) / 2.0
    };
  }

  const newPageInContext = () => {
    if (isPageItem(props.contextItem)) {
      let newPage = newPageItem(userStore.getUser()!.userId, props.contextItem?.id!, Child, "my new page", itemStore.newOrderingAtEndOfChildren(props.contextItem?.id!));
      newPage.spatialPositionGr = calcBlockPositionGr(asPageItem(props.contextItem!), props.clickPosPx.x, props.clickPosPx.y);

      itemStore.addItem(newPage);
      server.addItem(userStore.getUser()!, newPage);
      layoutStore.setContextMenuInfo(null);
    }
  };

  const newNoteInContext = () => {
    if (isPageItem(props.contextItem)) {
      let newNote = newNoteItem(userStore.getUser()!.userId, props.contextItem?.id!, Child, "my new note", itemStore.newOrderingAtEndOfChildren(props.contextItem?.id!));
      newNote.spatialPositionGr = calcBlockPositionGr(asPageItem(props.contextItem!), props.clickPosPx.x, props.clickPosPx.y);
      itemStore.addItem(newNote);
      server.addItem(userStore.getUser()!, newNote);
      layoutStore.setContextMenuInfo(null);
    }
  }

  const newTableInContext = () => {
    if (isPageItem(props.contextItem)) {
      let newTable = newTableItem(userStore.getUser()!.userId, props.contextItem?.id!, Child, "my new table", itemStore.newOrderingAtEndOfChildren(props.contextItem?.id!));
      newTable.spatialPositionGr = calcBlockPositionGr(asPageItem(props.contextItem!), props.clickPosPx.x, props.clickPosPx.y);
      itemStore.addItem(newTable);
      server.addItem(userStore.getUser()!, newTable);
      layoutStore.setContextMenuInfo(null);
    }
  }

  return (
    <div class="border rounded w-[250px] h-[55px] bg-slate-50 mb-1">
      <div class="text-slate-800 text-sm ml-1">Add new item here</div>
      <ToolbarIcon icon="folder" margin={18} clickHandler={newPageInContext} />
      <ToolbarIcon icon="table" margin={4} clickHandler={newTableInContext} />
      <ToolbarIcon icon="sticky-note" margin={8} clickHandler={newNoteInContext} />
    </div>
  );
}
