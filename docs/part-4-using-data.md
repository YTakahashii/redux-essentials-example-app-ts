# Redux Essentials, Part 4: Using Redux Data

##### WHAT YOU'LL LEARN

- Using Redux data in multiple React components
- Organizing logic that dispatches actions
- Writing more complex update logic in reducers

##### PREREQUISITES

- Understanding the [Redux data flow and React-Redux APIs from Part 3](https://redux.js.org/tutorials/essentials/part-3-data-flow)
- Familiarity with [the React Router `` and `` components for page routing](https://reacttraining.com/react-router/web/api)

## Introduction[#](https://redux.js.org/tutorials/essentials/part-4-using-data#introduction)

 パート3：基本的なReduxのデータフローでは、空のRedux+Reactプロジェクトのセットアップから始めて、新しいステートのスライスを追加し、Reduxストアからデータを読み取り、そのデータを更新するアクションをディスパッチすることができるReactコンポーネントを作成する方法を見ました。また、コンポーネントがアクションをディスパッチし、リデューサがアクションを処理して新しいステートを返し、コンポーネントが新しいステートを読み込んでUIをレンダリングすることで、データがアプリケーションをどのように流れるかを見ていきました。

Reduxのロジックを書くための基本的な手順がわかったところで、同じ手順を使ってソーシャルメディアのフィードにいくつかの新機能を追加し、より便利にしていきます。1つの投稿の表示、既存の投稿の編集、投稿者の詳細表示、投稿のタイムスタンプ、リアクションボタンなどです。

##### INFO

##### このコード例では、各セクションの重要なコンセプトと変更点を中心に説明しています。アプリケーションの完全な変更点については、CodeSandboxプロジェクトとプロジェクトリポジトリのtutorial-stepsブランチを参照してください。

## Showing Single Posts[#](https://redux.js.org/tutorials/essentials/part-4-using-data#showing-single-posts)

Reduxストアに新しい投稿を追加できるようになったので、投稿データをさまざまな方法で利用する機能を追加することができます。

現在、私たちの投稿エントリはメインフィードページに表示されていますが、テキストが長すぎる場合は、コンテンツの抜粋を表示するだけです。1つの投稿エントリを独立したページで表示する機能があると便利です。

### Creating a Single Post Page[#](https://redux.js.org/tutorials/essentials/part-4-using-data#creating-a-single-post-page)

まず、新しいSinglePostPageコンポーネントをposts featureフォルダに追加する必要があります。React Routerを使って、ページのURLが/posts/123のようになったときにこのコンポーネントを表示します。

```jsx
// features/posts/SinglePostPage.js
import React from 'react'
import { useSelector } from 'react-redux'

export const SinglePostPage = ({ match }) => {
  const { postId } = match.params

  const post = useSelector(state =>
    state.posts.find(post => post.id === postId)
  )

  if (!post) {
    return (
      <section>
        <h2>Post not found!</h2>
      </section>
    )
  }

  return (
    <section>
      <article className="post">
        <h2>{post.title}</h2>
        <p className="post-content">{post.content}</p>
      </article>
    </section>
  )
}
```

React Routerでは、探しているURL情報を含むmatchオブジェクトをpropとして渡します。このコンポーネントをレンダリングするためのルートを設定する際に、URLの2番目の部分をpostIdという変数として解析するように指示し、その値をmatch.paramsから読み取ることができるようにします。

postIdの値を取得したら、それをセレクタ関数の中で使用して、Reduxストアから適切なpostオブジェクトを見つけることができます。state.postsはすべてのpostオブジェクトの配列であることがわかっているので、Array.find()関数を使って配列をループし、探しているIDのpostエントリを返すことができます。

ここで注意しなければならないのは、useSelectorから返された値が新しい参照に変わるたびに、コンポーネントが再レンダリングされるということです。コンポーネントは常に、ストアから必要なデータを最小量だけ選択するようにすべきで、これにより実際に必要なときだけレンダリングすることができます。

ユーザーがURLを直接入力しようとした場合や、正しいデータが読み込まれていない場合など、ストア内に一致する投稿エントリがない可能性があります。このような場合、find()関数は実際の投稿オブジェクトではなく、未定義を返します。コンポーネントはこのことをチェックして、ページに「ポストが見つかりません！」というメッセージを表示して処理する必要があります。

正しい post オブジェクトがストアにあれば、useSelector がそれを返すので、それを使ってページ内で post のタイトルとコンテンツをレンダリングすることができます。

これは、`<PostsList>`コンポーネントの本体で行っている、メインフィードに記事の抜粋を表示するためにposts配列全体をループさせるロジックとよく似ていることに気づくかもしれません。両方で使用できるPostコンポーネントを抽出することもできますが、記事の抜粋と記事全体を表示する方法にはすでにいくつかの違いがあります。多少の重複があっても、しばらくは別々に書いておいた方がいいでしょう。そうすれば、異なるコードセクションが十分に似ていて、本当に再利用可能なコンポーネントを抽出できるかどうか、後で判断することができます。

### Adding the Single Post Route[#](https://redux.js.org/tutorials/essentials/part-4-using-data#adding-the-single-post-route)

`<SinglePostPage>`コンポーネントができたので、それを表示するためのルートを定義し、フロントページのフィードに各記事へのリンクを追加します。

App.jsでSinglePostPageをインポートして、ルートを追加します。

```jsx
// App.js
import { PostsList } from './features/posts/PostsList'
import { AddPostForm } from './features/posts/AddPostForm'
import { SinglePostPage } from './features/posts/SinglePostPage'

function App() {
  return (
    <Router>
      <Navbar />
      <div className="App">
        <Switch>
          <Route
            exact
            path="/"
            render={() => (
              <React.Fragment>
                <AddPostForm />
                <PostsList />
              </React.Fragment>
            )}
          />
          <Route exact path="/posts/:postId" component={SinglePostPage} />
          <Redirect to="/" />
        </Switch>
      </div>
    </Router>
  )
}
```

次に、`<PostsList>`では、リストのレンダリングロジックを更新して、特定のポストにルーティングする`<Link>`を含めるようにします。

```jsx
// features/posts/PostsList.js
import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

export const PostsList = () => {
  const posts = useSelector(state => state.posts)

  const renderedPosts = posts.map(post => (
    <article className="post-excerpt" key={post.id}>
      <h3>{post.title}</h3>
      <p className="post-content">{post.content.substring(0, 100)}</p>
      <Link to={`/posts/${post.id}`} className="button muted-button">
        View Post
      </Link>
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

また、クリックして別のページに移動できるようになったので、<Navbar>コンポーネントにもメインの投稿ページへのリンクがあると便利です。

## Editing Posts[#](https://redux.js.org/tutorials/essentials/part-4-using-data#editing-posts)

ユーザーとしては、記事を書き終えて保存した後、どこかに間違いがあったことに気づくのはとても面倒なことです。記事を作成した後に編集できる機能があれば便利です。

新しい`<EditPostForm>`コンポーネントを追加しましょう。このコンポーネントは、既存の投稿IDを受け取り、ストアからその投稿を読み込み、ユーザーにタイトルと投稿内容を編集させ、変更を保存してストア内の投稿を更新する機能を持っています。

### Updating Post Entries[#](https://redux.js.org/tutorials/essentials/part-4-using-data#updating-post-entries)

まず、postsliceを更新して、新しいreducer関数とアクションを作成し、ストアが実際に投稿を更新する方法を知るようにする必要があります。

createSlice()の中で、reducersオブジェクトに新しい関数を追加する必要があります。このreducerの名前は、何が起こっているのかをよく表している必要があることを覚えておいてください。というのも、このアクションがディスパッチされるたびに、Redux DevToolsのアクションタイプ文字列の一部としてreducerの名前が表示されるからです。最初のリデューサはpostAddedと呼ばれていたので、このリデューサをpostUpdatedと呼んでみましょう。

postオブジェクトを更新するためには、以下の情報が必要です。

- 更新される投稿のID。これにより、正しい投稿オブジェクトを見つけることができます。
- ユーザーが入力した新しいタイトルとコンテンツフィールド

Reduxのアクションオブジェクトは、typeフィールドを持つことが要求されます。typeフィールドは通常、説明的な文字列で、何が起こったかについての詳細情報を持つ他のフィールドを含むこともできます。慣習上、通常は action.payload というフィールドに追加情報を入れますが、payload フィールドに何を入れるかは、文字列、数値、オブジェクト、配列など、私たち次第です。今回のケースでは、必要な情報が3つあるので、ペイロードフィールドは3つのフィールドを内包したオブジェクトにすることにしましょう。つまり、アクションオブジェクトは、`{type: 'posts/postUpdated', payload: {id, title, content}}` のようになります。

デフォルトでは、createSliceが生成するアクションクリエイターは、1つの引数を渡すことを想定しており、その値はaction.payloadとしてアクションオブジェクトに入れられます。そこで、これらのフィールドを含むオブジェクトをpostUpdatedアクションクリエイターの引数として渡すことができます。

また、アクションがディスパッチされたときに、実際にどのようにステートが更新されるかを決定するのはreducerであることがわかっています。そうすると、reducerがIDに基づいて適切なpostオブジェクトを見つけ、そのpostのtitleとcontentフィールドを特に更新するようにしなければなりません。

最後に、createSliceが生成してくれたアクション作成関数をエクスポートして、ユーザーが投稿を保存したときにUIが新しいpostUpdatedアクションをディスパッチできるようにする必要があります。

これらの要件を考慮した上で、postsliceの定義がどのように行われるべきかを示します。

```js
// features/posts/postsSlice.js
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postAdded(state, action) {
      state.push(action.payload)
    },
    postUpdated(state, action) {
      const { id, title, content } = action.payload
      const existingPost = state.find(post => post.id === id)
      if (existingPost) {
        existingPost.title = title
        existingPost.content = content
      }
    }
  }
})

