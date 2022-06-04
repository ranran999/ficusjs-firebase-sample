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
      },
      selectedImageSrc: {
        type: String,
        default: "",
        required: false
      }
    },
    state() {
      return {
        isLoading: true,
        imagelist: [],
        selectedImageSrc: "",
        selectedImageTitle: ""
      }
    },
    mounted() {
    },
    computed: {
      totalProducts() {
        return this.state.products.reduce((sum, product) => {
          return sum + product.quantity
        }, 0)
      }
    },
    clearSelect() {
      this.state.selectedImageSrc = "";
      this.state.selectedImageTitle = "";
      const url = new URL(location.href);
      url.searchParams.delete('selectedImageSrc');
      window.history.pushState(null, null, url); // or pushState replaceState

    },
    selectImage(img) {
      this.state.selectedImageSrc = img.src;
      this.state.selectedImageTitle = img.title;
      const url = new URL(location.href);
      url.searchParams.set('selectedImageSrc', img.src);
      window.history.pushState(null, null, url); // or pushState replaceState
      //router.push("?selectedImageSrc=" + encodeURIComponent(img.src));
    },
    async created() {
      if (this.props.jsonUrl) {
        this.firebase = new FirebaseRest(this.props.jsonUrl, this.props.refreshToken);
        this.state.isLoading = true;
        try {
          this.state.json = await this.firebase.getJSON();
          this.state.imagelist = this.state.json.imagelist || [];
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
        <div class="columns is-multiline is-mobile">
          ${this.state.imagelist.map(e => html`
          <div class="column is-half-mobile is-one-third-tablet">
            <div class="card">
              <div class="card-image">
                <figure class="image is-4by3" @click=${()=> this.selectImage(e)}>
                  <img src="${e.src}" alt="${e.title}">
                </figure>
              </div>
            </div>
          </div>
          `)}
        </div>
        ${this.state.selectedImageSrc ? html`
        <image-modal title="${this.state.selectedImageTitle}" src="${this.state.selectedImageSrc}" @close="${this.clearSelect}">
        </image-modal>
        `: ""}
        
    `
    }
  }
)
createComponent('image-modal', {
  renderer,
  props: {
    src: {
      type: String,
      default: "",
      required: false
    },
    title: {
      type: String,
      default: "",
      required: false
    },
  },
  state() {
    return {
    }
  },
  computed: {
  },
  render() {
    return html`
      <div class="modal is-active">
        <div class="modal-background has-background-white"></div>
        <div class="modal-content">
          <p class="image is-4by3">
            <img src="${this.props.src}" alt="${this.props.title}">
          </p>
        </div>
        <button class="modal-close is-large has-background-black" aria-label="close"
          @click="${() => this.emit('close')}"></button>
      </div>
    `
  }
}
)