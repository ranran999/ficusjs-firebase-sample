import { createComponent, getEventBus } from '../../lib/index.mjs'
import { html, renderer } from '../../lib/lit-html.mjs'
import { FirebaseRest } from "../firebaseUtil.js";
import { router } from '../router.js'
const eventBus = getEventBus();
createComponent('component-editor',
  {
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
    state() {
      return {
        json: "",
        isLoading: true,
        isError: false
      }
    },
    computed: {
      formatedJSON() {
        return JSON.stringify(this.state.json, " ", " ");
      },
      loadingClass() {
        if (this.state.isLoading) {
          return "is-loading"
        }
        return "";
      }
    },
    changeJson(event) {
      this.state.isError = false;
      try {
        this.state.json = JSON.parse(event.target.value)
      } catch (e) {
        this.state.isError = true;
        eventBus.publish("show-message", { text: "Error! " + e.message, class: "is-warning" });
      }
    },
    async save() {
      this.state.isLoading = true;
      try {
        await this.firebase.patch(JSON.stringify(this.state.json));
      } catch (e) {
        eventBus.publish("show-message", { text: "Error! " + e.message, class: "is-warning" });
      }
      this.state.isLoading = false;
    },
    async created() {
      if (this.props.jsonUrl) {
        this.firebase = new FirebaseRest(this.props.jsonUrl, this.props.refreshToken);
        this.state.isLoading = true;
        try {
          this.state.json = await this.firebase.getJSON();
        } catch (e) {
          eventBus.publish("show-message", { text: "Error! " + e.message });
        }
        this.state.isLoading = false;
      } else {
        let prefix = prompt("新規ノードを作成しますか？\nノード名のプリフィックスを入力してください。", "sample");
        if (!prefix) {
          return
        }
        this.firebase = await FirebaseRest.createNode(prefix + Date.now());
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
<section class="hero is-primary is-fullheight-with-navbar">
  <div class="hero-head">
    <button class="button is-info ${this.loadingClass}" ?disabled="${this.state.isError}" @click="${this.save}">
      保存
    </button>
  </div>
  <div class="hero-body">
    <textarea class="textarea is-large" ?disabled="${this.state.isLoading}" @change="${this.changeJson}"
      rows="${this.formatedJSON.split('\n').length}" .value="${this.formatedJSON}"></textarea>
  </div>
</section>
    `
    }
  }
)
