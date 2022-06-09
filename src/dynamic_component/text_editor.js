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
        isError: false,
        isEditMode: false,
        editText: ""
      }
    },
    computed: {
      isPublic() {
        return this.state.json["@meta"]?.read === "public"
      },
      textList() {
        if (this.state.json?.list) {
          return Object.keys(this.state.json.list)
            .map(key => ({ ...this.state.json.list[key], key: "list/" + key })).sort((a, b) => {
              return a.updatedAt > b.updatedAt ? -1 : 1
            })
        }
        return []
      },
      editClass() {
        if (this.state.isEditMode) {
          return "is-active"
        }
        return "";
      },
      loadingClass() {
        if (this.state.isLoading) {
          return "is-loading"
        }
        return "";
      }
    },
    async delete(path) {
      if (!confirm("削除してよろしいですか？")) {
        return;
      }
      this.state.isLoading = true;
      try {
        await this.firebase.child(path).delete();
        this.state.json = await this.firebase.getJSON();
      } catch (e) {
        eventBus.publish("show-message", { text: "Error! " + e.message, class: "is-warning" });
      }
      this.state.isLoading = false;
    },
    async toPublic(flg) {
      this.state.isLoading = true;
      try {
        const data = {
          read: flg ? "public" : ""
        }
        await this.firebase.child("@meta").patch(JSON.stringify(data));
        this.state.json = await this.firebase.getJSON();
        this.state.isEditMode = false;
      } catch (e) {
        eventBus.publish("show-message", { text: "Error! " + e.message, class: "is-warning" });
      }
      this.state.isLoading = false;
    },
    async save() {
      this.state.isLoading = true;
      try {
        if (this.state.editPath) {
          const data = {
            text: this.state.editText,
            title: this.state.editTitle,
            updatedAt: new Date().toUTCString()
          }
          // patch
          await this.firebase.child(this.state.editPath).patch(JSON.stringify(data));
        } else {
          const data = {
            text: this.state.editText,
            title: this.state.editTitle,
            updatedAt: new Date().toUTCString(),
            createdAt: new Date().toUTCString()
          }
          await this.firebase.child("list").post(JSON.stringify(data));
        }
        this.state.json = await this.firebase.getJSON();
        this.state.isEditMode = false;
      } catch (e) {
        eventBus.publish("show-message", { text: "Error! " + e.message, class: "is-warning" });
      }
      this.state.isLoading = false;
    },
    async edit(path = "", text = "", title = "") {
      this.state.isEditMode = true;
      this.state.editText = text;
      this.state.editPath = path;
      this.state.editTitle = title;
    },
    changeValue(key, value) {
      this.state.isError = false;
      try {
        this.state[key] = value
      } catch (e) {
        this.state.isError = true;
        eventBus.publish("show-message", { text: "Error! " + e.message, class: "is-warning" });
      }
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
        if (!window.confirm("新規ノードを作成しますか？")) {
          return
        }
        this.firebase = await FirebaseRest.createNode("text" + Date.now());
        const url = new URL(location.href);

        url.searchParams.set("jsonUrl", this.firebase.jsonUrl);
        url.searchParams.set("refreshToken", this.firebase.refreshToken);

        eventBus.publish("show-message", { text: "新規ノードを作成しました。" });
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
    <p class="field">
      <button class="button is-link ${this.loadingClass}" ?disabled="${this.state.isError}"
        @click="${() => this.edit()}">
        新規作成
      </button>
    </p>
    <div class="field has-addons">
      <p class="control">
        <button class="button ${this.loadingClass} ${this.isPublic && " is-info"}"
          @click="${() => this.toPublic(true)}">
          <span>公開</span>
        </button>
      </p>
      <p class="control">
        <button class="button ${this.loadingClass} ${!this.isPublic && " is-info"}"
          @click="${() => this.toPublic(false)}">
          <span>非公開</span>
        </button>
      </p>
    </div>
  </div>
  <div class="hero-body">
    <div class="columns is-multiline is-mobile">
      ${this.textList.map(obj => html`
      <div class="column" style="width: fit-content;">
        <div class="card">
          <header class="card-header">
            <p class="card-header-title">
              ${obj.title || "no title"}
            </p>
          </header>
          <div class="card-content">
            <div class="content">
              ${obj.text}
              <br>
              <br>
              <time datetime="${new Date(obj.updatedAt).toLocaleDateString()}">${new
          Date(obj.updatedAt).toLocaleString()}</time>
            </div>
          </div>
          <footer class="card-footer">
            <a href="#" class="card-footer-item" @click="${() => this.edit(obj.key, obj.text, obj.title)}">Edit</a>
            <a href="#" class="card-footer-item" @click="${() => this.delete(obj.key)}">Delete</a>
          </footer>
        </div>
      </div>
      `)}
    </div>
  </div>
</section>
<div class="modal ${this.editClass}">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <div class="modal-card-title">
        <input type="text" class="text" placeholder="title"
          @change="${(event) => this.changeValue('editTitle', event.target.value)}" .value="${this.state.editTitle}">
      </div>
      <button class="delete" aria-label="close" @click="${() => this.state.isEditMode = false}"></button>
    </header>
    <section class="modal-card-body">
      <textarea class="textarea is-large" @change="${(event) => this.changeValue('editText', event.target.value)}"
        rows="${this.text?.split('\n').length || 5}" .value="${this.state.editText}"></textarea>
    </section>
    <footer class="modal-card-foot">
      <button class="button is-success" @click="${this.save}">Save changes</button>
      <button class="button" @click="${() => this.state.isEditMode = false}">Cancel</button>
    </footer>
  </div>
</div>
    `
    }
  }
)