export const { postAdded, postUpdated } = postsSlice.actions

export default postsSlice.reducer
```

### Creating an Edit Post Form[#](https://redux.js.org/tutorials/essentials/part-4-using-data#creating-an-edit-post-form)

新しい`<EditPostForm>`コンポーネントは、`<AddPostForm>`と似ていますが、ロジックは少し異なる必要があります。ストアから適切なポスト・オブジェクトを取得し、それを使ってコンポーネントの状態フィールドを初期化し、ユーザーが変更できるようにする必要があります。ユーザーが変更を終えた後、変更されたタイトルとコンテンツの値をストアに保存します。また、React Routerの履歴APIを使用して、単一の投稿ページに切り替え、その投稿を表示します。

```jsx
// features/posts/EditPostForm.js
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import { postUpdated } from './postsSlice'

export const EditPostForm = ({ match }) => {
  const { postId } = match.params

  const post = useSelector(state =>
    state.posts.find(post => post.id === postId)
  )

  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)

  const dispatch = useDispatch()
  const history = useHistory()

  const onTitleChanged = e => setTitle(e.target.value)
  const onContentChanged = e => setContent(e.target.value)

  const onSavePostClicked = () => {
    if (title && content) {
      dispatch(postUpdated({ id: postId, title, content }))
      history.push(`/posts/${postId}`)
    }
  }

  return (
    <section>
      <h2>Edit Post</h2>
      <form>
        <label htmlFor="postTitle">Post Title:</label>
        <input
          type="text"
          id="postTitle"
          name="postTitle"
          placeholder="What's on your mind?"
          value={title}
          onChange={onTitleChanged}
        />
        <label htmlFor="postContent">Content:</label>
        <textarea
          id="postContent"
          name="postContent"
          value={content}
          onChange={onContentChanged}
        />
      </form>
      <button type="button" onClick={onSavePostClicked}>
        Save Post
      </button>
    </section>
  )
}
```

SinglePostPageと同様に、App.jsにインポートして、postIdをルートパラメータとしてこのコンポーネントをレンダリングするルートを追加する必要があります。

```jsx
// features/post/SinglePostPage.js
import { Link } from 'react-router-dom'

