# Redux Essentials, Part 5: Async Logic and Data Fetching

> ##### WHAT YOU'LL LEARN
>
> - How to use the Redux "thunk" middleware for async logic
> - Patterns for handling async request state
> - How to use the Redux Toolkit `createAsyncThunk` API to simplify async calls

> ##### PREREQUISITES
>
> - Familiarity with using AJAX requests to fetch and update data from a server

## Introduction[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#introduction)

パート4: Reduxデータの使用では、Reduxストアからの複数のデータをReactコンポーネント内で使用する方法、アクションオブジェクトがディスパッチされる前にその内容をカスタマイズする方法、そしてreducerでより複雑な更新ロジックを処理する方法を見てきました。

これまでのところ、私たちが扱ってきたすべてのデータは、Reactクライアントアプリケーションの内部で直接扱われてきました。しかし、実際のアプリケーションの多くは、HTTP APIを呼び出してアイテムを取得したり保存したりして、サーバーからのデータを扱う必要があります。

このセクションでは、ソーシャルメディアアプリを変換して、投稿とユーザーのデータをAPIから取得し、APIに保存して新しい投稿を追加します。

### Example REST API and Client[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#example-rest-api-and-client)

サンプルプロジェクトを孤立させつつも現実的なものにするため、プロジェクトの初期設定には、データ用の偽のインメモリREST APIがすでに含まれています（Mock Service WorkerのモックAPIツールを使って設定）。このAPIは、/fakeApiをエンドポイントのベースURLとして使用し、/fakeApi/posts、/fakeApi/users、fakeApi/notificationsの典型的なGET/POST/PUT/DELETE HTTPメソッドをサポートしています。これはsrc/api/server.jsで定義されています。

このプロジェクトには、小さなHTTP APIクライアントオブジェクトも含まれています。このオブジェクトは、axiosのような一般的なHTTPライブラリと同様に、client.get()およびclient.post()メソッドを公開しています。このオブジェクトはsrc/api/client.jsで定義されています。

このセクションでは、クライアント・オブジェクトを使って、インメモリ・フェイクのREST APIにHTTPコールを行います。

また、モックサーバは、ページが読み込まれるたびに同じランダムシードを再利用するように設定されており、偽ユーザと偽投稿の同じリストを生成するようになっています。これをリセットしたい場合は、ブラウザのローカルストレージにある「randomTimestampSeed」の値を削除してページを再読み込みするか、src/api/server.jsを編集してuseSeededRNGをfalseに設定することで、この機能をオフにすることができます。

> ##### INFO
>
> このコード例では、各セクションの重要なコンセプトと変更点を中心に説明しています。アプリケーションの完全な変更点については、CodeSandboxプロジェクトとプロジェクトリポジトリのtutorial-stepsブランチを参照してください。

## Thunks and Async Logic[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#thunks-and-async-logic)

### Using Middleware to Enable Async Logic[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#using-middleware-to-enable-async-logic)

Reduxのストアは、それ自体では非同期ロジックについて何も知りません。ストアが知っているのは、アクションを同期的にディスパッチし、ルート・リデューサ関数を呼び出して状態を更新し、何かが変わったことをUIに通知する方法だけです。非同期性はすべてストアの外で起こる必要があります。

しかし、非同期ロジックがディスパッチしたり、現在のストアの状態をチェックしたりして、ストアと対話したい場合はどうすればよいでしょうか？ここで、Reduxのミドルウェアの出番です。ミドルウェアはストアを拡張し、以下のことを可能にしてくれます。

Reduxのストアは、それ自体では非同期ロジックについて何も知りません。ストアが知っているのは、アクションを同期的にディスパッチし、ルート・リデューサ関数を呼び出して状態を更新し、何かが変わったことをUIに通知する方法だけです。非同期性はすべてストアの外で起こる必要があります。

しかし、非同期ロジックがディスパッチしたり、現在のストアの状態をチェックしたりして、ストアと対話したい場合はどうすればよいでしょうか？ここで、Reduxのミドルウェアの出番です。ミドルウェアはストアを拡張し、以下のことを可能にしてくれます。

- アクションがディスパッチされたときに追加のロジックを実行する（アクションや状態のログを取るなど）
- ディスパッチされたアクションの一時停止、変更、遅延、置換、停止
- ディスパッチとgetStateにアクセスできる追加コードの記述
- 関数や約束事など、普通のアクションオブジェクト以外の値をどのように受け入れるかを、それらをインターセプトし、代わりに本当のアクションオブジェクトをディスパッチすることによって、ディスパッチに教えます。

