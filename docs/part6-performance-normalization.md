# Redux Essentials, Part 6: Performance and Normalizing Data

> ##### WHAT YOU'LL LEARN
>
> - createSelector によるメモ型セレクター関数の作成方法
> - コンポーネントのレンダリング性能を最適化するパターン。
> - createEntityAdapter を使用して，正規化されたデータを保存および更新する方法。

> ##### PREREQUISITES
>
> - Completion of [Part 5](https://redux.js.org/tutorials/essentials/part-5-async-logic) to understand data fetching flow

## Introduction[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#introduction)

第 5 回「非同期ロジックとデータ取得」では、サーバー API からデータを取得するための非同期サンクの書き方、非同期リクエストの読み込み状態を処理するパターン、Redux の状態からデータのルックアップをカプセル化するためのセレクタ関数の使用について見てきました。

このセクションでは、アプリケーションの良好なパフォーマンスを確保するための最適化パターンと、ストア内のデータの一般的な更新を自動的に処理するためのテクニックを見ていきます。

これまでのところ、機能のほとんどは投稿機能を中心としたものでした。これからアプリにいくつかの新しいセクションを追加していきます。新しいセクションを追加した後は、どのように構築したかの具体的な詳細を見て、これまでに構築したものの弱点や、実装を改善する方法について話します。

## Adding User Pages[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#adding-user-pages)

フェイク API からユーザーのリストを取得し、新しい投稿を追加する際にユーザーを著者として選択できるようにしています。しかし、ソーシャルメディアアプリでは、特定のユーザーのページを見て、そのユーザーが行ったすべての投稿を確認する機能が必要です。そこで、全ユーザーの一覧を表示するページと、特定のユーザーの投稿を表示するページを追加してみましょう。

まず、新しい`<UsersList>`コンポーネントを追加します。このコンポーネントは、useSelector を使ってストアからデータを読み込み、配列をマッピングしてユーザーのリストと個別ページへのリンクを表示するという、通常のパターンを採用しています。

```jsx
// features/users/UsersList.js

import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { selectAllUsers } from './usersSlice';

export const UsersList = () => {
  const users = useSelector(selectAllUsers);

  const renderedUsers = users.map((user) => (
    <li key={user.id}>
      <Link to={`/users/${user.id}`}>{user.name}</Link>
    </li>
  ));

  return (
    <section>
      <h2>Users</h2>

      <ul>{renderedUsers}</ul>
    </section>
  );
};
```

まだ selectAllUsers セレクターがないので、selectUserById セレクターと一緒に usersSlice.js に追加する必要があります。

```js
// features/users/usersSlice.js
export default usersSlice.reducer;

export const selectAllUsers = (state) => state.users;

export const selectUserById = (state, userId) => state.users.find((user) => user.id === userId);
```

そして、`<UserPage>`を追加します。これは、ルーターから userId パラメータを受け取るという点で、`<SinglePostPage>`と似ています。

```jsx
// features/users/UserPage.js
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { selectUserById } from '../users/usersSlice';
import { selectAllPosts } from '../posts/postsSlice';

export const UserPage = ({ match }) => {
  const { userId } = match.params;

  const user = useSelector((state) => selectUserById(state, userId));

  const postsForUser = useSelector((state) => {
    const allPosts = selectAllPosts(state);
    return allPosts.filter((post) => post.user === userId);
  });

  const postTitles = postsForUser.map((post) => (
    <li key={post.id}>
      <Link to={`/posts/${post.id}`}>{post.title}</Link>
    </li>
  ));

  return (
    <section>
      <h2>{user.name}</h2>

      <ul>{postTitles}</ul>
    </section>
  );
};
```

これまで見てきたように、ある useSelector 呼び出しや props からデータを取得し、それを使って別の useSelector 呼び出しでストアから何を読み取るかを決めることができます。

いつものように、これらのコンポーネントのルートを`<App>`に追加します。

```jsx
// App.js
          <Route exact path="/posts/:postId" component={SinglePostPage} />
          <Route exact path="/editPost/:postId" component={EditPostForm} />
          <Route exact path="/users" component={UsersList} />
          <Route exact path="/users/:userId" component={UserPage} />
          <Redirect to="/" />
```

また、`<Navbar>`に/users にリンクする別のタブを追加し、クリックして`<UsersList>`に移動できるようにします。

```jsx
// app/Navbar.js
export const Navbar = () => {
  return (
    <nav>
      <section>
        <h1>Redux Essentials Example</h1>

        <div className="navContent">
          <div className="navLinks">
            <Link to="/">Posts</Link>
            <Link to="/users">Users</Link>
          </div>
        </div>
      </section>
    </nav>
  );
};
```

## Adding Notifications[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#adding-notifications)

ソーシャルメディアアプリは、誰かがメッセージを送ったり、コメントを残したり、私たちの投稿に反応したりしたことを知らせる通知がないと成り立ちません。

実際のアプリケーションでは、アプリのクライアントはバックエンドのサーバーと常に通信しており、サーバーは何かが起こるたびにクライアントに更新情報をプッシュしています。これは小さなサンプルアプリなので、偽の API から実際に通知エントリを取得するボタンを追加することで、このプロセスを模倣するつもりです。また、メッセージを送信したり投稿に反応したりする他の実在のユーザーはいないので、偽の API は私たちがリクエストするたびにランダムな通知エントリを作成するだけです。(ここでの目的は、Redux 自体の使い方を確認することであることを忘れないでください。)

### Notifications Slice[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#notifications-slice)

これはアプリの新しい部分なので、最初のステップは、通知用の新しいスライスと、API からいくつかの通知エントリを取得するための非同期サンクを作成することです。現実的な通知を作成するために、状態にある最新の通知のタイムスタンプを含めることにします。これにより、モックサーバはそのタイムスタンプよりも新しい通知を生成することができます。

```jsx
// features/notifications/notificationsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { client } from '../../api/client';

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async (_, { getState }) => {
  const allNotifications = selectAllNotifications(getState());
  const [latestNotification] = allNotifications;
  const latestTimestamp = latestNotification ? latestNotification.date : '';
  const response = await client.get(`/fakeApi/notifications?since=${latestTimestamp}`);
  return response.data;
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: [],
  reducers: {},
  extraReducers: {
    [fetchNotifications.fulfilled]: (state, action) => {
      state.push(...action.payload);
      // Sort with newest first
      state.sort((a, b) => b.date.localeCompare(a.date));
    },
  },
});

export default notificationsSlice.reducer;

export const selectAllNotifications = (state) => state.notifications;
```

他のスライスと同様に、notificationsReducer を store.js にインポートし、configureStore()の呼び出しに追加します。

fetchNotifications という非同期サンクを書き、サーバーから新しい通知のリストを取得します。その際、最新の通知の作成タイムスタンプをリクエストの一部として使用し、実際に新しい通知のみを送り返すべきであることをサーバーに認識させたいと考えています。

通知の配列が返されることはわかっているので、それらを別々の引数として state.push()に渡すと、配列が各アイテムを追加します。また、万が一サーバーから順番に送信されてしまった場合に備えて、最新の通知が配列の最後に来るようにソートされていることを確認しておきます。(注意点として、array.sort()は常に既存の配列を変異させます。これは内部で createSlice と Immer を使用しているからこそ安全なのです)

### Thunk Arguments[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#thunk-arguments)

`fetchNotifications`サンクを見てみると、これまでに見たことのない新しいものがあります。thunk の引数について少し説明します。

`dispatch(addPost(newPost))`のように、thunk のアクションクリエイターをディスパッチする際に引数を渡すことができることはすでに見てきました。createAsyncThunk では、1 つの引数しか渡すことができず、渡した引数はペイロード作成コールバックの第 1 引数になります。

ペイロード作成の第 2 引数は、いくつかの便利な関数や情報を含む thunkAPI オブジェクトです。

- `dispatch`と`getState`: Redux ストアの実際の dispatch と getState メソッドです。これらを thunk 内で使用することで、より多くのアクションをディスパッチしたり、最新の Redux ストアの状態を取得したりすることができます（別のアクションがディスパッチされた後に更新された値を読み取るなど）。
- `extra`: ストア作成時に thunk ミドルウェアに渡すことができる「追加引数」です。これは通常、ある種の API ラッパーであり、アプリケーションのサーバーに API コールを行い、データを返す方法を知っている関数のセットなどで、thunk がすべての URL やクエリロジックを直接内部に持たなくても済むようにします。
- `requestId`: この thunk コールのユニークなランダム ID 値。個々のリクエストのステータスを追跡するのに便利です。
  シグナル。AbortController.signal 関数。進行中のリクエストをキャンセルする際に使用します。
- `rejectWithValue`：Thunk がエラーを受け取った場合に、拒否されたアクションの内容をカスタマイズするためのユーティリティです。

(createAsyncThunk を使わずに手書きで thunk を書いている場合、thunk 関数は get(dispatch, getState)を 1 つのオブジェクトにまとめるのではなく、別々の引数として受け取ることになります)。

> ##### INFO
>
> これらの引数の詳細や、サンクやリクエストをキャンセルする際の処理方法については、[`createAsyncThunk`](https://redux-toolkit.js.org/api/createAsyncThunk) API のリファレンスページを参照してください。

このケースでは、通知のリストが Redux ストアの状態にあり、最新の通知が配列の最初にあるべきだということがわかっています。thunkAPI オブジェクトから getState 関数をデストラクションし、それを呼び出して state の値を読み取り、selectAllNotifications セレクタを使って通知の配列だけを得ることができます。通知の配列は最新のものから順に並べられているので、配列のデストラクションを使って最新のものを取り出すことができます。

### Adding the Notifications List[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#adding-the-notifications-list)

このスライスを作成した後、`<NotificationsList>`コンポーネントを追加します。

```jsx
// features/notifications/NotificationsList.js
import React from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { selectAllUsers } from '../users/usersSlice';

import { selectAllNotifications } from './notificationsSlice';

export const NotificationsList = () => {
  const notifications = useSelector(selectAllNotifications);
  const users = useSelector(selectAllUsers);

  const renderedNotifications = notifications.map((notification) => {
    const date = parseISO(notification.date);
    const timeAgo = formatDistanceToNow(date);
    const user = users.find((user) => user.id === notification.user) || {
      name: 'Unknown User',
    };

    return (
      <div key={notification.id} className="notification">
        <div>
          <b>{user.name}</b> {notification.message}
        </div>
        <div title={notification.date}>
          <i>{timeAgo} ago</i>
        </div>
      </div>
    );
  });

  return (
    <section className="notificationsList">
      <h2>Notifications</h2>
      {renderedNotifications}
    </section>
  );
};
```

今回も、Redux の状態からアイテムのリストを読み込み、それらをマッピングして、各アイテムのコンテンツをレンダリングしています。

また、`<Navbar>`を更新して「Notifications」タブを追加し、いくつかの通知を取得するための新しいボタンを追加する必要があります。

```jsx
// app/Navbar.js
import React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import { fetchNotifications } from '../features/notifications/notificationsSlice';

export const Navbar = () => {
  const dispatch = useDispatch();

  const fetchNewNotifications = () => {
    dispatch(fetchNotifications());
  };

  return (
    <nav>
      <section>
        <h1>Redux Essentials Example</h1>

        <div className="navContent">
          <div className="navLinks">
            <Link to="/">Posts</Link>
            <Link to="/users">Users</Link>
            <Link to="/notifications">Notifications</Link>
          </div>
          <button className="button" onClick={fetchNewNotifications}>
            Refresh Notifications
          </button>
        </div>
      </section>
    </nav>
  );
};
```

最後に、App.js を更新して「Notifications」ルートを表示できるようにする必要があります。

```jsx
// App.js
// omit imports
import { NotificationsList } from './features/notifications/NotificationsList';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="App">
        <Switch>
          <Route exact path="/notifications" component={NotificationsList} />
          // omit existing routes
          <Redirect to="/" />
        </Switch>
      </div>
    </Router>
  );
}
```

これまでの「Notifications」タブの様子です。

<img src="https://redux.js.org/assets/images/notifications-initial-78eeb6d749f8287ebebe6a8b4e28efae.png" alt="notifications" style="zoom:67%;" />

### Showing New Notifications[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#showing-new-notifications)

「Refresh Notifications」をクリックするたびに、いくつかの通知エントリがリストに追加されます。実際のアプリケーションでは、UI の他の部分を見ている間に、これらの通知がサーバーから送られてくることがあります。同様のことは、`<PostsList>`や`<UserPage>`を見ているときに「通知を更新」をクリックすることでもできます。しかし、今のところ、いくつの通知が届いたのかわかりませんし、ボタンをクリックし続けると、まだ読んでいない通知がたくさんあるかもしれません。そこで、どの通知がすでに読まれていて、どの通知が「新着」なのかを追跡するロジックを追加してみましょう。そうすれば、ナビバーの「通知」タブに「未読」通知の数をバッジで表示したり、新しい通知を別の色で表示したりすることができます。

私たちの偽の API は、すでに isNew と read フィールドを持つ通知エントリを送り返しているので、私たちのコードでそれらを使用することができます。

まず、notificationsSlice を更新して、すべての通知を既読としてマークするリデューサと、既存の通知を「not new」としてマークするためのロジックを追加します。

```js
// features/notifications/notificationsSlice.js
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: [],
  reducers: {
    allNotificationsRead(state, action) {
      state.forEach((notification) => {
        notification.read = true;
      });
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.push(...action.payload);
      state.forEach((notification) => {
        // Any notifications we've read are no longer new
        notification.isNew = !notification.read;
      });
      // Sort with newest first
      state.sort((a, b) => b.date.localeCompare(a.date));
    });
  },
});

export const { allNotificationsRead } = notificationsSlice.actions;

export default notificationsSlice.reducer;
```

通知を表示するためにタブをクリックした場合や、すでに開いていて追加の通知を受け取った場合など、`<NotificationsList>`コンポーネントがレンダリングされるたびに、これらの通知を既読としてマークしたいと思います。これは、このコンポーネントが再レンダリングするたびに allNotificationsRead をディスパッチすることで実現できます。更新時に古いデータがフラッシュするのを防ぐために、このアクションを useLayoutEffect フックでディスパッチしています。また、ページ内のすべての通知リストエントリに追加のクラス名を追加して、それらを強調したいと思います。

```jsx
// features/notifications/NotificationsList.js
import React, { useLayoutEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { formatDistanceToNow, parseISO } from 'date-fns';
import classnames from 'classnames';

import { selectAllUsers } from '../users/usersSlice';

import { selectAllNotifications, allNotificationsRead } from './notificationsSlice';

export const NotificationsList = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectAllNotifications);
  const users = useSelector(selectAllUsers);

  useLayoutEffect(() => {
    dispatch(allNotificationsRead());
  });

  const renderedNotifications = notifications.map((notification) => {
    const date = parseISO(notification.date);
    const timeAgo = formatDistanceToNow(date);
    const user = users.find((user) => user.id === notification.user) || {
      name: 'Unknown User',
    };

    const notificationClassname = classnames('notification', {
      new: notification.isNew,
    });

    return (
      <div key={notification.id} className={notificationClassname}>
        <div>
          <b>{user.name}</b> {notification.message}
        </div>
        <div title={notification.date}>
          <i>{timeAgo} ago</i>
        </div>
      </div>
    );
  });

  return (
    <section className="notificationsList">
      <h2>Notifications</h2>
      {renderedNotifications}
    </section>
  );
};
```

これは動作しますが、実は少し驚くべき動作があります。新しい通知があると（このタブに切り替わったか、API から新しい通知を取得したか）、実際に 2 つの "notifications/allNotificationsRead "アクションがディスパッチされるのがわかります。これはなぜでしょうか？

例えば、`<PostsList>`を見ながらいくつかの通知を取得し、その後 "Notifications "タブをクリックしたとしましょう。`<NotificationsList>`コンポーネントがマウントされ、`useLayoutEffect`コールバックが最初のレンダリングの後に実行され、`allNotificationsRead`をディスパッチします。私たちの`notificationsSlice`は、ストア内の通知エントリを更新することでこれを処理します。これにより、不変的に更新されたエントリを含む新しい `state.notifications`配列が作成され、コンポーネントは useSelector から返された新しい配列を見て再びレンダリングを行い、`useLayoutEffect` フックが再び実行されて 2 度目の `allNotificationsRead`がディスパッチされます。reducer は再び実行されますが、今回はデータが変更されないため、コンポーネントは再レンダリングされません。

この 2 回目のディスパッチを回避する方法はいくつかあります。例えば、コンポーネントがマウントされたときに 1 回ディスパッチし、notifications 配列のサイズが変更されたときにのみ再度ディスパッチするようにロジックを分割することができます。しかし、これは実際には何の支障もありませんので、そのままにしておきます。

これは、アクションをディスパッチしても、状態の変化が全く起こらないことが可能であることを示しています。実際にステートを更新する必要があるかどうかは、常にレデューサが決めることであり、「何も起こらない」という判断はレデューサにとって有効であることを覚えておいてください。

new/read ビヘイビアが動作するようになった notification タブの様子は以下の通りです。

<img src="https://redux.js.org/assets/images/notifications-new-47a4cee8ef5292cc65a8b4b89245c112.png" alt="notifications" style="zoom:67%;" />

次に進む前の最後の作業として、ナビバーの「Notifications」タブにバッジを追加します。これにより、他のタブにいるときに「未読」の通知数が表示されます。

```jsx
// app/Navbar.js
// omit imports
import { useDispatch, useSelector } from 'react-redux';

import { fetchNotifications, selectAllNotifications } from '../features/notifications/notificationsSlice';

export const Navbar = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectAllNotifications);
  const numUnreadNotifications = notifications.filter((n) => !n.read).length;
  // omit component contents
  let unreadNotificationsBadge;

  if (numUnreadNotifications > 0) {
    unreadNotificationsBadge = <span className="badge">{numUnreadNotifications}</span>;
  }
  return (
    <nav>
      // omit component contents
      <div className="navLinks">
        <Link to="/">Posts</Link>
        <Link to="/users">Users</Link>
        <Link to="/notifications">Notifications {unreadNotificationsBadge}</Link>
      </div>
      // omit component contents
    </nav>
  );
};
```

## Improving Render Performance[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#improving-render-performance)

このアプリケーションは便利ですが、実はコンポーネントの再レンダリングのタイミングと方法にいくつかの問題があります。これらの問題を検討し、パフォーマンスを向上させるための方法を考えてみましょう。

### Investigating Render Behavior[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#investigating-render-behavior)

React DevTools Profiler を使って、状態が更新されたときにどのコンポーネントが再レンダリングされるかをいくつかのグラフで見ることができます。1 人のユーザーの`<UserPage>`をクリックしてみてください。ブラウザの DevTools を開き、React の「Profiler」タブで、左上の丸い「Record」ボタンをクリックします。その後、当アプリの「通知を更新」ボタンをクリックし、React DevTools Profiler で記録を停止します。以下のようなチャートが表示されるはずです。

<img src="https://redux.js.org/assets/images/userpage-rerender-d064bb5a9461960f5949ba996597c3f7.png" alt="devtool" style="zoom:75%;" />

これは、更新された「未読の通知」バッジをタブに表示する必要があったためです。しかし、なぜ`<UserPage>`は再レンダリングされたのでしょうか？

Redux DevTools で最後にディスパッチされたアクションを調べてみると、通知の状態だけが更新されていることがわかります。`<UserPage>`は通知を読んでいないので、再レンダリングされるはずがありません。コンポーネントに何か問題があるのでしょう。

`<UserPage>`を注意深く見てみると、特定の問題があります。

```jsx
// features/UserPage.js

export const UserPage = ({ match }) => {
  const { userId } = match.params;

  const user = useSelector((state) => selectUserById(state, userId));

  const postsForUser = useSelector((state) => {
    const allPosts = selectAllPosts(state);
    return allPosts.filter((post) => post.user === userId);
  });

  // omit rendering logic
};
```

useSelector はアクションがディスパッチされるたびに再実行され、新しい参照値を返すとコンポーネントの再レンダリングが強制されることがわかっています。

useSelector フックの中で filter()を呼び出し、このユーザーに属する投稿のリストのみを返すようにしています。残念ながら、**これは useSelector が常に新しい配列参照を返すことを意味しており、投稿データが変わっていなくても、アクションのたびにコンポーネントが再レンダリングされてしまいます。**

### Memoizing Selector Functions[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#memoizing-selector-functions)

本当に必要なのは、state.posts か userId のどちらかが変更された場合にのみ、新しいフィルタリングされた配列を計算する方法です。もし変更がなければ、前回と同じフィルタリングされた配列の参照を返したいのです。

このアイデアは「メモ化」と呼ばれています。前回の入力と計算結果を保存しておき、入力が同じであれば、再度計算するのではなく、前回の結果を返すようにします。

これまでは、セレクタ関数を自分たちで書いていましたが、ストアからデータを読み込むためのコードをコピー＆ペーストしなくて済むようにするためです。もし、セレクタ関数をメモ化する方法があれば、素晴らしいと思います。

[Reselect](https://github.com/reduxjs/reselect) はメモ化されたセレクタ関数を作成するためのライブラリで、Redux で使用するために特別に設計されています。Reselect には、入力が変更されたときにのみ結果を再計算するメモライズドセレクタを生成する createSelector 関数があります。Redux Toolkit は[createSelector 関数をエクスポート](https://redux-toolkit.js.org/api/createSelector)しているので、すでに利用可能です。

それでは、Reselect を使って新しい selectPostsByUser セレクタ関数を作り、ここで使ってみましょう。

```js
// features/posts/postsSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

// omit slice logic

export const selectAllPosts = (state) => state.posts.posts;

export const selectPostById = (state, postId) => state.posts.posts.find((post) => post.id === postId);

export const selectPostsByUser = createSelector([selectAllPosts, (state, userId) => userId], (posts, userId) =>
  posts.filter((post) => post.user === userId)
);
```

createSelector は、1 つ以上の「入力セレクタ」関数と「出力セレクタ」関数を引数にとります。selectPostsByUser(state, userId)を呼び出すと、createSelector はすべての引数をそれぞれの入力セレクタに渡します。それらの入力セレクタが返すものが、出力セレクタの引数になります。

この場合、出力セレクタの 2 つの引数として、すべての投稿の配列とユーザ ID が必要であることがわかります。既存の selectAllPosts セレクタを再利用して、posts 配列を抽出することができます。ユーザー ID は selectPostsByUser に渡す 2 番目の引数なので、userId を返すだけの小さなセレクタを書くことができます。

出力セレクタは、posts と userId を受け取り、そのユーザの投稿のフィルタリングされた配列を返します。

selectPostsByUser を何度も呼び出してみると、posts か userId のどちらかが変更された場合にのみ、出力セレクタが再実行されます。

```js
const state1 = getState();
// Output selector runs, because it's the first call
selectPostsByUser(state1, 'user1');
// Output selector does _not_ run, because the arguments haven't changed
selectPostsByUser(state1, 'user1');
// Output selector runs, because `userId` changed
selectPostsByUser(state1, 'user2');

dispatch(reactionAdded());
const state2 = getState();
// Output selector does not run, because `posts` and `userId` are the same
selectPostsByUser(state2, 'user2');

// Add some more posts
dispatch(addNewPost());
const state3 = getState();
// Output selector runs, because `posts` has changed
selectPostsByUser(state3, 'user2');
```

`<UserPage>`でこのセレクタを呼び出し、通知の取得中に React プロファイラを再実行すると、今度は`<UserPage>`が再レンダリングされないことがわかるはずです。

```jsx
export const UserPage = ({ match }) => {
  const { userId } = match.params;

  const user = useSelector((state) => selectUserById(state, userId));

  const postsForUser = useSelector((state) => selectPostsByUser(state, userId));

  // omit rendering logic
};
```

メモライズドセレクタは、React+Redux アプリケーションのパフォーマンスを向上させるための貴重なツールです。不必要な再レンダリングを避けることができ、また、入力データが変化していない場合は、複雑で高価な可能性のある計算を行わないようにすることができるからです。

> INFO
>
> なぜセレクタ関数を使うのか、また Reselect でメモライズドセレクタを書く方法については
>
> - [Using Redux: Deriving Data with Selectors](https://redux.js.org/usage/deriving-data-selectors)

### Investigating the Posts List[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#investigating-the-posts-list)

`<PostsList>`に戻り、React プロファイラのトレースを取得しながら、いずれかの投稿のリアクションボタンをクリックしてみると、`<PostsList>`と更新された`<PostExcerpt>`インスタンスがレンダリングされただけでなく、`<PostExcerpt>`コンポーネントのすべてがレンダリングされたことがわかります。

<img src="https://redux.js.org/assets/images/postslist-rerender-cf83ea2e96266af8ce3027d614f0c574.png" alt="profiler" style="zoom:75%;" />

なぜでしょうか？他の記事はどれも変わっていないのに、なぜ再レンダリングする必要があるのか？

[React のデフォルトの動作は、親コンポーネントがレンダリングすると、React はその中のすべての子コンポーネントを再帰的にレンダリングするというものです！](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/) 1 つの投稿オブジェクトの不変的な更新により、新しい投稿配列も作成されました。投稿配列が新しい参照であったため、`<PostsList>`は再レンダリングしなければならず、それがレンダリングされた後、React は下方に進み、`<PostExcerpt>`のすべてのコンポーネントも再レンダリングしました。

小さなサンプルアプリでは深刻な問題ではありませんが、大規模な現実世界のアプリでは、非常に長いリストや非常に大きなコンポーネントツリーがあるかもしれず、これらの余分なコンポーネントがすべて再レンダリングされると、処理が遅くなる可能性があります。

`<PostsList>`でこの動作を最適化するには、いくつかの方法があります。

まず、`<PostExcerpt>`コンポーネントを React.memo()でラップすることで、プロップが実際に変更された場合にのみ、その中のコンポーネントが再レンダリングされるようにします。これは実際にうまくいくでしょう。試して何が起こるかを見てください。

```jsx
// "features/posts/PostsList.js
let PostExcerpt = ({ post }) => {
  // omit logic
};

PostExcerpt = React.memo(PostExcerpt);
```

別の方法としては、`<PostsList>`を書き換えて、posts 配列全体ではなく、ストアからポスト ID のリストだけを選択するようにし、`<PostExcerpt>`を書き換えて、postId の prop を受け取り、useSelector を呼び出して必要なポストオブジェクトを読み取るようにします。`<PostsList>`が以前と同じ ID リストを取得した場合は、再レンダリングの必要はありませんので、変更した`<PostExcerpt>`コンポーネントのみがレンダリングを行う必要があります。

残念ながら、すべての投稿を日付ごとにソートして、正しい順序でレンダリングする必要があるため、これは厄介なことになります。postsSlice を更新して配列を常にソートしておき、コンポーネント内でソートする必要がないようにし、メモライズドセレクタを使用して投稿 ID のリストだけを抽出します。また、useSelector が結果を確認するために実行する比較関数を、`useSelector(selectPostIds, shallowEqual)`のようにカスタマイズして、IDs 配列の内容が変わっていなければ再レンダリングをスキップするようにすることもできます。

最後の選択肢は、reducer にすべての投稿の ID の別の配列を保持させ、投稿が追加または削除されたときのみその配列を変更する方法を見つけ、`<PostsList>`と`<PostExcerpt>`を同じように書き換えることです。こうすることで、`<PostsList>`は ID の配列が変更されたときにだけ再レンダリングすればよいことになります。

便利なことに、Redux Toolkit には createEntityAdapter という関数があり、これを利用することができます。

## Normalizing Data[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#normalizing-data)

ロジックの多くは、ID フィールドでアイテムを検索していることがわかりました。データを配列に格納しているので、目的の ID を持つアイテムが見つかるまで、array.find()を使って配列内のすべてのアイテムをループする必要があります。

現実的にはそれほど時間はかかりませんが、何百、何千ものアイテムを含む配列があった場合、1 つのアイテムを見つけるために配列全体を探すのは無駄な作業になります。そこで必要になるのが、他の項目をすべて調べなくても、ID をもとに直接、1 つの項目を調べる方法です。このプロセスは「正規化」と呼ばれています。

### Normalized State Structure[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#normalized-state-structure)

"Normalized state" means that:

- 私たちの状態では、各特定のデータのコピーは 1 つだけなので、重複はありません。
- 正規化されたデータはルックアップテーブルに格納され、アイテム ID がキーとなり、アイテム自体が値となります。
- また、特定のアイテムタイプのすべての ID の配列がある場合もあります。

JavaScript のオブジェクトは、他の言語でいうところの「マップ」や「辞書」のようなルックアップテーブルとして使用することができます。ユーザーオブジェクトのグループの正規化された状態は次のようになります。

```js
{
  users: {
    ids: ["user1", "user2", "user3"],
    entities: {
      "user1": {id: "user1", firstName, lastName},
      "user2": {id: "user2", firstName, lastName},
      "user3": {id: "user3", firstName, lastName},
    }
  }
}
```

これにより、配列内の他のすべてのユーザーオブジェクトをループすることなく、特定のユーザーオブジェクトをその ID で簡単に見つけることができます。

```js
const userId = 'user2';
const userObject = state.users.entities[userId];
```

> ##### INFO
>
> 状態を正規化することがなぜ有効なのか、詳しくは「[Normalizing State Shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)」と「Redux Toolkit Usage Guide」の「[Managing Normalized Data](https://redux-toolkit.js.org/usage/usage-guide#managing-normalized-data)」のセクションを参照してください。

### Managing Normalized State with `createEntityAdapter`[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#managing-normalized-state-with-createentityadapter)

Redux Toolkit の createEntityAdapter API は、データをスライスに格納するための標準的な方法を提供し、それらを`{ ids: [], entities: {} }`の形に整形します. この定義済みの状態の形とともに、そのデータをどのように扱うかを知っているレデューサー関数とセレクターのセットを生成します。

これにはいくつかの利点があります。

- 正規化を管理するコードを自分で書く必要はありません。
- createEntityAdapter にあらかじめ組み込まれている reducer 関数は、「これらすべてのアイテムを追加する」、「1 つのアイテムを更新する」、「複数のアイテムを削除する」などの一般的なケースを処理します。
- createEntityAdapter は、アイテムの内容に基づいたソート順で ID 配列を保持することができ、アイテムが追加／削除されたり、ソート順が変更された場合にのみ、その配列を更新します。

createEntityAdapter は、sortComparer 関数を含むオプション・オブジェクトを受け入れます。sortComparer 関数は、2 つのアイテムを比較することによって、アイテム ID の配列をソート順に保つために使用されます（Array.sort() と同じように動作します）。

エンティティステートオブジェクトから[アイテムを追加、更新、削除するために生成されたリデューサ関数のセットを含むオブジェクト](https://redux-toolkit.js.org/api/createEntityAdapter#crud-functions)を返します。これらのリデューサ関数は、特定のアクションタイプのケースリデューサとして使用することも、createSlice の他のリデューサ内の「ミューティング」ユーティリティー関数として使用することもできます。

アダプタオブジェクトには getSelectors という関数もあります。Redux のルート状態からこの特定のスライス状態を返すセレクタを渡すと、selectAll や selectById などのセレクタが生成されます。

最後に、アダプタ・オブジェクトには getInitialState 関数があり、空の `{ids: [], entities: {}} `オブジェクトを生成します。getInitialState には、さらに多くのフィールドを渡すことができ、それらはマージされます。

### Updating the Posts Slice[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#updating-the-posts-slice)

これを踏まえて、postsSlice を更新して createEntityAdapter を使うようにしてみましょう。

```js
// features/posts/postsSlice.js
import {
  createEntityAdapter,
  // omit other imports
} from '@reduxjs/toolkit';

const postsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = postsAdapter.getInitialState({
  status: 'idle',
  error: null,
});

// omit thunks

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    reactionAdded(state, action) {
      const { postId, reaction } = action.payload;
      const existingPost = state.entities[postId];
      if (existingPost) {
        existingPost.reactions[reaction]++;
      }
    },
    postUpdated(state, action) {
      const { id, title, content } = action.payload;
      const existingPost = state.entities[id];
      if (existingPost) {
        existingPost.title = title;
        existingPost.content = content;
      }
    },
  },
  extraReducers(builder) {
    // omit other reducers

    builder
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add any fetched posts to the array
        // Use the `upsertMany` reducer as a mutating update utility
        postsAdapter.upsertMany(state, action.payload);
      })
      // Use the `addOne` reducer for the fulfilled case
      .addCase(addNewPost.fulfilled, postsAdapter.addOne);
  },
});

export const { postAdded, postUpdated, reactionAdded } = postsSlice.actions;

export default postsSlice.reducer;

// Export the customized selectors for this adapter using `getSelectors`
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
  // Pass in a selector that returns the posts slice of state
} = postsAdapter.getSelectors((state) => state.posts);

export const selectPostsByUser = createSelector([selectAllPosts, (state, userId) => userId], (posts, userId) =>
  posts.filter((post) => post.user === userId)
);
```

盛りだくさんの内容です。それを分解してみましょう。

まず、`createEntityAdapte`r をインポートし、これを呼び出して`postsAdapter`オブジェクトを作成します。すべての投稿 ID の配列を最新の投稿から順に並べたいことがわかっているので、`post.date`フィールドに基づいて新しいアイテムを最前面に並べる `sortComparer` 関数を渡します。

`getInitialState()`は、空の`{ids: ID: [], entities: {}}`正規化された状態オブジェクトを返します。`postsSlice`では、状態を読み込むために`status`と`error`フィールドも保持する必要があるので、それらを`getInitialState()`に渡しています。

投稿が` state.entities` のルックアップテーブルとして保持されるようになったので、`reactionAdded` と `postUpdated` のリデューサを変更して、古い投稿配列をループする代わりに、正しい投稿をその ID で直接検索するようにします。

`addNewPost.fulfilled` アクションを受け取ると、新しいポストオブジェクトを 1 つだけステートに追加する必要があることがわかります。アダプタの関数を直接リデューサとして使うことができるので、アクションを処理するためのリデューサ関数として postsAdapter.addOne を渡します。

最後に、古い手書きの `selectAllPosts` と s`electPostById` のセレクタ関数を `postsAdapter.getSelectors` で生成されたものに置き換えます。セレクタはルートの Redux ステートオブジェクトで呼び出されるため、Redux ステートのどこに投稿データがあるかを知る必要があります。そこで、state.posts を返す小さなセレクタを渡します。生成されたセレクタ関数は常に selectAll と selectById という名前なので、ES6 のデストラクション構文を使ってエクスポート時に名前を変更し、古いセレクタ名と一致させることができます。また、selectPostIds も同じようにエクスポートします。これは、ソートされたポスト ID のリストを`<PostsList>`コンポーネントで読みたいからです。

### Optimizing the Posts List[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#optimizing-the-posts-list)

posts slice が createEntityAdapter を使用しているので、`<PostsList>` を更新してレンダリング動作を最適化することができます。

ここでは、`<PostsList>` を更新して、投稿 ID のソートされた配列だけを読み取り、postId を各 `<PostExcerpt>` に渡します。

```jsx
// features/posts/PostsList.js
// omit other imports

import { selectAllPosts, fetchPosts, selectPostIds, selectPostById } from './postsSlice';

let PostExcerpt = ({ postId }) => {
  const post = useSelector((state) => selectPostById(state, postId));
  // omit rendering logic
};

export const PostsList = () => {
  const dispatch = useDispatch();
  const orderedPostIds = useSelector(selectPostIds);

  // omit other selections and effects

  if (postStatus === 'loading') {
    content = <Spinner text="Loading..." />;
  } else if (postStatus === 'succeeded') {
    content = orderedPostIds.map((postId) => <PostExcerpt key={postId} postId={postId} />);
  } else if (postStatus === 'error') {
    content = <div>{error}</div>;
  }

  // omit other rendering
};
```

さて、React コンポーネントのパフォーマンスプロファイルを取得しながら、ある投稿のリアクションボタンをクリックしてみると、その 1 つのコンポーネントだけが再レンダリングされることがわかります。

<img src="https://redux.js.org/assets/images/postslist-optimized-dcf59b403248250ec88d365fe04221ad.png" alt="profiler" style="zoom:75%;" />

## Converting Other Slices[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#converting-other-slices)

これでほぼ完了です。最後の仕上げとして、他の 2 つのスライスも同様に createEntityAdapter を使用するように更新します。

### Converting the Users Slice[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#converting-the-users-slice)

usersSlice はかなり小さいので、変更すべき点は少ししかありません。

```js
// features/users/usersSlice.js
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';
import { client } from '../../api/client';

const usersAdapter = createEntityAdapter();

const initialState = usersAdapter.getInitialState();

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await client.get('/fakeApi/users');
  return response.users;
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchUsers.fulfilled, usersAdapter.setAll);
  },
});

export default usersSlice.reducer;

export const { selectAll: selectAllUsers, selectById: selectUserById } = usersAdapter.getSelectors(
  (state) => state.users
);
```

ここで扱っている唯一のアクションは、常にユーザーのリスト全体を、サーバーから取得した配列で置き換えるものです。代わりに usersAdapter.setAll を使って実装することができます。

`<AddPostForm>` は、`<PostAuthor>` と同様に state.users を配列として読み取ろうとしています。それぞれ selectAllUsers と selectUserById を使用するように更新します。

### Converting the Notifications Slice[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#converting-the-notifications-slice)

最後になりましたが、notificationsSlice も更新します。

```js
// features/notifications/notificationsSlice.js
import { createSlice, createAsyncThunk, createEntityAdapter } from '@reduxjs/toolkit';

import { client } from '../../api/client';

const notificationsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.date.localeCompare(a.date),
});

// omit fetchNotifications thunk

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: notificationsAdapter.getInitialState(),
  reducers: {
    allNotificationsRead(state, action) {
      Object.values(state.entities).forEach((notification) => {
        notification.read = true;
      });
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      Object.values(state.entities).forEach((notification) => {
        // Any notifications we've read are no longer new
        notification.isNew = !notification.read;
      });
      notificationsAdapter.upsertMany(state, action.payload);
    });
  },
});

export const { allNotificationsRead } = notificationsSlice.actions;

export default notificationsSlice.reducer;

export const { selectAll: selectAllNotifications } = notificationsAdapter.getSelectors((state) => state.notifications);
```

再び createEntityAdapter をインポートして呼び出し、notificationsAdapter.getInitialState() を呼び出してスライスの設定を助けます。

皮肉なことに、ここにはすべての通知オブジェクトをループして更新する必要がある箇所がいくつかあります。これらはもはや配列で保持されていないので、Object.values(state.entities)を使用してこれらの通知の配列を取得し、それをループさせる必要があります。一方で、以前のフェッチ・アップデート・ロジックを notificationsAdapter.upsertMany で置き換えることができます。

これで、Redux Toolkit の基本的なコンセプトと機能を学ぶことができました。

## What You've Learned[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#what-youve-learned)

このセクションでは、たくさんの新しい動作を作りました。これらの変更によってアプリがどのように見えるか見てみましょう。

このセクションで取り上げた内容は次のとおりです。

> SUMMARY
>
> - **メモライズドセレクター機能を使って、パフォーマンスを最適化することができます。**
>   - Redux Toolkit は、メモライズドセレクタを生成する Reselect の createSelector 関数を再 export しています。
>   - メモ化されたセレクタは、入力セレクタが新しい値を返した場合にのみ、結果を再計算します。
>   - メモ化により、高価な計算を省略し、同じ結果参照が返されるようにすることができます。
> - **Redux で React コンポーネントのレンダリングを最適化するために使用できるパターンは複数あります。**
>   - useSelector の中で新しいオブジェクトや配列の参照を作らないようにしてください - 不必要な再レンダリングを引き起こします。
>   - メモ化されたセレクタ関数を useSelector に渡すことで、レンダリングを最適化することができます。
>   - useSelector は、参照の等値性の代わりに shallowEqual のような代替比較関数を受け入れることができます。
>   - コンポーネントは、React.memo()でラップして、プロップが変更された場合にのみ再レンダリングすることができます。
>   - リストのレンダリングを最適化するには、リストの親コンポーネントにアイテムの ID の配列だけを読み込ませ、その ID をリストアイテムの子コンポーネントに渡し、子コンポーネントで ID ごとにアイテムを取得する方法があります。
> - **正規化された状態の構造は、アイテムを格納するための推奨されたアプローチです。**
>   - "ノーマライゼーション "とは、データを重複させず、ルックアップテーブルに格納されているアイテムをアイテム ID で管理することです。
>   - 正規化された状態の形状は、通常、`{ids: [], entities: {}}` のようになります。
> - **Redux Toolkit の`createEntityAdapter` API は、正規化されたデータをスライスで管理するのに役立ちます。**
>   - sortComparer オプションを渡すことで、アイテム ID をソート順に保つことができます。
>   - The adapter object includes:
>     - adapter.getInitialState は、ロード状態などの追加の状態フィールドを受け入れることができます。
>     - setAll、addMany、upsertOne、removeMany などの一般的なケースに対応した、あらかじめ構築されたレデューサーを含みます。
>     - adapter.getSelectors は、selectAll や selectById といったセレクタを生成します。

## What's Next?[#](https://redux.js.org/tutorials/essentials/part-6-performance-normalization#whats-next)

Redux Essentials チュートリアルには、さらにいくつかのセクションがありますが、ここで一旦停止して、学んだことを実践するのに適した場所です。

このチュートリアルでこれまでに取り上げた概念は、React と Redux を使って自分のアプリケーションを作り始めるのに十分なものです。今は、これらのコンセプトを固め、実際にどのように機能するかを確認するために、自分でプロジェクトに取り組んでみる絶好の機会です。どのようなプロジェクトを作ればよいかわからない場合は、[アプリプロジェクトのアイデアのリスト](https://github.com/florinpop17/app-ideas)を見て、インスピレーションを得てください。

**Redux Toolkit には、"RTK Query "と呼ばれる強力なデータフェッチとキャッシングの API も含まれています。**RTK Query はオプションのアドオンで、データ取得のロジックを自分で書く必要を完全になくすことができます。パート 7 「RTK Query の基本」では、RTK Query とは何か、どのような問題を解決するのか、アプリケーションでキャッシュデータを取得して使用するにはどうすればよいのかを学びます。

Redux Essentials のチュートリアルでは、「どのように動作するか」や「なぜこのように動作するか」ではなく、「Redux を正しく使用する方法」に焦点を当てました。特に、Redux Toolkit はより上位の抽象化とユーティリティのセットであり、RTK の抽象化が実際に何をしてくれるのかを理解するのに役立ちます。[「Redux Fundamentals」のチュートリアル](https://redux.js.org/tutorials/fundamentals/part-1-overview)を読めば、Redux のコードを「手書き」で書く方法や、Redux のロジックを書くデフォルトの方法として Redux Toolkit を推奨している理由を理解できるでしょう。

[「Using Redux」](https://redux.js.org/usage/index)のセクションには、Reducer をどのように構成するかなど、多くの重要なコンセプトに関する情報があり、[「Style Guide」](https://redux.js.org/style-guide/style-guide)のページには、推奨パターンやベストプラクティスに関する重要な情報があります。

Redux がなぜ存在するのか、どのような問題を解決しようとしているのか、どのように使われることを意図しているのかについてもっと知りたい方は、Redux のメンテナである Mark Erikson の[「The Tao of Redux, Part 1: Implementation and Intent」](https://blog.isquaredsoftware.com/2017/05/idiomatic-redux-tao-of-redux-part-1/)と[「The Tao of Redux, Part 2: Practice and Philosophy」](https://blog.isquaredsoftware.com/2017/05/idiomatic-redux-tao-of-redux-part-2/)の投稿をご覧ください。

Redux に関する質問の助けを求めている方は、Discord の Reactiflux サーバーの#redux チャンネルに参加してください。

このチュートリアルを読んでいただきありがとうございました。また、Redux でのアプリケーション構築をお楽しみください。