export const SinglePostPage = ({ match }) => {

        // omit other contents

        <p  className="post-content">{post.content}</p>
        <Link to={`/editPost/${post.id}`} className="button">
          Edit Post
        </Link>
```

### Preparing Action Payloads[#](https://redux.js.org/tutorials/essentials/part-4-using-data#preparing-action-payloads)

先ほど、createSliceのアクションクリエイターは通常1つの引数を想定しており、それがaction.payloadになります。これは最も一般的な使用パターンを単純化したものですが、時にはアクションオブジェクトのコンテンツを準備するために、より多くの作業を行う必要があります。postAddedアクションの場合、新規投稿のためのユニークなIDを生成する必要があり、ペイロードが`{id, title, content}`のようなオブジェクトであることを確認する必要があります。

今のところ、ReactコンポーネントでIDを生成してペイロードオブジェクトを作成し、ペイロードオブジェクトをpostAddedに渡しています。しかし、同じアクションを別のコンポーネントからディスパッチする必要があったり、ペイロードを準備するためのロジックが複雑だったりしたらどうでしょう？アクションをディスパッチするたびにそのロジックを複製しなければならず、このアクションのペイロードがどのようなものであるかをコンポーネントに正確に知らしめなければなりません。

> **CAUTION**
>
> アクションにユニークなIDやその他のランダムな値が必要な場合は、必ず最初にそれを生成してアクションオブジェクトに入れてください。レデューサーは決してランダムな値を計算してはいけません、なぜなら結果が予測できなくなるからです。

もし、postAddedアクションクリエイターを手書きで書いていたら、セットアップロジックを自分で中に入れることができたでしょう。

```js
// hand-written action creator
function postAdded(title, content) {
  const id = nanoid()
  return {
    type: 'posts/postAdded',
    payload: { id, title, content }
  }
}
```

しかし、Redux ToolkitのcreateSliceがこれらのアクションスクリエータを生成してくれています。自分で書く必要がないのでコードは短くなりますが、それでもaction.payloadの内容をカスタマイズする方法が必要です。

幸いなことに、createSliceではreducerを書く際に「prepare callback」関数を定義することができます。prepare callback」関数は、複数の引数を取り、ユニークIDなどのランダムな値を生成したり、アクションオブジェクトに入れる値を決定するために必要なその他の同期ロジックを実行したりすることができます。そして、payloadフィールドを含むオブジェクトを返す必要があります。(リターンオブジェクトには、アクションに追加の説明値を追加するために使用できるmetaフィールドと、このアクションが何らかのエラーを示しているかどうかを示すブール値であるべきエラーフィールドも含まれます)。

createSliceのreducersフィールドの中で、フィールドの1つを`{reducer, prepare}`のようなオブジェクトとして定義することができます。

```js
// features/posts/postsSlice.js
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postAdded: {
      reducer(state, action) {
        state.push(action.payload)
      },
      prepare(title, content) {
        return {
          payload: {
            id: nanoid(),
            title,
            content
          }
        }
      }
    }
    // other reducers here
  }
})
```

これで、コンポーネントはペイロードオブジェクトの形を気にする必要がなくなりました。アクションクリエイターが適切な方法でペイロードオブジェクトを作成します。そこで、コンポーネントを更新して、postAddedをディスパッチするときに、引数としてtitleとcontentを渡すようにします。

```jsx
// features/posts/AddPostForm.js
const onSavePostClicked = () => {
  if (title && content) {
    dispatch(postAdded(title, content))
    setTitle('')
    setContent('')
  }
}
```

## Users and Posts[#](https://redux.js.org/tutorials/essentials/part-4-using-data#users-and-posts)

これまでのところ、ステートのスライスは1つしかありません。ロジックはpostsSlice.jsで定義され、データはstate.postsに格納されており、すべてのコンポーネントはposts機能に関連しています。実際のアプリケーションでは、おそらく多くの異なる状態のスライスがあり、ReduxのロジックやReactのコンポーネントのためにいくつかの異なる「featureフォルダ」があるでしょう。

他の人が関わっていなければ、「ソーシャルメディア」アプリはできません。アプリにユーザーのリストを記録する機能を追加し、そのデータを利用するために投稿関連の機能を更新してみましょう。

### Adding a Users Slice[#](https://redux.js.org/tutorials/essentials/part-4-using-data#adding-a-users-slice)

ユーザー」の概念は「投稿」の概念とは異なるので、ユーザー用のコードとデータを投稿用のコードとデータから分離しておきたいと思います。新しい features/users フォルダを追加して、usersSlice ファイルを置きます。postsスライスと同じように、今は作業用のデータがあるように、いくつかの初期エントリーを追加します。

```js
// features/users/usersSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = [
  { id: '0', name: 'Tianna Jenkins' },
  { id: '1', name: 'Kevin Grant' },
  { id: '2', name: 'Madison Price' }
]

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {}
})