ミドルウェアを使用する最も一般的な理由は、さまざまな種類の非同期ロジックがストアと対話できるようにすることです。これにより、アクションをディスパッチしたり、ストアの状態をチェックしたりするコードを、そのロジックをUIから切り離して書くことができます。

Reduxの非同期ミドルウェアには様々な種類があり、それぞれ異なる構文でロジックを書くことができます。最も一般的な非同期ミドルウェアはredux-thunkで、非同期ロジックを直接含むことができるプレーンな関数を書くことができます。Redux ToolkitのconfigureStore関数は、デフォルトでthunkミドルウェアを自動的にセットアップしており、Reduxで非同期ロジックを書く際の標準的なアプローチとしてthunkの使用を推奨しています。

先ほど、Reduxの同期データフローがどのようになっているかを見ました。非同期ロジックを導入すると、ミドルウェアがAJAXリクエストのようなロジックを実行し、アクションをディスパッチするというステップが追加されます。そのため、非同期のデータフローは以下のようになります。

<img src="https://redux.js.org/assets/images/ReduxAsyncDataFlowDiagram-d97ff38a0f4da0f327163170ccc13e80.gif" alt="flow" style="zoom:67%;" />

### Thunk Functions[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#thunk-functions)

Reduxストアにthunkミドルウェアが追加されると、store.dispatchに直接thunk関数を渡すことができるようになります。thunk関数は常に(dispatch, getState)を引数として呼び出され、必要に応じてthunk内部で使用することができます。

サンクは通常、dispatch(increment())のようなアクションクリエイターを使用してプレーンアクションをディスパッチします。

```js
const store = configureStore({ reducer: counterReducer })

const exampleThunkFunction = (dispatch, getState) => {
  const stateBefore = getState()
  console.log(`Counter before: ${stateBefore.counter}`)
  dispatch(increment())
  const stateAfter = getState()
  console.log(`Counter after: ${stateAfter.counter}`)
}

store.dispatch(exampleThunkFunction)
```

通常のアクションオブジェクトのディスパッチとの一貫性を保つために、通常はこれらをthunkアクションクリエイターとして記述し、thunk関数を返します。これらのアクションクリエーターは、thunk内部で使用できる引数を取ることができます。

```js
const logAndAdd = amount => {
  return (dispatch, getState) => {
    const stateBefore = getState()
    console.log(`Counter before: ${stateBefore.counter}`)
    dispatch(incrementByAmount(amount))
    const stateAfter = getState()
    console.log(`Counter after: ${stateAfter.counter}`)
  }
}

store.dispatch(logAndAdd(5))
```

サンクは通常、"slice "ファイルに記述します。createSlice自体はサンクを定義するための特別なサポートを持っていないので、同じsliceファイル内の別の関数として記述する必要があります。そうすれば、そのスライスのプレーンアクションスクリエータにアクセスでき、サンクがどこにあるかを簡単に見つけることができます。

