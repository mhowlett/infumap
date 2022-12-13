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
  onIncrementalChange: ((v: string) => void) | null,
  onChange: ((v: string) => void) | null
};

export const TextInput: Component<TextInputProps> = (props: TextInputProps) => {
  let textInput: HTMLInputElement | undefined;

  const keyDownHandler = (_ev: Event) => {
    // The input element value does not change immediately on key down, so wait a bit.
    // This also gives desired behavior for ctrl-v. For paste otherwise, also just reuse this method.
    if (props.onIncrementalChange != null) { setTimeout(() => { props.onIncrementalChange!(textInput!.value) }, 10); }
  }

  const changeHandler = (_ev: Event) => {
    if (props.onChange != null) { props.onChange(textInput!.value); }
  }

  return (
    <input ref={textInput}
           class="border"
           value={props.value}
           onPaste={keyDownHandler}
           onKeyDown={keyDownHandler}
           onChange={changeHandler} />
  );
}
