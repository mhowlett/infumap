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

use std::{time::{Duration, SystemTime}, sync::Mutex};

use crate::util::{infu::InfuResult, uid::{new_uid, Uid}};
use super::{kv_store::KVStore, session::Session};


pub struct SessionStore {
  store: Mutex<KVStore<Session>>,
}

/// KV store for Session instances.
/// Instances are automatically removed if expired on init, or on get_session.
/// TODO (LOW): remove expired sessions periodically as well.
/// TODO (LOW): log compaction.
impl SessionStore {
  pub fn init(data_dir: &str, log_file_name: &str) -> InfuResult<SessionStore> {
    let mut store: KVStore<Session> = KVStore::init(data_dir, log_file_name)?;
    let mut to_remove = vec![];
    for (id, session) in store.get_iter() {
      if session.expires < SystemTime::now().duration_since(SystemTime::UNIX_EPOCH)?.as_secs() as i64 {
        to_remove.push(id.clone());
      }
    }
    for id in to_remove { store.remove(&id)? }
    Ok(SessionStore { store: Mutex::new(store) })
  }

  pub fn create_session(&self, user_id: &str) -> InfuResult<Session> {
    const THIRTY_DAYS_AS_SECONDS: u64 = 60*60*24*30;
    let session = Session {
      id: new_uid(),
      user_id: String::from(user_id).clone(),
      expires: (SystemTime::now().duration_since(SystemTime::UNIX_EPOCH)? + Duration::from_secs(THIRTY_DAYS_AS_SECONDS)).as_secs() as i64
    };
    self.store.lock().unwrap().add(session.clone())?;
    Ok(session)
  }

  pub fn _get_session(&mut self, id: &Uid) -> InfuResult<Option<Session>> {
    let session_copy;
    if let Some(s) = self.store.lock().unwrap().get(id) { session_copy = s.clone(); }
    else { return Ok(None); }
    if session_copy.expires < SystemTime::now().duration_since(SystemTime::UNIX_EPOCH)?.as_secs() as i64 {
      self.store.lock().unwrap().remove(&session_copy.id)?;
      Ok(None)
    } else {
      Ok(Some(session_copy))
    }
  }
}
