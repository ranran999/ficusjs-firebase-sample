import { createComponent } from '../../lib/index.mjs'
import { html, renderer } from '../../lib/lit-html.mjs'
import { router } from '../router.js'

createComponent('component-header',
  {
    renderer,
    toggleMenu() {
      this.state.isMenuOpen = !this.state.isMenuOpen;
    },
    noticeMessage(e) {
      e.preventDefault()
      if (confirm("ページをリロードしてよろしいですか？")) {
        location.href = e.currentTarget.getAttribute('href');
      }
    },
    routeHandler(e) {
      e.preventDefault()
      this.state.isMenuOpen = false;
      router.push(
        {
          pathname: e.target.getAttribute('href'),
          search: location.search
        })
    },
    render() {
      return html`
    <nav class="navbar" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <a class="navbar-item" href="./" @click="${this.noticeMessage}">
          <img src="./img/logo.png" width="120" height="31" />
        </a>
    
        <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" @click="${this.toggleMenu}">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
    
      <div class="navbar-menu ${this.state.isMenuOpen && " is-active"}">
        <div class="navbar-start">
          <a class="navbar-item" href="/" @click="${this.routeHandler}">
            Home
          </a>
          <a class="navbar-item" href="/editor" @click="${this.routeHandler}">
            編集
          </a>
        </div>
      </div>
    </nav>
      `
    }
  })