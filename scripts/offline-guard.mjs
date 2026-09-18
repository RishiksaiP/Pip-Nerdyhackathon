// Release rehearsal only: block remote application fetches without changing system Wi-Fi.
const original=globalThis.fetch;
globalThis.fetch=(input,init)=>{const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))return Promise.reject(new Error('Remote network disabled for offline rehearsal'));return original(input,init);};
