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

import { JSX } from "solid-js";
import { createContext, useContext } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { Item, Items, NoteItem, PageItem, Uid } from "./items";
import { panic } from "../util/lang";
import { RelationshipToParent } from "../relationship-to-parent";
import { defaultPageItemTransient } from "../types/items/page-item";
import { defaultNoteItemTransient } from "../types/items/note-item";


export interface ItemStoreContextModel {
  items: Items

  setRoot: (id: Uid) => void,
  setChildItems: (items: Array<Item>) => void,
  setAttachmentItems: (items: Array<Item>) => void
  updateItem: (id: Uid, f: (item: Item) => void) => void,
}

export interface ItemStoreContextProps {
  children: JSX.Element
}

const ItemStoreContext = createContext<ItemStoreContextModel>();

export function ItemStoreProvider(props: ItemStoreContextProps) {
  const [items, setItems] = createStore<Items>({
    rootId: null,
    fixed: {},
    moving: []
  });

  const setRoot = (id: Uid) => { setItems("rootId", id); };

  const updateItem = (id: Uid, f: (item: Item) => void) => {
    setItems("fixed", produce((items) => {
      let itm = items[id];
      f(itm);
      return items;
    }));
  }

  // Note: the items array contains the container item itself, in addition to the children, if the container is the root.
  const setChildItems = (itms: Array<Item>) => {
    itms.forEach(item => {
      setItems("fixed", produce((itms) => {
        if (item.type == "page") { (item as PageItem).transient = defaultPageItemTransient(); }
        else if (item.type == "note") { (item as NoteItem).transient = defaultNoteItemTransient(); }
        else { throw new Error(`unknown item type ${item.type}`); }
        itms[item.id] = item;
      }));
    });
    itms.forEach(item => {
      if (item.parentId == null) {
        if (item.relationshipToParent != RelationshipToParent.NoParent) {
          throw new Error("Expecting no relationship to parent");
        }
      } else {
        updateItem(item.parentId, (it) => {
          if (it.type == "page") {
            let pageItem = it as PageItem;
            pageItem.transient?.children.push(item.id);
          } else {
            throw new Error("Expecting item type to be page to add child");
          }
        });
      }
    });
  };

  const setAttachmentItems = (items: Array<Item>) => {
    throw new Error("not implemented yet");
  }


  const value: ItemStoreContextModel = { items, setRoot, setChildItems, setAttachmentItems, updateItem };

  return (
    <ItemStoreContext.Provider value={value}>
      {props.children}
    </ItemStoreContext.Provider>
  );
}

export function useItemStore() : ItemStoreContextModel {
  return useContext(ItemStoreContext) ?? panic();
}
