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
use self::item_db::ItemDb;
use self::session_db::SessionDb;
use self::user_db::UserDb;

pub mod user;
pub mod user_db;
pub mod session;
pub mod session_db;
pub mod item;
pub mod item_db;
pub mod kv_store;


pub struct Db {
  pub user: UserDb,
  pub item: ItemDb,
  pub session: SessionDb
}

impl Db {
  pub fn new(db_dir: &str) -> InfuResult<Db> {
    Ok(Db {
      user: UserDb::init(db_dir)?,
      session: SessionDb::init(),
      item: ItemDb::init(db_dir)
    })
  }
}
