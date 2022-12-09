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

import { Component, For, Match, Switch } from "solid-js";
import { NoteItem, PageItem } from "../store/items";
import { useItemStore } from "../store/ItemStoreProvider";
import { useLayoutStore } from "../store/LayoutStoreProvider";
import { asPageItem } from "../types/items/page-item";
import { throwExpression } from "../util/lang";
import { Note } from "./items/Note";
import { Page } from "./items/Page";


export const Desktop: Component = () => {
  const is = useItemStore();
  const ls = useLayoutStore();

  let getCurrentPageItems = () => {
    if (ls.layout.currentPage == null) { return []; }
    let currentPage = asPageItem(is.items.fixed[ls.layout.currentPage]);
    let r = [currentPage, ...currentPage.computed.children.map(c => is.items.fixed[c])];
    return r;
  };

  return (
    <div class="fixed left-[40px] top-0 bottom-0 right-0 select-none outline-none">
      <For each={getCurrentPageItems()}>
        { item => {
          return (
            <Switch fallback={<div>Not Found</div>}>
              <Match when={item.type == "page"}>
                <Page item={item as PageItem} />
              </Match>
              <Match when={item.type == "note"}>
                <Note item={item as NoteItem} />
              </Match>
            </Switch>
          )}
        }
      </For>
    </div>
  );
}