export default usersSlice.reducer
```

今のところ、実際にデータを更新する必要はありませんので、 reducersフィールドは空のオブジェクトのままにしておきます。(この点については後のセクションで説明します）。)

先ほどと同じように、usersReducerをストアファイルにインポートして、ストアのセットアップに追加します。

```js
// app/store.js
import { configureStore } from '@reduxjs/toolkit'

import postsReducer from '../features/posts/postsSlice'
import usersReducer from '../features/users/usersSlice'

export default configureStore({
  reducer: {
    posts: postsReducer,
    users: usersReducer
  }
})
```

### Adding Authors for Posts[#](https://redux.js.org/tutorials/essentials/part-4-using-data#adding-authors-for-posts)

私たちのアプリのすべての投稿は、いずれかのユーザーによって書かれており、新しい投稿を追加するたびに、どのユーザーがその投稿を書いたかを追跡する必要があります。実際のアプリでは、現在ログインしているユーザを追跡する state.currentUser フィールドを用意して、ユーザが投稿を追加するたびにその情報を使用します。

この例では、シンプルにするために、`<AddPostForm>`コンポーネントを更新して、ドロップダウンリストからユーザを選択できるようにし、そのユーザのIDを投稿の一部として含めることにします。投稿オブジェクトにユーザーIDが含まれていれば、それを使ってユーザーの名前を調べ、UIの個々の投稿に表示することができます。

まず、postAdded action creatorを更新して、ユーザーIDを引数として受け取り、それをアクションに含める必要があります。(また、initialStateの既存の投稿エントリを更新して、例示したユーザIDの1つをpost.userフィールドに入れます)。

```js
// features/posts/postsSlice.js
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postAdded: {
      reducer(state, action) {
        state.push(action.payload)
      },
      prepare(title, content, userId) {
        return {
          payload: {
            id: nanoid(),
            title,
            content,
            user: userId
          }
        }
      }
    }
    // other reducers
  }
})
```

さて、`<AddPostForm>`では、useSelectorでストアからユーザのリストを読み込んで、ドロップダウンで表示します。そして、選択されたユーザーのIDを取得し、それをpostAddedアクションクリエイターに渡します。ついでに、フォームにちょっとした検証ロジックを追加して、タイトルとコンテンツの入力に実際のテキストが含まれている場合にのみ、ユーザーが "Save Post" ボタンをクリックできるようにします。

```jsx
// features/posts/AddPostForm.js

