import { createComponent, getEventBus, withEventBus } from '../../lib/index.mjs'
import { html, renderer } from '../../lib/lit-html.mjs'
let _id = 1;
createComponent('component-message',
  withEventBus(getEventBus(), {
    renderer,
    state() {
      return {
        messages: []//{ text: "message",class:"is-info",timer:1000*5 }
      }
    },
    showMessage(message) {
      _id++;
      this.state.messages = [...this.state.messages, { ...message, _id }]
      message.timer && setTimeout(() => {
        this.state.messages = this.state.messages.filter(m => m._id !== _id)
      }, message.timer);
    },
    mounted() {
      this.eventBus.subscribe('show-message', this.showMessage)
    },
    render() {
      return this.state.messages.map((message, index) => html`
    <div class="notification ${message.class}">
      <button class="delete"
        @click="${() => this.state.messages = this.state.messages.filter(m => m._id !== message._id)}"></button>
      ${message.text}
    </div>`)
    }
  })
)