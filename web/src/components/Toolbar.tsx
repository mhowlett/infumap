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
import ToolbarIcon from "./ToolbarIcon";
import imgUrl from '../assets/circle.png'


export const Toolbar: Component = () => {
    return (
        <div class="fixed left-0 top-0 bottom-0 w-[40px] border-r border-gray-800 text-gray-100"
             style="background-image: linear-gradient(270deg, rgba(40, 57, 83, 0.706), rgba(40, 57, 83, 0.784))">
            <img src={imgUrl} class="w-[28px] mt-[12px] ml-[5px]" />
            <div class="mt-[16px] uppercase rotate-90 whitespace-pre text-[22px]">
                matt
            </div>
            <div class="absolute bottom-0">
                <ToolbarIcon icon="ruler-horizontal" margin={4} />
                <ToolbarIcon icon="star" margin={4} />
                <ToolbarIcon icon="chart-area" margin={4} />
                <ToolbarIcon icon="money-check" margin={4} />
                <ToolbarIcon icon="font" margin={4} />
                <ToolbarIcon icon="sticky-note" margin={4} />
                <ToolbarIcon icon="file-upload" margin={18} />
                <ToolbarIcon icon="table" margin={4} />
                <ToolbarIcon icon="list-alt" margin={4} />
                <ToolbarIcon icon="folder" margin={18} />
                <div class="ml-[12px] mb-[12px]">
                    <i class="fa fa-user" />
                </div>
            </div>
        </div>
    );
}