import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { postAdded } from './postsSlice'

export const AddPostForm = () => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [userId, setUserId] = useState('')

  const dispatch = useDispatch()

  const users = useSelector(state => state.users)

  const onTitleChanged = e => setTitle(e.target.value)
  const onContentChanged = e => setContent(e.target.value)
  const onAuthorChanged = e => setUserId(e.target.value)

  const onSavePostClicked = () => {
    if (title && content) {
      dispatch(postAdded(title, content, userId))
      setTitle('')
      setContent('')
    }
  }

  const canSave = Boolean(title) && Boolean(content) && Boolean(userId)

  const usersOptions = users.map(user => (
    <option key={user.id} value={user.id}>
      {user.name}
    </option>
  ))

  return (
    <section>
      <h2>Add a New Post</h2>
      <form>
        <label htmlFor="postTitle">Post Title:</label>
        <input
          type="text"
          id="postTitle"
          name="postTitle"
          placeholder="What's on your mind?"
          value={title}
          onChange={onTitleChanged}
        />
        <label htmlFor="postAuthor">Author:</label>
        <select id="postAuthor" value={userId} onChange={onAuthorChanged}>
          <option value=""></option>
          {usersOptions}
        </select>
        <label htmlFor="postContent">Content:</label>
        <textarea
          id="postContent"
          name="postContent"
          value={content}
          onChange={onContentChanged}
        />
        <button type="button" onClick={onSavePostClicked} disabled={!canSave}>
          Save Post
        </button>
      </form>
    </section>
  )
}
```

では、投稿リストアイテムや`<SinglePostPage>`の中で、投稿者の名前を表示する方法が必要です。同じような情報を複数の場所で表示したいので、ユーザーIDをプロップとして受け取り、適切なユーザーオブジェクトを検索し、ユーザーの名前をフォーマットするPostAuthorコンポーネントを作ることができます。

```jsx
// features/posts/PostAuthor.js
import React from 'react'
import { useSelector } from 'react-redux'

