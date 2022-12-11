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
import { panic, throwExpression } from "../util/lang";
import { RelationshipToParent } from "../relationship-to-parent";
import { asPageItem, isPageItem, PageItem } from "./items/page-item";
import { Item, setFromParentId } from "./items/base/item";
import { Uid } from "../util/uid";
import { Items } from "./items";


export interface ItemStoreContextModel {
  items: Items

  setRoot: (id: Uid) => void,
  setChildItems: (items: Array<Item>) => void,
  setAttachmentItems: (items: Array<Item>) => void
  updateItem: (id: Uid, f: (item: Item) => void) => void,
  transitionToMove: (id: Uid) => void,
  transitionMovingToFixed: () => void,
  addItem: (item: Item) => void,
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

  const setRoot = (id: Uid): void => { setItems("rootId", id); };

  const updateItem = (id: Uid, f: (item: Item) => void): void => {
    if (items.fixed.hasOwnProperty(id)) {
      setItems("fixed", produce(items => {
        f(items[id]);
        return items;
      }));
    } else {
      setItems("moving", produce(items => {
        for (let i=0; i<items.length; ++i) {
          if (items[i].id == id) {
            f(items[i]);
            break;
          }
        }
      }));
    }
  }

  const transitionToMove = (id: Uid): void => {
    setItems(produce(items => {
      let item = items.fixed[id];
      delete items.fixed[id];
      asPageItem(items.fixed[item.parentId ?? panic()]).computed_children = asPageItem(items.fixed[item.parentId ?? panic()]).computed_children.filter(itm => itm != id);
      setFromParentId(item, item.parentId ?? panic());
      items.moving.push(item);
    }));
  };

  const transitionMovingToFixed = (): void => {
    setItems(produce(items => {
      let movingItems = items.moving;
      items.moving = [];
      movingItems.forEach(item => {
        items.fixed[item.id] = item;
        asPageItem(items.fixed[item.parentId ?? panic()]).computed_children.push(item.id);
      });
    }));
  };

  // Note: the items array contains the container item itself, in addition to the children, if the container is the root.
  const setChildItems = (itms: Array<Item>): void => {
    itms.forEach(item => {
      setItems("fixed", produce(items => { items[item.id] = item; }));
    });

    itms.forEach(item => {
      if (item.parentId == null) {
        if (item.relationshipToParent != RelationshipToParent.NoParent) { panic(); }
      } else {
        updateItem(item.parentId, parentItem => {
          if (!isPageItem(parentItem)) { panic(); }
          (parentItem as PageItem).computed_children.push(item.id);
        });
      }
    });
  };

  const setAttachmentItems = (items: Array<Item>): void => {
    throwExpression("not implemented yet");
  }

  const addItem = (item: Item): void => {
    setItems("fixed", produce(items => { items[item.id] = item; }));
    if (item.relationshipToParent == RelationshipToParent.Child) {
      updateItem(item.parentId!, parentItem => {
        if (!isPageItem(parentItem)) { panic(); }
        (parentItem as PageItem).computed_children.push(item.id);
      })
    } else {
      throwExpression("only support child relationships currently");
    }
  }

  const value: ItemStoreContextModel = { items, setRoot, setChildItems, setAttachmentItems, updateItem, transitionToMove, transitionMovingToFixed, addItem };

  return (
    <ItemStoreContext.Provider value={value}>
      {props.children}
    </ItemStoreContext.Provider>
  );
}

export function useItemStore() : ItemStoreContextModel {
  return useContext(ItemStoreContext) ?? panic();
}
