/* 決して公開されることのない技術検証のためのコンポーネント　どこから呼び出しても動作するよう絶対パスの応酬 */
import { createComponent, getEventBus, withStyles } from '../../lib/index.mjs'
import { css } from "../../lib/css.mjs"
import { html, renderer } from '../../lib/lit-html.mjs'
import { FirebaseRest } from "../firebaseUtil.js";
import { router } from '../router.js'
const eventBus = getEventBus();
import "../component/loading.js"

createComponent('component-editor', withStyles({
  renderer,
  props: {
    jsonUrl: {
      type: String,
      required: false
    },
    refreshToken: {
      type: String,
      required: false
    }
  },
  styles() {
    return css`
    .search-sticky{
      position:sticky;
      top:1.4rem;
      z-index:10;
   }
   .card > .delete {
    right: .5rem;
    position: absolute;
    top:.5rem;
    z-index:10;
    }
    `
  },
  state() {
    return {
      json: {},
      imagelist: [],
      irasutoyaList: [],
      searchWord: "",
      isCreateLoading: false,
      isSearchLoading: false,

    }
  },
  mounted() {
  },
  computed: {
    searchResultList() {
      return this.state.irasutoyaList.filter(e => !this.state.imagelist.some(o => o.src == e.src))
    }
  },
  async enterSubmit(e) {
    if (e.key == "Enter" && !e.isComposing) {
      this.state.searchWord = e.target.value;
      await this.search();
    }
  },
  async search() {
    // 二重エンター防止
    if (this.state.isSearchLoading) return
    this.state.isSearchLoading = true
    let irasutoyaUrl = `https://www.irasutoya.com/search`;
    if (this.state.searchWord) {
      // 二重URLエンコードを防ぐため直接設定する。
      irasutoyaUrl += "?q=" + this.state.searchWord;
    }
    const res = await fetch(`https://firebase-pipe.herokuapp.com/?@action=proxy&@url=${encodeURIComponent(irasutoyaUrl.toString())}`);
    const html = await res.text();

    const dom = (new DOMParser()).parseFromString(html, "text/html");
    //const images = [...dom.body.querySelectorAll(".main .date-outer img")].map(i => ({ src: i.src, title: i.getAttribute("alt") })).filter(e => e.title)
    const images = [...dom.body.querySelectorAll("script")].map(s => s.textContent || "")
      .map(txt => txt.split('"'))
      .filter(array => array[1] && array[1].indexOf("http") === 0 && array[3])
      .map(array => ({ src: array[1], title: array[3] }));
    images.forEach(i => i.src = i.src.split("/s72-c/").join("/s400/").split("=s72-c").join("=s180-c"))
    this.state.irasutoyaList = [...images.filter(i => !this.state.irasutoyaList.some(ii => ii.src === i.src)), ...this.state.irasutoyaList,]
    this.state.isSearchLoading = false
  },
  async saveImage(scope, image) {
    if (scope === "delete") {
      this.state.imagelist = this.state.imagelist.map(e => {
        let columnClass
        if (e.src === image.src) {
          columnClass = "has-background-danger-light"
        }
        return {
          ...e,
          columnClass
        }
      })
    } else if (scope === "append") {
      this.state.irasutoyaList = this.state.irasutoyaList.map(e => {
        let columnClass;
        if (e.src === image.src) {
          columnClass = "has-background-primary-light"
        }
        return {
          ...e,
          columnClass
        }
      })
    }


    const json = this.state.json
    if (scope === "delete") {
      json.imagelist = this.state.imagelist.filter(e => e.src !== image.src)
    } else if (scope === "append") {
      json.imagelist = [image, ...this.state.imagelist]
    }

    try {
      this.state.json = await this.firebase.patch(JSON.stringify(json));
      this.state.imagelist = this.state.json.imagelist || [];
    } catch (e) {
      eventBus.publish("show-message", { text: "Error! " + e.message, class: "is-warning" });
    }

  },
  async created() {
    if (this.props.jsonUrl) {
      this.firebase = new FirebaseRest(this.props.jsonUrl, this.props.refreshToken);
      this.state.isCreateLoading = true;
      try {
        this.state.json = await this.firebase.getJSON();
        this.state.imagelist = this.state.json.imagelist || [];
      } catch (e) {
        eventBus.publish("show-message", { text: "Error! " + e.message });
      }
      this.state.isCreateLoading = false;
    } else {
      if (!window.confirm("新規ノードを作成しますか？")) {
        return
      }
      this.firebase = await FirebaseRest.createNode("irasytoya_images" + Date.now())
      const url = new URL(location.href);

      url.searchParams.set("jsonUrl", this.firebase.jsonUrl);
      url.searchParams.set("refreshToken", this.firebase.refreshToken);

      eventBus.publish("show-message", { text: "新規ノードを作成しました。URLにアクセストークンを含むため公開しないようにしてください。" });
      router.replace({
        pathname: "/editor",
        search: url.search
      })
    }
  },
  render() {
    if (!this.props.jsonUrl) {
      return html`<h1 class="title">編集するデータが見つかりません。</h1>`
    }
    return html`
        <h2 class="title">編集中の画像リスト</h2>
        ${this.state.isCreateLoading ? html`<component-loading></component-loading>` : html`
        <div class="columns is-multiline is-mobile">
          ${this.state.imagelist.length === 0 ? html`<div class="column">画像を追加してください.</div>` : this.state.imagelist.map(e =>
      html`
          <div class="column is-half-mobile is-one-third-tablet has-background-primary-light ${e.columnClass}">
            <div class="card">
              <button class="delete is-large" @click=${() => this.saveImage("delete", e)}></button>
              <div class="card-image">
                <figure class="image is-4by3">
                  <img src="${e.src}" alt="${e.title}">
                </figure>
              </div>
            </div>
          </div>
          `)}
        </div>
        `}
        <h2 class="title">画像を追加する</h2>
        <div class="field search-sticky">
          <div class="control">
            <input class="input" type="text" placeholder="検索ワードを入力してエンター" @keyup="${this.enterSubmit}"
              .value="${this.state.searchWord}">
          </div>
        </div>
        ${this.state.isSearchLoading ? html`<component-loading></component-loading>` : html`
        <div class="columns is-multiline is-mobile">
          ${this.searchResultList.map(e => html`
          <div class="column is-half-mobile is-one-third-tablet ${e.columnClass}">
            <div class="card">
              <div class="card-image">
                <figure class="image is-4by3" @click=${() => this.saveImage("append", e)}>
                  <img src="${e.src}" alt="${e.title}">
                </figure>
              </div>
            </div>
          </div>
          `)}
        </div>
        `}
      `
  }
})
)