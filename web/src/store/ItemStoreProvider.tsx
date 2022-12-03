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

import { createResource } from "solid-js";
import { JSX } from "solid-js";
import { createContext, useContext } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";
import { Items } from "../items";
import { emptyItem } from "../types/items/base/item";


export interface ItemStoreContextModel {
  items: Items
  setItems: SetStoreFunction<Items>
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
  let item1 = emptyItem();
  item1.id = "0";
  item1.bxyForSpatial = { x: 80, y: 40 };
  let item2 = emptyItem();
  item2.id = "1";
  item2.bxyForSpatial = { x: 140, y: 50 };

  const [items, setItems] = createStore<Items>({
    rootId: null,
    fixed: {},
    moving: [item1, item2],
  });
  
  const [user] = createResource(fetchUser);

  const value: ItemStoreContextModel = {
    items, setItems
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
