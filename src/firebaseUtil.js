
export class FirebaseRest {
  // FIXME こんなところにURLを書いては行けない
  static firebseWrapperUrl = "https://firebase-pipe.herokuapp.com"
  static async createNode(path) {
    const u = new URL(FirebaseRest.firebseWrapperUrl);
    u.searchParams.append("@path", path);
    u.searchParams.append("@action", "createNode");
    const r = await fetch(u.toString());
    const json = await r.json();
    const jsonUrl = json.databaseURL + "/" + json.path + ".json";
    const ret = new FirebaseRest(jsonUrl, json.refreshToken);
    ret._idToken = json.idToken;
    return ret
  }
  constructor(jsonUrl, refreshToken) {
    this.jsonUrl = jsonUrl;
    this.refreshToken = refreshToken;
  }
  async _setIdtoken() {
    const u = new URL(FirebaseRest.firebseWrapperUrl);
    u.searchParams.append("@refreshToken", this.refreshToken);
    u.searchParams.append("@action", "getToken");
    const r = await fetch(u.toString());
    const json = await r.json();
    this._idToken = json.idToken;
    return json.idToken
  }
  async _request(idToken, option = { method: "GET" }) {
    const u = new URL(this.jsonUrl);
    if (idToken) {
      u.searchParams.append("auth", idToken);
    }
    const response = await fetch(u.toString(), option);
    const json = await response.json();
    if (!response.ok) {
      throw new Error("status:" + response.status + " body:" + JSON.stringify(json));
    }
    return json;
  }

  async _privateRequest(option) {
    let isOldIdToken;
    if (this._idToken) {
      isOldIdToken = true;
    } else {
      isOldIdToken = false;
      await this._setIdtoken();
    }
    try {
      return await this._request(this._idToken, option);
    } catch (e) {
      // キャッシュ切れの場合を考慮し２回やってみる。
      if (isOldIdToken) {
        await this._setIdtoken();
        return await this._request(this._idToken, option);
      } else {
        throw e;
      }
    }
  }

  child(path) {
    if (!path) {
      throw "no path!"
    }
    const jsonUrl = this.jsonUrl.substring(0, this.jsonUrl.length - 5) + "/" + path + ".json"
    return new FirebaseRest(jsonUrl, this.refreshToken);
  }
  async getJSON() {
    if (this.refreshToken) {
      return await this._privateRequest();
    } else {
      return await this._request()
    }
  }
  async patch(body) {
    if (this.refreshToken) {
      return await this._privateRequest({ method: "PATCH", body });
    } else {
      return await this._request(null, { method: "PATCH", body })
    }
  }
  async post(body) {
    if (this.refreshToken) {
      return await this._privateRequest({ method: "POST", body });
    } else {
      return await this._request(null, { method: "POST", body })
    }
  }
  async delete() {
    // ルートは消せない。childから呼び出された場合のみ動作する。
    if (this.refreshToken) {
      return await this._privateRequest({ method: "DELETE" });
    } else {
      return await this._request(null, { method: "DELETE" })
    }
  }
}
