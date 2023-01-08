// Copyright (C) 2023 Matt Howlett
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

use std::path::PathBuf;
use std::fs;
use std::fs::File;
use std::io::Read;

use crate::util::infu::InfuResult;
use crate::util::uid::Uid;
use crate::util::fs::expand_tilde;


pub struct FileStore {
  files_dir: PathBuf,
}

impl FileStore {
  pub fn new(files_dir: &str) -> InfuResult<FileStore> {
    let files_dir = expand_tilde(files_dir).ok_or(format!("File store path '{}' is not valid.", files_dir))?;
    Ok(FileStore { files_dir })
  }

  pub fn get(&self, id: &Uid) -> InfuResult<Vec<u8>> {
    let mut path = self.files_dir.clone();
    path.push(&id[..2]);
    path.push(id);

    let mut f = File::open(&path)?;
    let mut buffer = vec![0; fs::metadata(&path)?.len() as usize];
    f.read(&mut buffer)?;
    Ok(buffer)
  }
}
