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

import { Component, For } from "solid-js";
import { useItemStore } from "../store/ItemStoreProvider";
import { Rectangle } from "./Rectangle";


export const Desktop: Component = () => {
  const c = useItemStore();
  return (
    <div class="fixed left-[40px] top-0 bottom-0 right-0 select-none outline-none">
      <For each={c.items.moving}>
        { item => <Rectangle id={item.id} /> }
      </For>
    </div>
  );
}
