import { createRouter } from '../lib/router.mjs'

export class Hash {
  constructor(url = location.href) {
    const u = new URL(url)
    const path = u.hash.substring(1);
    this.url = new URL(location.origin + path);
  }
  clearParam(key) {
    this.url.searchParams.delete(key)
  }
  getParams() {
    return [...this.url.searchParams.keys()].reduce((p, key) => {
      p[key] = this.url.searchParams.get(key)
      return p;
    }, {});
  }
  getPath() {
    return this.url.pathname
  }
  getPathSearch() {
    return this.url.pathname + this.url.search
  }
  setParam(key, value) {
    this.url.searchParams.set(key, value)
  }
  setPath(path = "/") {
    const nextUrl = new URL(location.origin + path);
    [...this.url.searchParams.keys()].filter(key => {
      return !nextUrl.searchParams.has(key)
    }).forEach(key => {
      // 配列のキーは考慮しない
      nextUrl.searchParams.set(key,
        this.url.searchParams.get(key)
      )
    })
    this.url = nextUrl;
  }
}
class Config {
  constructor(configUrl) {
    this.importPromise = {}
    if (configUrl) {
      //TODO: routerを介してDIされたことを警告する
      //throw "no data."
      this.configPromise = fetch(configUrl).then(r => r.json());
    } else {
      this.configPromise = Promise.resolve({
        title: "JSON情報の読み書き",
        //sessionStorageKey: "plainReadWrite@" + location.host,
        editor: {
          url: "./component/editor.js",
          props: {
            jsonUrl: {
              key: "json-url",
              from: "queryParams",// queryParams or contextParams 
              getter: "jsonUrl",
            },
            refreshToken: {
              key: "refresh-token",
              from: "queryParams",// queryParams or contextParams 
              getter: "refreshToken",
            },
          }
        },
        viewer: {
          url: "./component/viewer.js",
          props: {
            jsonUrl: {
              key: "json-url",
              from: "queryParams",// or contextParams
              getter: "jsonUrl",
            },
            refreshToken: {
              key: "refresh-token",
              from: "queryParams",// or contextParams
              getter: "refreshToken",
            },
          }
        },
      })
    }
  }
  async getProps(contextPath, { contextParams, queryParams }) {
    const config = await this.configPromise;
    if (config[contextPath]?.props) {
      return Object.values(config[contextPath].props).map(prop => {
        const attributeKey = prop.key;
        let attributeValue;
        switch (prop.from) {
          case "queryParams":
            attributeValue = queryParams[prop.getter]
            break;
          case "contextParams":
            attributeValue = contextParams[prop.getter]
            break;
          default:
            break;
        }
        if (attributeValue && attributeKey) {
          return `${attributeKey}="${attributeValue}"`
        }
        return ""
      }).filter(e => e).join(" ")
    }
    return "";
  }
  async importComopnent(contextPath) {
    if (!this.importPromise[contextPath]) {
      const config = await this.configPromise;
      this.importPromise[contextPath] = import(config[contextPath].url);
    }
    await this.importPromise[contextPath];
  }
}
let config;
export const router = createRouter([
  {
    path: '', action: async (context, queryParams) => {
      return { redirect: "/viewer" + context.location.search }
    }
  },
  {
    /* 可読性のかけらもない悪いルーティング /editorと/viewer を受けるだけ */
    path: '/:@component', action: async (context, queryParams) => {
      const component = context.params["@component"]
      const configUrl = context.params["%40configUrl"];
      if (!config) {
        config = new Config(configUrl);
      }
      await config.importComopnent(component);
      const propsElem = await config.getProps(component, { contextParams: context.params, queryParams });
      return `<component-${component} ${propsElem}"></component-${component}>`
    }
  }
], '#router-outlet', {
  mode: 'hash'
})
