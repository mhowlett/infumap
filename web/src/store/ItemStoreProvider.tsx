/*
  Copyright (C) 2022-2023 Matt Howlett
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

import { Accessor, batch, createSignal, JSX, Setter } from "solid-js";
import { createContext, useContext } from "solid-js";
import { panic, throwExpression } from "../util/lang";
import { asPageItem } from "./items/page-item";
import { cloneItem, Item } from "./items/base/item";
import { Uid } from "../util/uid";
import { Child, NoParent } from "../relationship-to-parent";
import { asContainerItem, ContainerItem, isContainerItem } from "./items/base/container-item";
import { newOrderingAtEnd } from "../util/ordering";


export interface ItemStoreContextModel {
  setRoot: (id: Uid) => void,
  setChildItems: (parentId: Uid, items: Array<Item>) => void,
  setAttachmentItems: (items: Array<Item>) => void
  updateItem: (id: Uid, f: (item: Item) => void) => void,
  getItem: (id: Uid) => Item | null,
  getFixedItem: (id: Uid) => Item | null,
  getMovingItems: () => Array<Item>,
  transitionToMove: (id: Uid) => void,
  transitionMovingToFixed: () => void,
  addItem: (item: Item) => void,
  replaceWithClone: (pageId: Uid) => void,
  newOrderingAtEndOfChildren: (parentId: Uid) => Uint8Array,
}

export interface ItemStoreContextProps {
  children: JSX.Element
}

const ItemStoreContext = createContext<ItemStoreContextModel>();

interface ItemSignal {
  item: Accessor<Item>,
  setItem: Setter<Item>,
}

function createItemSignal(item: Item): ItemSignal {
  let [itemAccessor, itemSetter] = createSignal<Item>(item);
  return { item: itemAccessor, setItem: itemSetter };
}

export function ItemStoreProvider(props: ItemStoreContextProps) {
  const [_rootId, setRootId] = createSignal<Uid | null>(null);
  let moving: Array<ItemSignal> = [];
  let fixed: { [id: Uid]: ItemSignal } = {};
  // Also need some way to keep track of parent pages that haven't been loaded yet.

  const setRoot = (id: Uid): void => { setRootId(id); };

  const updateItem = (id: Uid, f: (item: Item) => void): void => {
    if (fixed.hasOwnProperty(id)) {
      let clonedItem = cloneItem(fixed[id].item());
      f(clonedItem);
      fixed[id].setItem(clonedItem);
    } else {
      for (let i=0; i<moving.length; ++i) {
        if (moving[i].item().id == id) {
          let clonedItem = cloneItem(moving[i].item());
          f(clonedItem);
          moving[i].setItem(clonedItem);
          break;
        }
      }
    }
  };

  const getItem = (id: Uid): Item | null => {
    if (fixed.hasOwnProperty(id)) {
      return fixed[id].item();
    } else {
      for (let i=0; i<moving.length; ++i) {
        if (moving[i].item().id == id) {
          return moving[i].item();
        }
      }
    }
    return null;
  };

  const getFixedItem = (id: Uid): Item | null => {
    if (fixed.hasOwnProperty(id)) {
      return fixed[id].item();
    }
    return null;
  };

  const getMovingItems = (): Array<Item> => {
    return moving.map(i => i.item());
  }

  const transitionToMove = (id: Uid): void => {
    batch(() => { // must be atomic
      let itemSignal = fixed[id];
      delete fixed[id];
      let itemClone = cloneItem(itemSignal.item());
      itemClone.computed_fromParentIdMaybe = itemClone.parentId;
      itemSignal.setItem(itemClone);
      moving.push(itemSignal);

      let parent = asPageItem(cloneItem(fixed[itemSignal.item().parentId ?? panic()].item()));
      parent.computed_children = parent.computed_children.filter(item => item != id);
      fixed[parent.id].setItem(parent);
    });
  };

  const transitionMovingToFixed = (): void => {
    batch(() => { // must be atomic
      moving.forEach(itemSignal => {
        let cloned = cloneItem(itemSignal.item());
        cloned.computed_fromParentIdMaybe = null
        itemSignal.setItem(cloned);
        fixed[itemSignal.item().id] = itemSignal;

        let parentId = itemSignal.item().parentId ?? panic();
        let parent = asPageItem(cloneItem(fixed[parentId].item()));
        parent.computed_children.push(itemSignal.item().id);
        fixed[parentId].setItem(parent);
      });
    });
    moving = [];
  };

  // Note: the items array contains the container item itself, in addition to the children, if the container is the root.
  const setChildItems = (parentId: Uid, childItems: Array<Item>): void => {
    batch(() => {
      childItems.forEach(childItem => {
        fixed[childItem.id] = createItemSignal(childItem);
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
    batch(() => {
      fixed[item.id] = createItemSignal(item);
      if (item.relationshipToParent == Child) {
        updateItem(item.parentId!, parentItem => {
          if (!isContainerItem(parentItem)) { panic(); }
          (parentItem as ContainerItem).computed_children = [...(parentItem as ContainerItem).computed_children, item.id];
        })
      } else {
        throwExpression("only support child relationships currently");
      }
    });
  }

  const replaceWithClone = (currentPageId: Uid): void => {
    let itm = cloneItem(fixed[currentPageId].item());
    fixed[currentPageId].setItem(itm);
  };

  const newOrderingAtEndOfChildren = (parentId: Uid): Uint8Array => {
    let parent = asContainerItem(fixed[parentId].item());
    let children = parent.computed_children.map(c => fixed[c].item().ordering);
    return newOrderingAtEnd(children);
  }

  const value: ItemStoreContextModel = {
    setRoot, setChildItems, setAttachmentItems, updateItem,
    getItem, getFixedItem, getMovingItems, transitionToMove,
    transitionMovingToFixed, addItem, replaceWithClone,
    newOrderingAtEndOfChildren
  };

  return (
    <ItemStoreContext.Provider value={value}>
      {props.children}
    </ItemStoreContext.Provider>
  );
}

export function useItemStore() : ItemStoreContextModel {
  return useContext(ItemStoreContext) ?? panic();
}
