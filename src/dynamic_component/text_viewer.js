import { createComponent, getEventBus } from '../../lib/index.mjs'
import { html, renderer } from '../../lib/lit-html.mjs'
import { FirebaseRest } from "../firebaseUtil.js";
import "../component/loading.js"

const eventBus = getEventBus();


createComponent('component-viewer',
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
      }
    },
    mounted() {
    },
    computed: {
      textList() {
        if (this.state.json?.list) {
          return Object.keys(this.state.json.list)
            .map(key => ({ ...this.state.json.list[key], key: "list/" + key })).sort((a, b) => {
              return a.updatedAt > b.updatedAt ? -1 : 1
            })
        }
        return []
      },
    },
    copy(event, clipboardText) {
      const text = event.target.textContent;
      navigator.clipboard.writeText(clipboardText);
      event.target.textContent = `👏`
      setTimeout(() => event.target.textContent = text, 500)
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
        eventBus.publish("show-message", { text: "表示するデータが見つかりません。" });
      }
    },
    render() {
      if (this.state.isLoading) {
        //ng
        return html`<component-loading></component-loading>`
      }
      return html`
      <section class="hero is-primary is-fullheight-with-navbar">
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
                  <a href="#" class="card-footer-item" @click="${(event) => this.copy(event, obj.text)}">Copy Text</a>
                  <a href="#" class="card-footer-item"
                    @click="${(event) => this.copy(event, this.firebase.child(obj.key).jsonUrl)}">Copy URL</a>
                </footer>
              </div>
            </div>
            `)}
          </div>
        </div>
      </section>
    `
    }
  }
)
