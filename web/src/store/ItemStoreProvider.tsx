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
import { createStore, produce, SetStoreFunction } from "solid-js/store";
import { constructDummyItemsForTesting, Item, Items, Uid } from "../items";
import { throwExpression } from "../util/lang";


export interface ItemStoreContextModel {
  items: Items
  setItems: SetStoreFunction<Items>,
  updateItem: (id: Uid, f: (item: Item) => void) => void
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
  // const [user] = createResource(fetchUser);
  const [items, setItems] = createStore<Items>(constructDummyItemsForTesting());
  const updateItem = (id: Uid, f: (item: Item) => void) => {
    setItems("fixed", produce((items) => {
      let itm = items[id];
      f(itm);
      return items;
    }));
  }
  const value: ItemStoreContextModel = { items, setItems, updateItem };


  return (
    <ItemStoreContext.Provider value={value}>
      {props.children}
    </ItemStoreContext.Provider>
  );
}

export function useItemStore() : ItemStoreContextModel {
  return useContext(ItemStoreContext) ?? throwExpression("context undefined");
}