> INFO
>
> 「thunk」とは、プログラミング用語で、「遅れた作業を行うコードの一部」という意味です。thunkの使い方の詳細は、サンクの使い方ガイドのページをご覧ください。
>
> - [Using Redux: Writing Logic with Thunks](https://redux.js.org/usage/writing-logic-thunks)
>
> as well as these posts:
>
> - [What the heck is a thunk?](https://daveceddia.com/what-is-a-thunk/)
> - [Thunks in Redux: the basics](https://medium.com/fullstack-academy/thunks-in-redux-the-basics-85e538a3fe60)

### Writing Async Thunks[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#writing-async-thunks)

Thunksには、setTimeout、Promises、async/awaitなどの非同期ロジックが含まれています。これは、サーバーAPIへのAJAXコールを置くのに適した場所です。

Reduxのデータフェッチロジックは、一般的に予測可能なパターンに従います。

- リクエストの前に「start」アクションがディスパッチされ、リクエストが進行中であることを示します。これは、重複したリクエストをスキップするために読み込み状態を追跡したり、UIに読み込み中のインジケータを表示したりするために使用できます。
- 非同期リクエストが行われます。
- リクエストの結果に応じて、非同期ロジックは、結果データを含む「成功」アクション、またはエラーの詳細を含む「失敗」アクションをディスパッチします。レデューサーロジックは、どちらのケースでもローディング状態をクリアし、成功ケースの結果データを処理するか、エラー値を表示用に保存します。

これらのステップは必須ではありませんが、よく使われます。(成功した結果だけを気にするのであれば、リクエストが終了したときに単一の「成功」アクションをディスパッチし、「開始」と「失敗」アクションをスキップすることができます)。

Redux Toolkitは、これらのアクションの生成とディスパッチを実装するためのcreateAsyncThunk APIを提供しており、その使い方をまもなく見ていきます。

> **Detailed Explanation: Dispatching Request Status Actions in Thunks**
>
> 典型的な非同期サンクのコードを手書きで書き出すとしたら、次のようになります。
>
> ```js
> const getRepoDetailsStarted = () => ({
>   type: 'repoDetails/fetchStarted'
> })
> const getRepoDetailsSuccess = repoDetails => ({
>   type: 'repoDetails/fetchSucceeded',
>   payload: repoDetails
> })
> const getRepoDetailsFailed = error => ({
>   type: 'repoDetails/fetchFailed',
>   error
> })
> const fetchIssuesCount = (org, repo) => async dispatch => {
>   dispatch(getRepoDetailsStarted())
>   try {
>     const repoDetails = await getRepoDetails(org, repo)
>     dispatch(getRepoDetailsSuccess(repoDetails))
>   } catch (err) {
>     dispatch(getRepoDetailsFailed(err.toString()))
>   }
> ```
>
> しかし、この方法でコードを書くのは面倒です。別々のタイプのリクエストには、同じような実装を繰り返す必要があります。
>
> - 3つの異なるケースに応じて、固有のアクションタイプを定義する必要があります。
> - それぞれのアクションタイプには、通常、対応するアクション作成関数があります。
> - 正しいアクションを正しい順序でディスパッチするサンクを書かなければなりません。
>
> createAsyncThunkは、アクションタイプとアクションクリエーターを生成し、それらのアクションを自動的にディスパッチするThunkを生成することで、このパターンを抽象化します。非同期呼び出しを行い、結果を持つPromiseを返すコールバック関数を提供します。

> ##### TIP
>
> Redux Toolkitには、新しい[RTK QueryデータフェッチAPI](https://redux-toolkit.js.org/rtk-query/overview)があります。RTK Queryは、Reduxアプリのために構築されたデータフェッチとキャッシングのソリューションで、データフェッチを管理するためのThunksやReducerを書く必要をなくすことができます。RTK Queryは、Reduxアプリのデータ取得を管理するためのThunksやReducerを書く必要がありません。
>
> RTK Queryの使い方については、[第7回: RTKクエリーの基本](https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics)からご紹介します。

## Loading Posts[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#loading-posts)

これまでのところ、postsliceは初期状態としてハードコードされたサンプルデータを使用していました。ここでは、空の配列で始まるように変更して、サーバーから投稿のリストを取得してみます。

そのためには、postsliceの状態の構造を変更して、APIリクエストの現在の状態を追跡できるようにしなければなりません。

### Extracting Posts Selectors[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#extracting-posts-selectors)

現在、postsSliceの状態は、1つのpostsの配列です。これを、postsの配列とload stateのフィールドを持つオブジェクトに変更する必要があります。

一方、`<PostsList>`のようなUIコンポーネントは、useSelectorフックでstate.postsから投稿を読み込もうとしており、そのフィールドが配列であると仮定しています。新しいデータに合わせて、これらの場所も変更する必要があります。

レデューサのデータ形式を変更するたびにコンポーネントを書き直す必要がなければいいのですが。これを避けるためには、スライスファイルに再利用可能なセレクタ関数を定義し、各コンポーネントでセレクタのロジックを繰り返すのではなく、コンポーネントがそのセレクタを使用して必要なデータを抽出するという方法があります。そうすれば、状態構造を再度変更した場合でも、スライスファイルのコードを更新するだけで済みます。

`<PostsList>`コンポーネントは、すべての投稿のリストを読み取る必要があり、`<SinglePostPage>`と`<EditPostForm>`コンポーネントは、IDによって1つの投稿を検索する必要があります。これらのケースをカバーするために、postslice.jsから2つの小さなセレクタ関数をエクスポートしましょう。

```js
// features/posts/postsSlice.js
const postsSlice = createSlice(/* omit slice code*/)

export const { postAdded, postUpdated, reactionAdded } = postsSlice.actions

export default postsSlice.reducer

export const selectAllPosts = state => state.posts

export const selectPostById = (state, postId) =>
  state.posts.find(post => post.id === postId)
```

これらのセレクタ関数のstateパラメータは、useSelectorの中で直接書いたインライン化された無名セレクタと同様に、ルートのRedux stateオブジェクトであることに注意してください。

これにより、コンポーネントでそれらを使用することができます。

```jsx
// features/posts/PostsList.js
// omit imports
import { selectAllPosts } from './postsSlice'

export const PostsList = () => {
  const posts = useSelector(selectAllPosts)
  // omit component contents
}
```

```jsx
// features/posts/SinglePostPage.js
// omit imports
import { selectPostById } from './postsSlice'

export const SinglePostPage = ({ match }) => {
  const { postId } = match.params

  const post = useSelector(state => selectPostById(state, postId))
  // omit component logic
}
```

```jsx
// features/posts/EditPostForm.js
// omit imports
import { postUpdated, selectPostById } from './postsSlice'

export const EditPostForm = ({ match }) => {
  const { postId } = match.params

  const post = useSelector(state => selectPostById(state, postId))
  // omit component logic
}
```

再利用可能なセレクタを書いてデータ検索をカプセル化することは、しばしば良いアイデアです。また、「メモ化」されたセレクタを作成することで、パフォーマンスを向上させることができます。これについては、このチュートリアルの後の部分で説明します。

しかし、他の抽象化手法と同様に、いつでもどこでも使えるものではありません。セレクタを書くということは、理解し、維持するためのコードが増えるということです。ステートのすべてのフィールドにセレクタを書かなければならないと思わないでください。最初はセレクタなしで始めてみて、アプリケーションコードのあちこちで同じ値を探すことが多くなったら、後からセレクタを追加しましょう。

### Loading State for Requests[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#loading-state-for-requests)

APIコールを行う際、その進捗状況を4つの可能な状態のうちの1つである小さなステートマシンとして見ることができます。

- リクエストはまだ始まっていません。
- リクエストは進行中です。
- リクエストは成功し、必要なデータが得られました。
- リクエストが失敗し、エラーメッセージが表示されています。

`isLoading: true`のように、いくつかのブール値を使ってその情報を追跡することもできますが、これらの状態を1つのenum値として追跡する方が良いでしょう。このための良いパターンは、次のようなステートセクションを持つことです（TypeScriptの型表記を使用）。

これらのフィールドは、実際に保存されているデータと一緒に存在します。これらの特定の文字列状態の名前は必須ではありません。「loading」の代わりに「pending」、「successful」の代わりに「complete」など、必要に応じて他の名前を自由に使用してください。

この情報を使って、リクエストの進行に合わせてUIに何を表示するかを決めたり、データを二重に読み込むようなケースを防ぐためにreducerにロジックを追加したりすることができます。

postsSliceを更新して、「fetch posts」リクエストのロード状態を追跡するためにこのパターンを使ってみましょう。状態をposts自体の配列から{posts, status, error}のように変更します。また、初期状態から古いサンプル投稿エントリを削除します。この変更の一環として、stateを配列として使用していたものを、代わりにstate.postsに変更する必要があります。これは、配列が1階層深くなったためです。

```js
// features/posts/postsSlice.js
import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  posts: [],
  status: 'idle',
  error: null
}

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postAdded: {
      reducer(state, action) {
        state.posts.push(action.payload)
      },
      prepare(title, content, userId) {
        // omit prepare logic
      }
    },
    reactionAdded(state, action) {
      const { postId, reaction } = action.payload
      const existingPost = state.posts.find(post => post.id === postId)
      if (existingPost) {
        existingPost.reactions[reaction]++
      }
    },
    postUpdated(state, action) {
      const { id, title, content } = action.payload
      const existingPost = state.posts.find(post => post.id === id)
      if (existingPost) {
        existingPost.title = title
        existingPost.content = content
      }
    }
  }
})

export const { postAdded, postUpdated, reactionAdded } = postsSlice.actions

export default postsSlice.reducer

export const selectAllPosts = state => state.posts.posts

export const selectPostById = (state, postId) =>
  state.posts.posts.find(post => post.id === postId)
```

はい、これは state.posts.posts のような入れ子になったオブジェクトのパスがあることを意味していますが、これは多少反復的で愚かなことです :) これを避けるために、入れ子になった配列の名前を items や data などに変更することもできますが、今はこのままにしておきます。

### Fetching Data with `createAsyncThunk`[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#fetching-data-with-createasyncthunk)

Redux ToolkitのcreateAsyncThunk APIは、これらの「開始/成功/失敗」アクションを自動的にディスパッチするthunkを生成します。

まずは、投稿のリストを取得するためにAJAXコールを行うThunkを追加してみましょう。src/apiフォルダからクライアントユーティリティをインポートし、それを使って「/fakeApi/posts」へのリクエストを行います。

```js
// features/posts/postsSlice
import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit'
import { client } from '../../api/client'

const initialState = {
  posts: [],
  status: 'idle',
  error: null
}

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
  const response = await client.get('/fakeApi/posts')
  return response.data
})
```

`createAsyncThunk` accepts two arguments:

- 生成されるアクションタイプのプレフィックスとして使用される文字列
- 何らかのデータを含むPromiseを返すか、エラーで拒否されたPromiseを返す「ペイロードクリエーター」コールバック関数です。

Payload Creatorは通常、何らかのAJAXコールを行い、AJAXコールから直接Promiseを返すか、またはAPIレスポンスからデータを抽出してそれを返すことができます。これは、somePromise.then()チェーンではなく、標準的なtry/catchロジックを使用しながら、Promiseを使用する関数を書くことができます。

この例では、アクションタイプのプレフィックスとして「posts/fetchPosts」を渡しています。ペイロード作成コールバックは、APIコールがレスポンスを返すのを待ちます。レスポンスオブジェクトは、{data: [となっており、ディスパッチされたReduxアクションには、postsの配列だけのペイロードを持たせたいと考えています。そこで、response.dataを抽出し、コールバックからそれを返しています。

dispatch(fetchPosts())を呼ぼうとすると、fetchPostsサンクはまずアクションタイプが「posts/fetchPosts/pending」のものをディスパッチします。

<img src="https://redux.js.org/assets/images/devtools-posts-pending-8885d18adbd31d8269b31caffe463c93.png" alt="pending" style="zoom:67%;" />

reducerでこのアクションをリッスンし、リクエストステータスを「loading」とマークすることができます。

Promiseが解決すると、fetchPostsサンクは、コールバックから返されたresponse.data配列を受け取り、posts配列をaction.payloadとして含む`'posts/fetchPosts/fulfilled'`アクションをディスパッチします。

<img src="https://redux.js.org/assets/images/devtools-posts-fulfilled-99e7e96d6687e5eab5b31649d93c8ccf.png" alt="fulfilled" style="zoom:67%;" />

#### Dispatching Thunks from Components[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#dispatching-thunks-from-components)

そこで、`<PostsList>`コンポーネントを更新して、実際にこのデータを自動的に取得するようにしてみましょう。

fetchPostsサンクをコンポーネントにインポートします。他のアクション作成者と同様に、これをディスパッチする必要がありますので、useDispatchフックを追加する必要があります。また、`<PostsList>`がマウントされたときにこのデータを取得したいので、ReactのuseEffectフックをインポートする必要があります。

```js
// features/posts/PostsList.js
import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
// omit other imports
import { selectAllPosts, fetchPosts } from './postsSlice'

export const PostsList = () => {
  const dispatch = useDispatch()
  const posts = useSelector(selectAllPosts)

  const postStatus = useSelector(state => state.posts.status)

  useEffect(() => {
    if (postStatus === 'idle') {
      dispatch(fetchPosts())
    }
  }, [postStatus, dispatch])

  // omit rendering logic
}
```

重要なのは、投稿リストの取得を一度だけにすることです。`<PostsList>`コンポーネントがレンダリングされるたび、あるいはビューを切り替えたために再作成されるたびにこの処理を行うと、何度も投稿を取得することになってしまいます。posts.status 列挙型を使用して、実際に取得を開始する必要があるかどうかを判断することができます。この列挙型をコンポーネントで選択し、status が 'idle' の場合にのみ取得を開始します。

### Reducers and Loading Actions[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#reducers-and-loading-actions)

次は、この2つのアクションを reducer で処理する必要があります。そのためには、これまで使用してきた createSlice API をもう少し詳しく見てみる必要があります。

createSliceはreducersフィールドで定義したすべてのreducer関数に対してアクションクリエイターを生成し、生成されたアクションタイプには以下のようにスライスの名前が含まれていることはすでに見たとおりです。

```js
console.log(
  postUpdated({ id: '123', title: 'First Post', content: 'Some text here' })
)
/*
{
  type: 'posts/postUpdated',
  payload: {
    id: '123',
    title: 'First Post',
    content: 'Some text here'
  }
}
*/
```

しかし、スライスのreducersが、このスライスのreducersフィールドの一部として定義されていない他のアクションに応答する必要がある場合があります。これには、スライスの extraReducers フィールドを使うことができます。

extraReducersオプションは、builderというパラメータを受け取る関数でなければなりません。builderオブジェクトは、スライスの外で定義されたアクションに応じて実行される、追加のケース・リデューサを定義するためのメソッドを提供します。ここでは、builder.addCase(actionCreator, reducer)を使って、非同期サンクでディスパッチされた各アクションを処理します。

この場合、fetchPostsサンクによってディスパッチされた「pending」および「frufilled」のアクションタイプをリッスンする必要があります。これらのアクション・クリエーターは、実際のfetchPost関数に添付されており、extraReducersにそれらを渡すことで、これらのアクションをリッスンすることができます。

```js
export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
  const response = await client.get('/fakeApi/posts')
  return response.data
})

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // omit existing reducers here
  },
  extraReducers(builder) {
    builder
      .addCase(fetchPosts.pending, (state, action) => {
        state.status = 'loading'
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // Add any fetched posts to the array
        state.posts = state.posts.concat(action.payload)
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  }
})
```

返されたPromiseに基づいて、thunkによってディスパッチされる可能性のある3つのアクションタイプをすべて処理します。

- リクエストが開始されると、status enumを'loading'に設定します。
- リクエストが成功すると、ステータスを「successful」とマークし、取得した記事をstate.postsに追加します。
- リクエストが失敗した場合は、ステータスを「failed」とマークし、エラーメッセージを表示できるようにステートに保存します。

### Displaying Loading State[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#displaying-loading-state)

`<PostsList>`コンポーネントは、Reduxに保存されている投稿の更新をすでにチェックしており、そのリストが変更されるたびに自身を再レンダリングしています。そのため、ページを更新すると、偽のAPIからのランダムな投稿セットが画面に表示されるはずです。

私たちが使用している偽のAPIは、すぐにデータを返します。今回使用している偽のAPIはすぐにデータを返しますが、本物のAPIコールはおそらくレスポンスを返すのに時間がかかります。ユーザーがデータを待っていることを認識できるように、通常はUIに「loading...」インジケータを表示することをお勧めします。

`<PostsList>`を更新して、state.posts.status列挙に基づいて異なるUIを表示することができます。読み込み中の場合はスピナー、失敗した場合はエラーメッセージ、データがある場合は実際の投稿リストを表示します。ついでに、`<PostExcerpt>`コンポーネントを抽出して、リスト内の1つのアイテムのレンダリングをカプセル化するのもいいかもしれません。

結果は次のようになります。

```jsx
// features/posts/PostsList.js
import { Spinner } from '../../components/Spinner'
import { PostAuthor } from './PostAuthor'
import { TimeAgo } from './TimeAgo'
import { ReactionButtons } from './ReactionButtons'
import { selectAllPosts, fetchPosts } from './postsSlice'

const PostExcerpt = ({ post }) => {
  return (
    <article className="post-excerpt" key={post.id}>
      <h3>{post.title}</h3>
      <div>
        <PostAuthor userId={post.user} />
        <TimeAgo timestamp={post.date} />
      </div>
      <p className="post-content">{post.content.substring(0, 100)}</p>

      <ReactionButtons post={post} />
      <Link to={`/posts/${post.id}`} className="button muted-button">
        View Post
      </Link>
    </article>
  )
}

export const PostsList = () => {
  const dispatch = useDispatch()
  const posts = useSelector(selectAllPosts)

  const postStatus = useSelector(state => state.posts.status)
  const error = useSelector(state => state.posts.error)

  useEffect(() => {
    if (postStatus === 'idle') {
      dispatch(fetchPosts())
    }
  }, [postStatus, dispatch])

  let content

  if (postStatus === 'loading') {
    content = <Spinner text="Loading..." />
  } else if (postStatus === 'succeeded') {
    // Sort posts in reverse chronological order by datetime string
    const orderedPosts = posts
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))

    content = orderedPosts.map(post => (
      <PostExcerpt key={post.id} post={post} />
    ))
  } else if (postStatus === 'failed') {
    content = <div>{error}</div>
  }

  return (
    <section className="posts-list">
      <h2>Posts</h2>
      {content}
    </section>
  )
}
```

APIコールの完了に時間がかかり、ローディングスピナーが数秒間画面に表示されたままになっていることに気づくかもしれません。モックのAPIサーバーは、すべてのレスポンスに2秒の遅延を加えるように設定されています。これは特に、ローディング・スピナーが表示されている時間を可視化するためです。この動作を変更したい場合は、api/server.jsを開いて、この行を変更します。

```js
// api/server.js
// Add an extra delay to all endpoints, so loading spinners show up.
const ARTIFICIAL_DELAY_MS = 2000
```

API呼び出しをより速く完了させたい場合は、オンとオフを自由に切り替えてください。

## Loading Users[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#loading-users)

これで、投稿のリストを取得して表示することができました。しかし、投稿を見てみると、問題があります。すべての投稿の著者が「Unknown author」になっています。

これは、投稿エントリが偽のAPIサーバによってランダムに生成されるためで、ページをリロードするたびに偽のユーザのセットもランダムに生成されます。アプリケーションの起動時にこれらのユーザーを取得するために、users slice を更新する必要があります。

前回と同様に、API からユーザーを取得して返すための別の非同期サンクを作成し、extraReducers スライスフィールドで満たされたアクションを処理します。ここでは、ステートのロードについては気にしないことにします。

```js
// features/users/usersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { client } from '../../api/client'

const initialState = []

export const fetchUsers = createAsyncThunk('users/fetchUsers', async () => {
  const response = await client.get('/fakeApi/users')
  return response.data
})

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      return action.payload
    })
  }
})

export default usersSlice.reducer
```

ユーザーのリストを取得する必要があるのは一度だけで、それをアプリケーションの起動時に行いたいと考えています。これは index.js ファイルの中で行うことができ、そこにストアがあるので fetchUsers サンクを直接ディスパッチすることができます。

```jsx
// index.js
import { fetchUsers } from './features/users/usersSlice'

import { worker } from './api/server'

// Start our mock API server
worker.start({ onUnhandledRequest: 'bypass' })

store.dispatch(fetchUsers())

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
)
```

これで、各投稿には再びユーザー名が表示され、`<AddPostForm>`の「Author」ドロップダウンにも同じユーザーリストが表示されているはずです。

## Adding New Posts[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#adding-new-posts)

このセクションにはもう1つのステップがあります。`<AddPostForm>`から新しいポストを追加したとき、そのポストはアプリ内のReduxストアに追加されるだけです。実際にAPIコールを行って、偽のAPIサーバーに新しい投稿エントリを作成し、「保存」されるようにする必要があります。(これは偽のAPIなので、ページをリロードしても新しいポストは持続しませんが、もし本物のバックエンドサーバーがあれば、次回リロードしたときに利用可能になります)。

### Sending Data with Thunks[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#sending-data-with-thunks)

createAsyncThunkを使用して、データを取得するだけでなく、データを送信することもできます。ここでは、`<AddPostForm>`からの値を引数として受け取り、データを保存するために偽のAPIへのHTTP POST呼び出しを行うThunkを作成します。

その過程で、reducerで新しいpostオブジェクトを扱う方法を変更します。現在、postsliceはpostAddedのprepareコールバックで新しいpostオブジェクトを作成し、そのポストに新しいユニークIDを生成しています。サーバーにデータを保存するアプリの多くは、ユニークIDの生成や追加のフィールドへの入力はサーバーが行い、通常は完了したデータをレスポンスで返してくれます。つまり、`{ title, content, user: userId }`のようなリクエストボディをサーバーに送信し、返信されてきた完全な投稿オブジェクトを受け取り、postsliceステートに追加することができます。

```js
// features/posts/postsSlice.js
export const addNewPost = createAsyncThunk(
  'posts/addNewPost',
  // The payload creator receives the partial `{title, content, user}` object
  async initialPost => {
    // We send the initial data to the fake API server
    const response = await client.post('/fakeApi/posts', initialPost)
    // The response includes the complete post object, including unique ID
    return response.data
  }
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    // The existing `postAdded` reducer and prepare callback were deleted
    reactionAdded(state, action) {}, // omit logic
    postUpdated(state, action) {} // omit logic
  },
  extraReducers(builder) {
    // omit posts loading reducers
    builder.addCase(addNewPost.fulfilled, (state, action) => {
      // We can directly add the new post object to our posts array
      state.posts.push(action.payload)
    })
  }
})
```

### Checking Thunk Results in Components[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#checking-thunk-results-in-components)

最後に、`<AddPostForm>`を更新して、従来のpostAddedアクションの代わりにaddNewPostサンクをディスパッチするようにします。これはサーバーへの別のAPIコールなので、時間がかかり、失敗する可能性もあります。addNewPost()サンクは、保留／充足／拒否のアクションを自動的にReduxストアにディスパッチしますが、これはすでに処理しています。必要であれば、2つ目の loading enum を使用して postsSlice でリクエストステータスを追跡することもできますが、この例では、ローディング状態の追跡をコンポーネントに限定しておきましょう。

リクエストを待っている間、ユーザーが誤って2回投稿を保存しようとしないように、少なくとも「投稿の保存」ボタンを無効にできれば良いと思います。リクエストが失敗した場合は、フォームにエラーメッセージを表示したり、コンソールにログを出力したりすることもできます。

コンポーネントロジックは、非同期サンクが終了するのを待ち、終了したら結果を確認します。

```jsx
// features/posts/AddPostForm.js
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { unwrapResult } from '@reduxjs/toolkit'

import { addNewPost } from './postsSlice'

export const AddPostForm = () => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [userId, setUserId] = useState('')
  const [addRequestStatus, setAddRequestStatus] = useState('idle')

  // omit useSelectors and change handlers

  const canSave =
    [title, content, userId].every(Boolean) && addRequestStatus === 'idle'

  const onSavePostClicked = async () => {
    if (canSave) {
      try {
        setAddRequestStatus('pending')
        await dispatch(addNewPost({ title, content, user: userId })).unwrap()
        setTitle('')
        setContent('')
        setUserId('')
      } catch (err) {
        console.error('Failed to save the post: ', err)
      } finally {
        setAddRequestStatus('idle')
      }
    }
  }

  // omit rendering logic
}
```

投稿を取得するために postsSlice で読み込み状態を追跡しているのと同様に、React の useState フックとして読み込み状態の enum フィールドを追加できます。この場合は、リクエストが進行中かどうかを知りたいだけです。

dispatch(addNewPost())を呼び出すと、非同期サンクはdispatchからPromiseを返します。ここでそのプロミスを待ち受けることで、サンクがリクエストを終えたことを知ることができます。しかし、そのリクエストが成功したのか失敗したのかはまだわかりません。

createAsyncThunkはエラーを内部で処理するので、ログに「拒否されたPromise」のメッセージが表示されることはありません。そして、最終的にディスパッチしたアクションを返します。成功した場合は満たされたアクション、失敗した場合は拒否されたアクションです。

しかし、実際に行われたリクエストの成否を確認するロジックを書きたいことはよくあります。Redux Toolkitは、返されたPromiseに.unwrap()関数を追加し、満たされたアクションからの実際のaction.payload値を持つか、拒否されたアクションの場合はエラーを投げる新しいPromiseを返します。これにより、通常のtry/catchロジックを使ってコンポーネント内で成功と失敗を処理することができます。そこで、投稿の作成に成功した場合は入力フィールドをクリアしてフォームをリセットし、失敗した場合はエラーをコンソールに記録します。

addNewPost APIの呼び出しに失敗したときに何が起こるかを確認したい場合は、「Content」フィールドに「error」という単語（引用符なし）だけを入力した新しい投稿を作成してみてください。サーバーはこれを見て、失敗した応答を送り返すので、コンソールにメッセージが記録されているはずです。

## What You've Learned[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#what-youve-learned)

非同期ロジックとデータフェッチは常に複雑なトピックです。ご覧になったように、Redux ToolkitにはReduxの典型的なデータ取得パターンを自動化するツールがいくつか含まれています。

念のため、このセクションで取り上げた内容は次のとおりです。

> ##### SUMMARY
>
> - **再利用可能な「セレクタ」関数を書いて、Reduxの状態から値を読み取ることをカプセル化することができます。**
>   - セレクタとは、Reduxの状態を引数として受け取り、いくつかのデータを返す関数です。
> - **Reduxではミドルウェアと呼ばれるプラグインを使用して非同期ロジックを実現しています。**
>   - 標準的な非同期ミドルウェアはRedux-thunkと呼ばれるもので、Redux Toolkitに含まれています。
>   - Thunk関数は引数としてdispatchとgetStateを受け取り、それらを非同期ロジックの一部として使用することができます。
> - **APIコールのロードステータスを追跡するために、追加のアクションをディスパッチすることができます。**
>   - 典型的なパターンは、呼び出しの前に「保留」アクションをディスパッチし、その後、データを含む「成功」またはエラーを含む「失敗」アクションをディスパッチすることです。
>   - ロード状態は通常、「idle」｜「loading」｜「successful」｜「failed」のような列挙型で保存されます。
> - **Redux Toolkitには、これらのアクションをディスパッチするcreateAsyncThunk APIがあります。**
>   - createAsyncThunkは、Promiseを返すべき "payload creator "コールバックを受け取り、`pending/fulfilled/rejected` のアクションタイプを自動的に生成します。
>   - fetchPostsなどの生成されたアクションクリエイターは、返されたPromiseに基づいてこれらのアクションをディスパッチします。
>   - createSliceでextraReducersフィールドを使ってこれらのアクションタイプをリッスンし、それらのアクションに基づいてreducersの状態を更新することができます。
>   - アクション クリエイターを使用すると、自動的に extraReducers オブジェクトのキーを埋めることができるので、スライスはどのアクションをリッスンすべきかを知ることができます。
>   - Thunksはプロミスを返すことができます。特に createAsyncThunk では、`await dispatch(someThunk()).unwrap()` で、コンポーネントレベルでリクエストの成否を処理することができます。

## What's Next?[#](https://redux.js.org/tutorials/essentials/part-5-async-logic#whats-next)

Redux ToolkitのコアAPIと使用パターンをカバーするために、もう1セットのトピックを用意しました。第6回「パフォーマンスとデータの正規化」では、Reduxの使用がReactのパフォーマンスにどのような影響を与えるのか、また、パフォーマンスを向上させるためにアプリケーションを最適化する方法をご紹介します。

