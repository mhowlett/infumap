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

import { batch, JSX } from "solid-js";
import { createContext, useContext } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { panic, throwExpression } from "../util/lang";
import { asPageItem } from "./items/page-item";
import { Item, setFromParentId } from "./items/base/item";
import { Uid } from "../util/uid";
import { Items } from "./items";
import { Child, NoParent } from "../relationship-to-parent";
import { ContainerItem, isContainerItem } from "./items/base/container-item";


export interface ItemStoreContextModel {
  items: Items

  setRoot: (id: Uid) => void,
  setChildItems: (parentId: Uid, items: Array<Item>) => void,
  setAttachmentItems: (items: Array<Item>) => void
  updateItem: (id: Uid, f: (item: Item) => void) => void,
  getItem: (id: Uid) => Item | null,
  transitionToMove: (id: Uid) => void,
  transitionMovingToFixed: () => void,
  addItem: (item: Item) => void,
  replaceWithClone: (pageId: Uid) => void,
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
  };

  const getItem = (id: Uid): Item | null => {
    if (items.fixed.hasOwnProperty(id)) {
      return items.fixed[id];
    } else {
      for (let i=0; i<items.moving.length; ++i) {
        if (items.moving[i].id == id) {
          return items.moving[i];
        }
      }
    }
    return null;
  };

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
  const setChildItems = (parentId: Uid, childItems: Array<Item>): void => {
    batch(() => {
      childItems.forEach(childItem => {
        setItems("fixed", produce(itms => { itms[childItem.id] = childItem; }));
      });
      childItems.forEach(childItem => {
        if (childItem.parentId == null) {
          if (childItem.relationshipToParent != NoParent) { panic(); }
        } else {
          if (childItem.parentId != parentId) {
            throwExpression(`Child item had parent '${childItem.parentId}', but '${parentId}' was expected.`);
          }
          updateItem(childItem.parentId, parentItem => {
            if (!isContainerItem(parentItem)) { panic(); }
            (parentItem as ContainerItem).computed_children = [...(parentItem as ContainerItem).computed_children, childItem.id];
          });
        }
      });
    });
  };

  const setAttachmentItems = (items: Array<Item>): void => {
    throwExpression("not implemented yet");
  }

  const addItem = (item: Item): void => {
    setItems("fixed", produce(items => { items[item.id] = item; }));
    if (item.relationshipToParent == Child) {
      updateItem(item.parentId!, parentItem => {
        if (!isContainerItem(parentItem)) { panic(); }
        (parentItem as ContainerItem).computed_children = [...(parentItem as ContainerItem).computed_children, item.id];
      })
    } else {
      throwExpression("only support child relationships currently");
    }
  }

  const replaceWithClone = (currentPageId: Uid): void => {
    setItems("fixed", produce(items => {
      items[currentPageId] = { ...items[currentPageId] };
      return items;
    }));
  };

  const value: ItemStoreContextModel = { items, setRoot, setChildItems, setAttachmentItems, updateItem, getItem, transitionToMove, transitionMovingToFixed, addItem, replaceWithClone };

  return (
    <ItemStoreContext.Provider value={value}>
      {props.children}
    </ItemStoreContext.Provider>
  );
}

export function useItemStore() : ItemStoreContextModel {
  return useContext(ItemStoreContext) ?? panic();
}
