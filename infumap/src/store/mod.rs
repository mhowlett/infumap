// Copyright (C) 2022 Matt Howlett
// This file is part of Infumap.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

use crate::util::infu::InfuResult;
use self::item_store::ItemStore;
use self::session_store::SessionStore;
use self::user_store::UserStore;

pub mod user;
pub mod user_store;
pub mod session;
pub mod session_store;
pub mod item;
pub mod item_store;
pub mod kv_store;


pub struct Store {
  pub user: UserStore,
  pub item: ItemStore,
  pub session: SessionStore
}

impl Store {
  pub fn new(data_dir: &str) -> InfuResult<Store> {
    Ok(Store {
      user: UserStore::init(data_dir)?,
      session: SessionStore::init(data_dir)?,
      item: ItemStore::init(data_dir)
    })
  }
}
