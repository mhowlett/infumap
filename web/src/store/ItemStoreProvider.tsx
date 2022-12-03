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

import { Accessor, createResource } from "solid-js";
import { Setter } from "solid-js";
import { JSX } from "solid-js";
import { createSignal, createContext, useContext } from "solid-js";
import { createStore } from "solid-js/store";
import { Vector } from "../geometry";
import { Item, Items } from "../items";


export interface ItemStoreContextModel {
  count: Accessor<number>,
  setCount: Setter<number>,
  pos: Accessor<Vector>,
  setPos: Setter<Vector>
}
export interface ItemStoreContextProps {
  children: JSX.Element
}

const fetchUser = async () => {
  var r = await (await fetch(`/test-json`)).json();
  console.log(r);
  return r;
}

const ItemStoreContext = createContext<ItemStoreContextModel>();

export function ItemStoreProvider(props: ItemStoreContextProps) {

  const [items, setItems] = createStore<Items>({
    rootId: null,
    fixed: {},
    moving: [],
    color: 2,
  });
  
  const [count, setCount] = createSignal<number>(0);
  const [user] = createResource(fetchUser);
  
  const [pos, setPos] = createSignal<Vector>({ x: 40, y: 40 });

  // const counter = [
  //     count,
  //     {
  //       increment() {
  //         setCount(c => c + 1);
  //       },
  //       decrement() {
  //         setCount(c => c - 1);
  //       }
  //     }
  //   ];

  const value: ItemStoreContextModel = {
    count, setCount,
    pos, setPos
  };

  return (
    <ItemStoreContext.Provider value={value}>
      {props.children}
    </ItemStoreContext.Provider>
  );
}

export function useItemStore() : ItemStoreContextModel {
  const context = useContext(ItemStoreContext);
  if (!context) { throw "context undefined"; }
  return context;
}
