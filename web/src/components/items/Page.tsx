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
import { BoundingBox } from "../../util/geometry";
import { useLayoutStore } from "../../store/LayoutStoreProvider";
import { asPageItem, PageItem } from "../../store/items/page-item";
import { CHILD_ITEMS_VISIBLE_WIDTH_BL, GRID_SIZE, LINE_HEIGHT_PX } from "../../constants";
import { hexToRGBA } from "../../util/color";
import { Colors } from "../../style";
import { TableItem } from "../../store/items/table-item";
import { ItemGeometry } from "../../item-geometry";


export const Page: Component<{itemGeometry: ItemGeometry}> = (props: {itemGeometry: ItemGeometry}) => {
  let { item, boundsPx } = props.itemGeometry;
  let pageItem = asPageItem(item);

  const layoutStore = useLayoutStore();

  // Current top page.
  if (item.id == layoutStore.currentPageId()) {
    return (
      <div id={item.id}
           class={`absolute`}
           style={`left: ${boundsPx.x}px; top: ${boundsPx.y}px; width: ${boundsPx.w}px; height: ${boundsPx.h}px;`}>
      </div>
    );
  }

  // Too small for inside items to be visible. Opaque.
  if (pageItem.spatialWidthGr / GRID_SIZE < CHILD_ITEMS_VISIBLE_WIDTH_BL) {
    return (
      <div id={item.id}
           class={`absolute border border-slate-700 rounded-sm shadow-lg`}
           style={`left: ${boundsPx.x}px; top: ${boundsPx.y}px; width: ${boundsPx.w}px; height: ${boundsPx.h}px; ` +
                  `background-image: linear-gradient(270deg, ${hexToRGBA(Colors[pageItem.backgroundColorIndex], 0.986)}, ${hexToRGBA(Colors[pageItem.backgroundColorIndex], 1.0)});`}>
        <div class="flex items-center justify-center" style={`width: ${boundsPx.w}px; height: ${boundsPx.h}px;`}>
          <div class="flex items-center text-center text-xs font-bold text-white">
            {pageItem.title}
          </div>
        </div>
      </div>
    );
  }

  // Show child items. Translucent.
  return (
    <div id={item.id}
         class={`absolute border border-slate-700 rounded-sm shadow-lg`}
         style={`left: ${boundsPx.x}px; top: ${boundsPx.y}px; width: ${boundsPx.w}px; height: ${boundsPx.h}px; ` +
                `background-image: linear-gradient(270deg, ${hexToRGBA(Colors[pageItem.backgroundColorIndex], 0.386)}, ${hexToRGBA(Colors[pageItem.backgroundColorIndex], 0.364)});`}>
      <div class="flex items-center justify-center" style={`width: ${boundsPx.w}px; height: ${boundsPx.h}px;`}>
        <div class="flex items-center text-center text-xl text-white">
          {pageItem.title}
        </div>
      </div>
    </div>
  );
}

export const PageInTable: Component<{ item: PageItem, parentTable: TableItem, boundsPx: BoundingBox }> = (props: { item: PageItem, parentTable: TableItem, boundsPx: BoundingBox }) => {
  let scale = props.boundsPx.h / LINE_HEIGHT_PX;
  let widthBl = props.parentTable.spatialWidthGr / GRID_SIZE;
  let oneBlockWidthPx = props.boundsPx.w / widthBl;

  return (
    <>
    <div class="absolute"
         style={`left: ${props.boundsPx.x}px; top: ${props.boundsPx.y}px; width: ${oneBlockWidthPx}px; height: ${props.boundsPx.h}px; ` + 
                `background-image: linear-gradient(270deg, ${hexToRGBA(Colors[props.item.backgroundColorIndex], 0.386)}, ${hexToRGBA(Colors[props.item.backgroundColorIndex], 0.364)}); ` +
                `transform: scale(${0.7}); transform-origin: center center;`}>
    </div>
    <div class="absolute overflow-hidden"
         style={`left: ${props.boundsPx.x + oneBlockWidthPx}px; top: ${props.boundsPx.y}px; width: ${props.boundsPx.w - oneBlockWidthPx}px; height: ${props.boundsPx.h}px; `}>
      <div class="absolute"
           style={`line-height: ${LINE_HEIGHT_PX}px; transform: scale(${scale}); transform-origin: top left;`}>
        { props.item.title }
      </div>
    </div>
    </>
  );
}
