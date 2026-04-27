type Listener = (isLoading: boolean) => void;

let listeners: Listener[] = [];
let requestCount = 0;

export const spinnerService = {
  show: () => {
    requestCount++;
    if (requestCount === 1) {
      listeners.forEach((cb) => cb(true));
    }
  },
  hide: () => {
    requestCount = Math.max(0, requestCount - 1);
    if (requestCount === 0) {
      listeners.forEach((cb) => cb(false));
    }
  },
  subscribe: (cb: Listener) => {
    listeners.push(cb);
    cb(requestCount > 0);
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  },
};
