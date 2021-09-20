# Redux Essentials, Part 3: Basic Redux Data Flow

>  translated by DeepL

**WHAT YOU'LL LEARN**

- How to add "slices" of reducer logic to the Redux store with createSlice
- Reading Redux data in components with the useSelector hook
- Dispatching actions in components with the useDispatch hook

**PREREQUISITES**

- Familiarity with key Redux terms and concepts like "actions", "reducers", "store", and "dispatching". (See [**Part 1: Redux Overview and Concepts**](https://redux.js.org/tutorials/essentials/part-1-overview-concepts) for explanations of these terms.)

## Introduction[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#introduction)

パート1では Reduxの概要とコンセプトでは、アプリのグローバルな状態を一元的に管理できる場所を提供することで、Reduxがどのように保守性の高いアプリの構築に役立つかを説明しました。また、アクションオブジェクトのディスパッチ、新しいステート値を返すReducer関数の使用、Thunksを使用した非同期ロジックの記述など、Reduxのコアコンセプトについても説明しました。パート2：Reduxアプリの構造では、Redux ToolkitのconfigureStoreやcreateSlice、React-ReduxのProviderやuseSelectorなどのAPIがどのように連携して、Reduxのロジックを書き、そのロジックをReactコンポーネントから操作することができるかを見ました。

さて、これらの部品が何であるかをある程度理解したところで、その知識を実践してみましょう。これから小さなソーシャルメディアフィードアプリを作りますが、これには実世界のユースケースを示す多くの機能が含まれています。これにより、自分のアプリケーションでReduxを使用する方法を理解することができます。

##### CAUTION

このサンプルアプリは、本番に対応した完全なプロジェクトとしてではありません。目的は、ReduxのAPIと典型的な使用パターンを学び、いくつかの限られた例を使って正しい方向を示すことです。また、私たちが作った初期の作品の一部は、より良い方法を示すために後にアップデートされます。チュートリアル全体に目を通し、すべてのコンセプトを確認してください。

### Project Setup[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#project-setup)

このチュートリアルでは、設定済みのスタータープロジェクトを作成しました。このスタータープロジェクトでは、すでにReactとReduxが設定されており、いくつかのデフォルトのスタイリングが含まれており、アプリ内で実際のAPIリクエストを書くことができるように偽のREST APIが用意されています。このプロジェクトをベースにして、実際のアプリケーションコードを書いていきます。

You can also [clone the same project from this Github repo](https://github.com/reduxjs/redux-essentials-example-app). After cloning the repo, you can install the tools for the project with `npm install`, and start it with `npm start`.

If you'd like to see the final version of what we're going to build, you can check out [the **`tutorial-steps` branch**](https://github.com/reduxjs/redux-essentials-example-app/tree/tutorial-steps), or [look at the final version in this CodeSandbox](https://codesandbox.io/s/github/reduxjs/redux-essentials-example-app/tree/tutorial-steps).

> We'd like to thank [Tania Rascia](https://www.taniarascia.com/), whose [Using Redux with React](https://www.taniarascia.com/redux-react-guide/) tutorial helped inspire the example in this page. It also uses her [Primitive UI CSS starter](https://taniarascia.github.io/primitive/) for styling.

#### Creating a New Redux + React Project[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#creating-a-new-redux--react-project)

このチュートリアルを終えたら、おそらく自分のプロジェクトに取り組んでみたくなるでしょう。新しいRedux + Reactプロジェクトを作成する最速の方法として、Create-React-AppのReduxテンプレートの使用をお勧めします。このテンプレートには、Redux ToolkitとReact-Reduxがすでに設定されており、パート1で見たのと同じ「カウンター」アプリの例を使っています。これにより、Reduxのパッケージを追加したり、ストアを設定したりすることなく、すぐに実際のアプリケーションコードを書くことができます。

プロジェクトにReduxを追加する方法の具体的な詳細を知りたい場合は、こちらの説明をご覧ください。

**Detailed Explanation: Adding Redux to a React Project**

CRAのReduxテンプレートには、Redux ToolkitとReact-Reduxがすでに設定されています。そのテンプレートを使わずに、最初から新しいプロジェクトを立ち上げる場合は、以下の手順に従ってください。

- Add the `@reduxjs/toolkit` and `react-redux` packages
- Create a Redux store using RTK's `configureStore` API, and pass in at least one reducer function
- Import the Redux store into your application's entry point file (such as `src/index.js`)
- Wrap your root React component with the `<Provider>` component from React-Redux, like:

```tsx
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```

#### Exploring the Initial Project[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#exploring-the-initial-project)

Let's take a quick look at what the initial project contains:

- `/public`: the HTML host page template and other static files like icons
- `/src`
  - `index.js`: the entry point file for the application. It renders the React-Redux `<Provider>` component and the main `<App>` component.
  - `App.js`: the main application component. Renders the top navbar and handles client-side routing for the other content.
  - `index.css`: styles for the complete application
  - `/api`
    - `client.js`: a small AJAX request client that allows us to make GET and POST requests
    - `server.js`: provides a fake REST API for our data. Our app will fetch data from these fake endpoints later.
  - `/app`
    - `Navbar.js`: renders the top header and nav content
    - `store.js`: creates the Redux store instance

今、アプリをロードすると、ヘッダーとウェルカムメッセージが表示されているはずです。また、Redux DevTools Extensionを開いて、Reduxの初期状態が完全に空であることを確認できます。

## Main Posts Feed[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#main-posts-feed)

ソーシャルメディアフィードアプリの主な機能は、投稿の一覧表示です。今後、この機能にいくつかの機能を追加していく予定ですが、まず最初の目標は、画面上に投稿の一覧のみを表示することです。

### Creating the Posts Slice[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#creating-the-posts-slice)

最初のステップは、投稿のデータを格納する新しいReduxの「スライス」を作成することです。Reduxのストアにデータが入ったら、そのデータをページに表示するためのReactコンポーネントを作成します。

srcの中に新しいfeaturesフォルダを作成し、featuresの中にpostsフォルダを置き、postsSlice.jsという新しいファイルを追加します。

Redux ToolkitのcreateSlice関数を使って、投稿データの扱い方を知っているreducer関数を作ります。reducer関数には初期データが含まれている必要があり、アプリの起動時にReduxストアにこれらの値が読み込まれるようになっています。

ここでは、偽のpostオブジェクトを格納した配列を作成し、UIの追加を開始します。

createSliceをインポートして、最初のposts配列を定義し、それをcreateSliceに渡し、createSliceが生成してくれたpostsリデューサ関数をエクスポートします。

features/posts/postsSlice.js

```js
import { createSlice } from '@reduxjs/toolkit'

const initialState = [
  { id: '1', title: 'First Post!', content: 'Hello!' },
  { id: '2', title: 'Second Post', content: 'More text' }
]

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {}
})

export default postsSlice.reducer
```

新しいスライスを作成するたびに、そのレデューサー関数をReduxストアに追加する必要があります。すでにReduxストアが作成されていますが、今は中にデータが入っていません。app/store.jsを開き、postsReducer関数をインポートし、postsReducerがpostsという名前のreducerフィールドとして渡されるようにconfigureStoreの呼び出しを更新します。

```js
import { configureStore } from '@reduxjs/toolkit'

import postsReducer from '../features/posts/postsSlice'

export default configureStore({
  reducer: {
    posts: postsReducer
  }
})
```

これはReduxに、トップレベルのstateオブジェクトにpostsというフィールドを持たせ、アクションがディスパッチされたときにpostsReducer関数によってstate.postsのすべてのデータが更新されるように指示しています。

Redux DevTools Extensionを開き、現在の状態の内容を見ることで、この動作を確認することができます。

<img src="https://redux.js.org/assets/images/example-initial-posts-f00f1a94398a31484c97fd7916633bad.png" alt="redux-dev-tool" style="zoom:75%;" />

### Showing the Posts List[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#showing-the-posts-list)

ストアに投稿データができたので、投稿のリストを表示するReactコンポーネントを作成します。フィードポスト機能に関連するコードはすべてpostsフォルダに置く必要があるので、そこにPostsList.jsという新しいファイルを作成してください。

投稿のリストを表示するには、どこかからデータを取得する必要があります。Reactコンポーネントは、React-ReduxライブラリのuseSelectorフックを使って、Reduxストアからデータを読み込むことができます。あなたが書いた「セレクタ関数」は、Reduxのステートオブジェクト全体をパラメータとして呼び出され、このコンポーネントがストアから必要とする特定のデータを返さなければなりません。

最初のPostsListコンポーネントは、Reduxストアからstate.postsの値を読み取り、投稿の配列をループして、それぞれの投稿を画面に表示します。

`features/posts/PostsList.js`

```js
import React from 'react'
import { useSelector } from 'react-redux'

export const PostsList = () => {
  const posts = useSelector(state => state.posts)

  const renderedPosts = posts.map(post => (
    <article className="post-excerpt" key={post.id}>
      <h3>{post.title}</h3>
      <p className="post-content">{post.content.substring(0, 100)}</p>
    </article>
  ))

  return (
    <section className="posts-list">
      <h2>Posts</h2>
      {renderedPosts}
    </section>
  )
}
```

次に、App.jsのルーティングを更新して、「ようこそ」というメッセージの代わりにPostsListコンポーネントを表示する必要があります。PostsListコンポーネントをApp.jsにインポートして、welcomeテキストを`<PostsList />`に置き換えます。また、このコンポーネントをReact Fragmentでラップします。なぜなら、すぐにメインページに何かを追加する予定だからです。

Once that's added, the main page of our app should now look like this:

<img src="https://redux.js.org/assets/images/working_post_list-f2f507f15b46413695ee314d2e32f7ff.png" style="zoom:67%;" />

プログレス! Reduxのストアにデータを追加し、それをReactコンポーネントで画面に表示しました。

### Adding New Posts[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#adding-new-posts)

他の人が書いた記事を見るのもいいですが、自分でも記事を書けるようにしたいですよね。そこで、記事を書いて保存できる「新しい記事の追加」フォームを作ってみましょう。

まず、空のフォームを作成し、ページに追加します。そして、このフォームをReduxストアに接続して、「投稿を保存」ボタンをクリックすると新しい投稿が追加されるようにします。

#### Adding the New Post Form[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#adding-the-new-post-form)

postsフォルダにAddPostForm.jsを作成します。記事のタイトル用のテキスト入力と、記事の本文用のテキストエリアを追加します。

Import that component into `App.js`, and add it right above the `<PostsList />` component:

You should see the form show up in the page right below the header.

#### Saving Post Entries[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#saving-post-entries)

さて、新しい投稿エントリをReduxストアに追加するためにposts sliceを更新しましょう。

postsスライスは、投稿データの更新をすべて処理する役割を担っています。createSliceコールの中にreducersというオブジェクトがあります。今のところ、これは空です。ここにreducer関数を追加して、投稿が追加されたときの処理をする必要があります。

reducersの中に、postAddedという名前の関数を追加します。この関数は2つの引数を受け取ります。postsスライスは自分が担当しているデータしか知らないので、stateの引数はReduxのstateオブジェクト全体ではなく、postの配列そのものになります。

アクションオブジェクトは action.payload フィールドとして新しいポストエントリを持ち、その新しいポストオブジェクトを state 配列に入れます。

postAddedのリデューサ関数を書くと、createSliceは自動的に同じ名前の「アクションクリエイター」関数を生成します。このアクションクリエーターをエクスポートして、UIコンポーネントで使用すれば、ユーザーが「Save Post」をクリックしたときにアクションが実行されるようになります。

##### WARNING

覚えておいてほしいのは、リデューサ関数は常にコピーを作成することで、新しいステート値を不変的に作成しなければならないということです。createSlice()の中でArray.push()のような変異する関数を呼んだり、state.someField = someValueのようにオブジェクトのフィールドを変更しても安全です。Immerライブラリを使って内部で安全な不変の更新に変換しているからです。

#### Dispatching the "Post Added" Action[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#dispatching-the-post-added-action)

AddPostFormには、テキスト入力と「Save Post」ボタンがありますが、ボタンはまだ何もしません。クリックハンドラを追加して、postAddedアクションクリエータをディスパッチし、ユーザが書いたタイトルとコンテンツを含む新しいポストオブジェクトを渡す必要があります。

投稿オブジェクトには、idフィールドが必要です。現在、最初のテスト投稿では、IDに偽の数字を使っています。次の増分のID番号を把握するコードを書くこともできますが、代わりにランダムなユニークIDを生成する方が良いでしょう。Redux Toolkitにはnanoidという関数があるので、それを使うことができます。

##### INFO: We'll talk more about generating IDs and dispatching actions in [Part 4: Using Redux Data](https://redux.js.org/tutorials/essentials/part-4-using-data).

コンポーネントからアクションをディスパッチするためには、ストアのディスパッチ関数にアクセスする必要があります。これはReact-ReduxのuseDispatchフックを呼び出すことで得られます。また、postAddedアクションクリエイターをこのファイルにインポートする必要があります。

コンポーネントでdispatch関数を利用できるようになったら、クリックハンドラでdispatch(postAdded())を呼び出すことができます。ReactコンポーネントのuseStateフックからtitleとcontentの値を取得し、新しいIDを生成して、postAdded()に渡す新しいpostオブジェクトにまとめることができます。

ここで、タイトルとテキストを入力して、「投稿を保存」をクリックしてみてください。すると、投稿リストにその投稿の新しいアイテムが表示されるはずです。

**Congratulations! You've just built your first working React + Redux app!**

これは、Reduxのデータフローサイクルの全体像を示しています。

- 投稿リストは、useSelector でストアから初期の投稿セットを読み込み、初期の UI をレンダリングしました。
- 新しい投稿エントリのデータを含む postAdded アクションをディスパッチしました。
- posts reducer は postAdded アクションを見て、posts 配列を新しいエントリで更新しました。
- Redux ストアは、いくつかのデータが変更されたことを UI に伝えました。
- posts list は更新された posts 配列を読み、新しい投稿を表示するために再レンダリングした。

この後に追加する新機能はすべて、ここまで見てきたのと同じ基本的なパターンに従います。つまり、ステートのスライスを追加し、リデューサ関数を書き、アクションをディスパッチし、Reduxストアからのデータに基づいてUIをレンダリングします。

Redux DevTools Extensionをチェックして、ディスパッチしたアクションを確認し、そのアクションに応じてReduxのステートがどのように更新されたかを見ることができます。アクションリストの「posts/postAdded」エントリをクリックすると、「アクション」タブが以下のように表示されます。

<img src="https://redux.js.org/assets/images/example-postAdded-action-d2070a71e0bfe419b37938dda504e092.png" alt="devtool" style="zoom:67%;" />

Diff "タブでは、state.postsに1つの新しいアイテムが追加され、それがインデックス2であることもわかります。

AddPostFormコンポーネントには、ユーザーが入力したタイトルやコンテンツの値を追跡するために、ReactのuseStateフックがいくつか組み込まれていることに注目してください。覚えておいてほしいのは、Reduxストアには、アプリケーションにとって「グローバル」とみなされるデータのみを格納するべきだということです。このケースでは、AddPostFormのみが入力フィールドの最新の値を知る必要があるため、一時的なデータをReduxストアに保持しようとするのではなく、Reactコンポーネントのステートにそのデータを保持したいと考えています。ユーザーがフォームの操作を終えると、Reduxアクションをディスパッチして、ユーザーの入力に基づいた最終的な値でストアを更新します。

## What You've Learned[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#what-youve-learned)

Let's recap what you've learned in this section:

##### SUMMARY

- Redux state is updated by "reducer functions":
  - Reducers always calculate a new state *immutably*, by copying existing state values and modifying the copies with the new data
  - The Redux Toolkit `createSlice` function generates "slice reducer" functions for you, and lets you write "mutating" code that is turned into safe immutable updates
  - Those slice reducer functions are added to the `reducer` field in `configureStore`, and that defines the data and state field names inside the Redux store
- React components read data from the store with the `useSelector` hook
  - Selector functions receive the whole `state` object, and should return a value
  - Selectors will re-run whenever the Redux store is updated, and if the data they return has changed, the component will re-render
- React components dispatch actions to update the store using the `useDispatch` hook
  - `createSlice` will generate action creator functions for each reducer we add to a slice
  - Call `dispatch(someActionCreator())` in a component to dispatch an action
  - Reducers will run, check to see if this action is relevant, and return new state if appropriate
  - Temporary data like form input values should be kept as React component state. Dispatch a Redux action to update the store when the user is done with the form.

## What's Next?[#](https://redux.js.org/tutorials/essentials/part-3-data-flow#whats-next)

Now that you know the basic Redux data flow, move on to [Part 4: Using Redux Data](https://redux.js.org/tutorials/essentials/part-4-using-data), where we'll add some additional functionality to our app and see examples of how to work with the data that's already in the store.

