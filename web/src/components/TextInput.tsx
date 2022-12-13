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

export type TextInputProps = {
  value: string,
  onChange: (v: string) => void
};

export const TextInput: Component<TextInputProps> = (props: TextInputProps) => {
  let textInput: HTMLInputElement | undefined;

  // TODO (HIGH): handle copy/paste (onchange i think)
  let keyDownHandler = (ev: KeyboardEvent) => {
    setTimeout(() => {
      props.onChange(textInput?.value!)
    }, 10);
  }

  return (
    <input ref={textInput} class="border" value={props.value} onKeyDown={keyDownHandler} />
  );
}
