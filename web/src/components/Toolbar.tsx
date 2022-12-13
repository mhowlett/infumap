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

import { Component, Show } from "solid-js";
import imgUrl from '../assets/circle.png'
import { TOOLBAR_WIDTH } from "../constants";
import { asPageItem } from "../store/items/page-item";
import { useItemStore } from "../store/ItemStoreProvider";
import { useLayoutStore } from "../store/LayoutStoreProvider";
import { Colors } from "../style";
import { hexToRGBA } from "../util/color";


export const Toolbar: Component = () => {
  let layoutStore = useLayoutStore();
  let itemStore = useItemStore();

  return (
    <Show when={layoutStore.layout.currentPage != null}>
      <div class="fixed left-0 top-0 bottom-0 border-r border-gray-800 text-gray-100"
          style={`background-image: linear-gradient(270deg, ${hexToRGBA(Colors[asPageItem(itemStore.items.fixed[layoutStore.layout.currentPage!]).bgColorIdx], 0.786)}, ${hexToRGBA(Colors[asPageItem(itemStore.items.fixed[layoutStore.layout.currentPage!]).bgColorIdx], 0.864)}); width: ${TOOLBAR_WIDTH}px`}>
        <img src={imgUrl} class="w-[28px] mt-[12px] ml-[5px]" />
        <div class="mt-[16px] uppercase rotate-90 whitespace-pre text-[22px]">
          <Show when={layoutStore.layout.currentPage != null}>
            {itemStore.items.fixed[layoutStore.layout.currentPage!].title}
          </Show>
        </div>
        <div class="absolute bottom-0">
          <div class="ml-[12px] mb-[12px]">
            <i class="fa fa-user" />
          </div>
        </div>
      </div>
    </Show>
  );
}