export const PostAuthor = ({ userId }) => {
  const author = useSelector(state =>
    state.users.find(user => user.id === userId)
  )

  return <span>by {author ? author.name : 'Unknown author'}</span>
}
```

各コンポーネントで同じパターンを踏襲していることに注目してください。Redux ストアからデータを読み取る必要があるコンポーネントは、useSelector フックを使用して、必要な特定のデータ部分を抽出することができます。また、多くのコンポーネントがReduxストアの同じデータに同時にアクセスすることができます。

これで、PostAuthorコンポーネントをPostsList.jsとSinglePostPage.jsの両方にインポートして、`<PostAuthor userId={post.user} />`のようにレンダリングできるようになりました。レンダリングすれば、投稿エントリを追加するたびに、選択されたユーザーの名前がレンダリングされた投稿の中に表示されます。

## More Post Features[#](https://redux.js.org/tutorials/essentials/part-4-using-data#more-post-features)

この時点で、投稿を作成・編集することができます。投稿フィードをより便利にするために、いくつかのロジックを追加してみましょう。

### Storing Dates for Posts[#](https://redux.js.org/tutorials/essentials/part-4-using-data#storing-dates-for-posts)

ソーシャルメディアのフィードは通常、投稿が作成された時間でソートされ、「5時間前」のような相対的な記述で投稿作成時間が表示されます。これを実現するためには、投稿エントリの日付フィールドを追跡する必要があります。

post.userフィールドの場合と同様に、postAdded prepareコールバックを更新して、アクションがディスパッチされる際にpost.dateが常に含まれるようにします。ただし、この日付は他のパラメータとして渡されるものではありません。アクションがディスパッチされたときの正確なタイムスタンプを常に使用したいので、prepareコールバック自身に処理させることにします。

> **CAUTION**
>
> Reduxのアクションとステートには、オブジェクト、配列、プリミティブなどのプレーンなJSの値のみを入れてください。クラスインスタンスや関数など、シリアライズできない値をReduxに入れてはいけません。

DateクラスのインスタンスをそのままReduxのストアに入れることはできないので、post.dateの値をタイムスタンプの文字列としてトラッキングします。

```js
// features/posts/postsSlice.js
		postAdded: {
      reducer(state, action) {
        state.push(action.payload)
      },
      prepare(title, content, userId) {
        return {
          payload: {
            id: nanoid(),
            date: new Date().toISOString(),
            title,
            content,
            user: userId,
          },
        }
      },
    },
```



投稿者と同様に、<PostsList>と<SinglePostPage>コンポーネントの両方に相対的なタイムスタンプの説明を表示する必要があります。ここでは、タイムスタンプの文字列を相対的な記述としてフォーマットするために、<TimeAgo>コンポーネントを追加します。date-fnsのようなライブラリには、日付を解析してフォーマットするための便利なユーティリティー関数がありますので、これを利用します。

```jsx
// features/posts/TimeAgo.js
import React from 'react'
import { parseISO, formatDistanceToNow } from 'date-fns'

