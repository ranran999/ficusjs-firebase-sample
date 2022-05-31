import { createComponent, getEventBus } from '../../lib/index.mjs'
import { html, renderer } from '../../lib/lit-html.mjs'
import { FirebaseRest } from "../firebaseUtil.js";
const eventBus = getEventBus();

createComponent('component-viewer',
  {
    renderer,
    props: {
      jsonUrl: {
        type: String,
        required: true
      },
      refreshToken: {
        type: String,
        required: false
      }
    },
    state() {
      return {
        json: "",
        isLoading: false
      }
    },
    async created() {
      if (this.props.jsonUrl) {
        this.state.isLoading = true;
        try {
          this.firebase = new FirebaseRest(this.props.jsonUrl, this.props.refreshToken);
          this.state.json = await this.firebase.getJSON();
        } catch (e) {
          eventBus.publish("show-message", { text: "Error! " + e.message, class: "is-warning" });
        }
        this.state.isLoading = false;
      }
    },
    render() {
      if (this.state.isLoading) {
        return "読込中。。。"
      } else if (!this.state?.json) {
        //ng
        return "表示するデータがありません。「編集」ボタンから新しいデータを作成ください。"
      }
      return html`
<section class="hero is-link is-fullheight-with-navbar">
  <div class="hero-body">
    <p class="title">
      <pre>
${JSON.stringify(this.state.json, "  ", "  ")}
      </pre>
    </p>
  </div>
</section>
    `
    }
  }
)
