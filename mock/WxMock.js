/* eslint-disable */
const originalRequest = wx.request;
const mockedMap = {};
let installed = false;

function clone(data) {
  // Keep behavior close to previous mock.js output (fresh object each call).
  return data == null ? data : JSON.parse(JSON.stringify(data));
}

function installRequestHook() {
  if (installed) return;
  installed = true;

  Object.defineProperty(wx, 'request', { writable: true });
  wx.request = function request(config) {
    const matched = mockedMap[config.url];
    if (typeof matched === 'undefined') {
      return originalRequest(config);
    }

    const response =
      typeof matched.template === 'function' ? matched.template(config) : clone(matched.template);

    if (typeof config.success === 'function') {
      config.success(response);
    }
    if (typeof config.complete === 'function') {
      config.complete(response);
    }

    return {
      abort() {},
      onHeadersReceived() {},
      offHeadersReceived() {},
    };
  };
}

const Mock = {
  _mocked: mockedMap,
  setup: installRequestHook,
  mock(rurl, template) {
    installRequestHook();
    mockedMap[rurl] = {
      rurl,
      template,
    };
    return Mock;
  },
};

module.exports = Mock;
