/* @refresh reload */
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

import { render } from 'solid-js/web';
import App from './components/App';
import "tailwindcss/tailwind.css";
import './index.css';
import { ItemStoreProvider } from './store/ItemStoreProvider';
import { LayoutStoreProvider } from './store/LayoutStoreProvider';
import { UserStoreProvider } from './store/UserStoreProvider';

// import { testUid } from './items';
// import { testEncodeDecode } from './util/base62';
// import { testOrdering } from './util/ordering';

if (false) {
  // testUid();
  // testEncodeDecode();
  // testOrdering();
}


render(() => (
  <ItemStoreProvider>
    <UserStoreProvider>
      <LayoutStoreProvider>
        <App />
      </LayoutStoreProvider>
    </UserStoreProvider>
  </ItemStoreProvider>
), document.getElementById('root') as HTMLElement);


fetch('/account/login', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ "username": "test", "password": "qwerty" })
})
.then(response => response.json())
.then(response => console.log(JSON.stringify(response)))