export const TimeAgo = ({ timestamp }) => {
  let timeAgo = ''
  if (timestamp) {
    const date = parseISO(timestamp)
    const timePeriod = formatDistanceToNow(date)
    timeAgo = `${timePeriod} ago`
  }

  return (
    <span title={timestamp}>
      &nbsp; <i>{timeAgo}</i>
    </span>
  )
}
```

### Sorting the Posts List[#](https://redux.js.org/tutorials/essentials/part-4-using-data#sorting-the-posts-list)

<PostsList>は現在、Reduxストアに保存されているのと同じ順番ですべての投稿を表示しています。この例では、最も古い記事が最初に表示され、新しい記事を追加すると、それがposts配列の最後に追加されます。つまり、最新の投稿は常にページの一番下にあるということです。

通常、ソーシャルメディアのフィードでは、最新の投稿が最初に表示され、古い投稿を見るにはスクロールダウンします。ストアでは古いものから順にデータが保存されていますが、<PostsList>コンポーネントでデータを並べ替えることで、最新の投稿が最初に表示されるようになります。理論的には、state.posts配列がすでにソートされていることがわかっているので、リストを逆にすればよいのです。しかし、念のために自分でソートしたほうがいいでしょう。

array.sort()は既存の配列を変更するので、state.postsのコピーを作成し、そのコピーをソートする必要があります。post.dateフィールドが日付のタイムスタンプ文字列として保持されていることがわかっているので、これらを直接比較して正しい順序で投稿を並べ替えることができます。

```jsx
// features/posts/PostsList.js
// Sort posts in reverse chronological order by datetime string
const orderedPosts = posts.slice().sort((a, b) => b.date.localeCompare(a.date))

const renderedPosts = orderedPosts.map(post => {
  return (
    <article className="post-excerpt" key={post.id}>
      <h3>{post.title}</h3>
      <div>
        <PostAuthor userId={post.user} />
        <TimeAgo timestamp={post.date} />
      </div>
      <p className="post-content">{post.content.substring(0, 100)}</p>
      <Link to={`/posts/${post.id}`} className="button muted-button">
        View Post
      </Link>
    </article>
  )
})
```

また、postsSlice.jsのinitialStateに日付フィールドを追加する必要があります。ここでも date-fns を使って、現在の日付/時刻から分を引いて、お互いに異なるようにします。

```js
// features/posts/postsSlice.js
import { createSlice, nanoid } from '@reduxjs/toolkit'
import { sub } from 'date-fns'

const initialState = [
  {
    // omitted fields
    content: 'Hello!',
    date: sub(new Date(), { minutes: 10 }).toISOString()
  },
  {
    // omitted fields
    content: 'More text',
    date: sub(new Date(), { minutes: 5 }).toISOString()
  }
]
```

### Post Reaction Buttons[#](https://redux.js.org/tutorials/essentials/part-4-using-data#post-reaction-buttons)

このセクションには、もうひとつ新しい機能を追加しました。今、私たちの投稿はちょっと退屈です。そのためには、友達に絵文字でリアクションをしてもらうのが一番です。

そこで、`<PostsList>`と`<SinglePostPage>`の各記事の下に、絵文字のリアクションボタンを並べてみます。ユーザーがリアクションボタンをクリックするたびに、Reduxストアのその投稿にマッチするカウンターフィールドを更新する必要があります。リアクションカウンタのデータはReduxストアにあるので、アプリの異なる部分を切り替えても、そのデータを使用するコンポーネントには一貫して同じ値が表示されます。

投稿の著者やタイムスタンプと同様に、投稿を表示するあらゆる場所でこれを使用したいので、投稿をプロップとして受け取る `<ReactionButtons> `コンポーネントを作成します。まずは、中のボタンを表示し、各ボタンの現在のリアクション数を表示します。

```jsx
// features/posts/ReactionButtons.js
import React from 'react'

const reactionEmoji = {
  thumbsUp: '👍',
  hooray: '🎉',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀'
}

export const ReactionButtons = ({ post }) => {
  const reactionButtons = Object.entries(reactionEmoji).map(([name, emoji]) => {
    return (
      <button key={name} type="button" className="muted-button reaction-button">
        {emoji} {post.reactions[name]}
      </button>
    )
  })

  return <div>{reactionButtons}</div>
}
```

まだ post.reactions フィールドがデータに含まれていないので、initialState の post オブジェクトと postAdded prepare のコールバック関数を更新して、すべての投稿に`{thumbsUp: 0, hooray: 0}`のようなデータが含まれるようにする必要があります。.

次に、ユーザーがリアクションボタンをクリックしたときに、その投稿のリアクション数を更新する処理を行う新しいリデューサを定義します。

投稿を編集する場合と同様に、投稿のIDと、ユーザーがどのリアクションボタンをクリックしたかを知る必要があります。ここでは action.payload に {id, reaction} のようなオブジェクトを指定します。reducerは正しいpostオブジェクトを見つけて、正しいreactionフィールドを更新することができます。

```js
const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    reactionAdded(state, action) {
      const { postId, reaction } = action.payload
      const existingPost = state.find(post => post.id === postId)
      if (existingPost) {
        existingPost.reactions[reaction]++
      }
    }
    // other reducers
  }
})

