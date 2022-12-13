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

import { Component, Match, Switch } from "solid-js";
import { ContexMenuProps } from "./ContextMenu";
import { EditNote } from "./EditNote";
import { EditPage } from "./EditPage";

export const EditItem: Component<ContexMenuProps> = (props: ContexMenuProps) => {

  let typename = props.contextItem?.type;

  return (
    <div class="border rounded w-[300px] h-[100px] bg-slate-50">
      <div class="text-slate-800 text-sm ml-1">Edit {typename} <span class="ml-4 font-mono text-slate-400">{`${props.contextItem?.id}`}</span></div>
      <Switch fallback={<div>Not Found</div>}>
        <Match when={typename == "page"}>
          <EditPage clickPosPx={props.clickPosPx} contextItem={props.contextItem} />
        </Match>
        <Match when={typename == "note"}>
          <EditNote clickPosPx={props.clickPosPx} contextItem={props.contextItem} />
        </Match>
      </Switch>
    </div>
  );
}
