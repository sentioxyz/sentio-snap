import {getState} from "./store";

export async function api(url: string, method: string, data?: any) {
  const headers = new Headers();
  let body;
  if (data) {
    headers.append('Content-Type', 'application/json');
    body = JSON.stringify(data);
  }
  const state = await getState();
  if (state?.apiKey) {
    headers.append('api-key', state.apiKey as string);
  }
  const resp = await fetch(url, {
    method,
    headers,
    body
  });
  if (!resp.ok) {
    let err = await resp.text()
    try {
      const json = JSON.parse(err)
      if (json?.message) {
        err = json.message
      }
    } catch (e) {}
    console.error(`${method} ${url} failed`, resp.status, err)
    throw new Error(err);
  }

  return await resp.json();
}
