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

use std::time::{Duration, SystemTime};
use std::collections::HashMap;
use crate::util::infu::InfuResult;
use crate::util::uid::{new_uid, Uid};
use super::{kv_store::KVStore, session::Session};


/// Store for Session instances.
/// Not threadsafe.
/// Sessions are automatically removed if expired on init, or on get_session.
/// TODO (LOW): Remove expired sessions periodically as well.
/// TODO (LOW): Log compaction.
pub struct SessionStore {
  store: KVStore<Session>,
  ids_by_user: HashMap<String, Vec<String>>,
}

impl SessionStore {
  pub fn init(data_dir: &str) -> InfuResult<SessionStore> {
    const LOG_FILENAME: &str = "sessions.json";
    let mut store: KVStore<Session> = KVStore::init(data_dir, LOG_FILENAME)?;

    let mut to_remove = vec![];
    for (id, session) in store.get_iter() {
      if session.expires < SystemTime::now().duration_since(SystemTime::UNIX_EPOCH)?.as_secs() as i64 {
        to_remove.push(id.clone());
      }
    }
    for id in to_remove { store.remove(&id)? }

    let mut ids_by_user: HashMap<String, Vec<Uid>> = HashMap::new();
    for (id, session) in store.get_iter() {
      if let Some(vec) = ids_by_user.get_mut(&session.user_id) {
        vec.push(id.clone());
      } else {
        ids_by_user.insert(session.user_id.clone(), vec![id.clone()]);
      }
    }

    Ok(SessionStore { store, ids_by_user })
  }

  pub fn create_session(&mut self, user_id: &str) -> InfuResult<Session> {
    const THIRTY_DAYS_AS_SECONDS: u64 = 60*60*24*30;
    let session = Session {
      id: new_uid(),
      user_id: String::from(user_id).clone(),
      expires: (SystemTime::now().duration_since(SystemTime::UNIX_EPOCH)? + Duration::from_secs(THIRTY_DAYS_AS_SECONDS)).as_secs() as i64
    };
    self.store.add(session.clone())?;

    if !self.ids_by_user.contains_key(user_id) {
      self.ids_by_user.insert(String::from(user_id), vec![]);
    }
    self.ids_by_user.get_mut(user_id).unwrap().push(session.id.clone());

    Ok(session)
  }

  pub fn _delete_session(&mut self, id: &str) -> InfuResult<()> {
    let session =
      if let Some(session) = self.store.get(id) { session }
      else { return Err(format!("Session '{}' does not exist.", id).into()); };
    let user_id = session.user_id.clone();
  
    self.store.remove(id)?;
    let current_ids_for_user =
      if let Some(ids) = self.ids_by_user.remove(&user_id) { ids }
      else { return Err(format!("Session '{}' does not exist in ids_by_user map.", id).into()); };

    let new_ids_for_user: Vec<String> =
      current_ids_for_user.iter().filter(|vid| *vid != id).map(|v| v.clone()).collect();
    if new_ids_for_user.len() > 0 {
      self.ids_by_user.insert(user_id, new_ids_for_user);
    }

    Ok(())
  }

  pub fn _delete_sessions_for_user(&mut self, user_id: &str) -> InfuResult<()> {
    let ids =
      if let Some(ids) = self.ids_by_user.remove(user_id) { ids }
      else { return Ok(()) };

    for id in ids {
      self.store.remove(&id)?
    }

    Ok(())
  }

  pub fn _get_session(&mut self, id: &Uid) -> InfuResult<Option<Session>> {
    let session_copy =
      if let Some(s) = self.store.get(id) { s.clone() }
      else { return Ok(None); };

    if session_copy.expires < SystemTime::now().duration_since(SystemTime::UNIX_EPOCH)?.as_secs() as i64 {
      self._delete_session(id)?;
      Ok(None)
    } else {
      Ok(Some(session_copy))
    }
  }
}
