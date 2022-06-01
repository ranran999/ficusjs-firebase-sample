# ficusjs-firebase-sample

ビルドなしで簡易ツールを作りたい。

WebComponent をネイティブで使うのはまだ時期早々と思われるため ficusjs を使ってみる。

データの保存は FirebaseDatabase の REST API にする。

Deploy 先は GithubPages:
https://ranran999.github.io/ficusjs-firebase-sample/#/

## できること

URL パラメータに指定された FirebaseDatabase の JSON を取得して編集する。

「編集」ボタンを押下すると FirebaseDatabase の URL と更新ようトークンを発行し URL のクエリに設定する。

# 依存するライブラリ

## ficusjs

js/index.mjs

https://github.com/ficusjs/ficusjs

## htm

js/html.mjs

https://github.com/ficusjs/ficusjs-renderers

# Firebase-wrap

Firebase の一部機能を簡易に使うための以下のプロジェクトを使用

Github:https://github.com/ranran999/simple_firebase_server.git

デブロイ先:https://firebase-pipe.herokuapp.com