export const { postAdded, postUpdated, reactionAdded } = postsSlice.actions
```

すでに見てきたように、createSliceによってreducerに「変異」するロジックを書くことができる。もしcreateSliceとImmerライブラリを使っていなかったら、existingPost.reactions[reaction]++という行は、実際に既存のpost.reactionsオブジェクトを変異させることになり、reducerのルールに従っていないため、おそらくアプリの他の場所でバグを引き起こすことになるでしょう。しかし、createSliceを使用しているので、この複雑な更新ロジックをよりシンプルな方法で書くことができ、Immerにこのコードを安全な不変の更新に変える作業を任せることができます。

アクションオブジェクトには、何が起こったかを説明するのに必要な最小限の情報しか含まれていないことに注目してください。どの投稿を更新する必要があるのか、どのリアクション名がクリックされたのかはわかっています。新しいリアクションカウンタの値を計算して、それをアクションに入れることもできましたが、アクションオブジェクトをできるだけ小さくして、状態更新の計算をreducerで行う方が常に良いでしょう。これは、リデューサが新しい状態を計算するのに必要なだけのロジックを含むことができるということでもあります。

> ##### INFO
>
> Immerを使用する場合、既存のステートオブジェクトを「mutate」させるか、新しいステート値を自分で返すことができますが、両方を同時に行うことはできません。詳しくは、Immerのドキュメントガイドの[「落とし穴」](https://immerjs.github.io/immer/pitfalls)と[「新しいデータを返す」](https://immerjs.github.io/immer/return)を参照してください。

最後のステップは、ユーザーがボタンをクリックしたときに reactionAdded アクションが実行されるように `<ReactionButtons>` コンポーネントを更新することです。

```jsx
// features/posts/ReactionButtons.jsx
import React from 'react'
import { useDispatch } from 'react-redux'

import { reactionAdded } from './postsSlice'

const reactionEmoji = {
  thumbsUp: '👍',
  hooray: '🎉',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀'
}

export const ReactionButtons = ({ post }) => {
  const dispatch = useDispatch()

  const reactionButtons = Object.entries(reactionEmoji).map(([name, emoji]) => {
    return (
      <button
        key={name}
        type="button"
        className="muted-button reaction-button"
        onClick={() =>
          dispatch(reactionAdded({ postId: post.id, reaction: name }))
        }
      >
        {emoji} {post.reactions[name]}
      </button>
    )
  })

  return <div>{reactionButtons}</div>
```

これで、リアクションボタンをクリックするたびに、カウンターが増加するはずです。アプリのいろいろな場所を見て回ると、この投稿を見るたびに正しいカウンターの値が表示されるはずです。たとえ` <PostsList>` でリアクションボタンをクリックした後、`<SinglePostPage> `でこの投稿を単独で見たとしてもです。

##### SUMMARY

- Any React component can use data from the Redux store as needed
  - Any component can read any data that is in the Redux store
  - Multiple components can read the same data, even at the same time
  - Components should extract the smallest amount of data they need to render themselves
  - Components can combine values from props, state, and the Redux store to determine what UI they need to render. They can read multiple pieces of data from the store, and reshape the data as needed for display.
  - Any component can dispatch actions to cause state updates
- Redux action creators can prepare action objects with the right contents
  - `createSlice` and `createAction` can accept a "prepare callback" that returns the action payload
  - Unique IDs and other random values should be put in the action, not calculated in the reducer
- Reducers should contain the actual state update logic
  - Reducers can contain whatever logic is needed to calculate the next state
  - Action objects should contain just enough info to describe what happened

## What's Next?[#](https://redux.js.org/tutorials/essentials/part-4-using-data#whats-next)

ここまでくると、ReduxストアやReactコンポーネントでデータを扱うことに慣れてきたはずです。これまでは、初期状態のデータやユーザーが追加したデータを使ってきました。パート5：非同期ロジックとデータフェッチでは、サーバーAPIから送られてくるデータの扱い方を見ていきます。

