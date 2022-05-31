import { createRouter } from '../lib/router.mjs'

class Config {
  constructor(configUrl) {
    this.importPromise = {}
    if (configUrl) {
      //TODO: routerを介してDIされたことを警告する
      throw "no data."
      this.configPromise = fetch(configUrl).then(r => r.json());
    } else {
      this.configPromise = Promise.resolve({
        editor: {
          url: "./component/editor.js",
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
      config = config || new Config(process.env.configUrl);
      await config.importComopnent("viewer");
      const propsElem = await config.getProps("viewer", { contextParams: context.params, queryParams });
      return `<component-viewer ${propsElem}"></component-viewer>`
    }
  },
  {
    path: '/editor', action: async (context, queryParams) => {
      config = config || new Config(process.env.configUrl);
      await config.importComopnent("editor");
      const propsElem = await config.getProps("editor", { contextParams: context.params, queryParams });
      return `<component-editor ${propsElem}"></component-editor>`
    }
  }
], '#router-outlet', {
  mode: 'hash'
})
