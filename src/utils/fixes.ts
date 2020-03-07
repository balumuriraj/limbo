
// Remove after this fix: https://stackoverflow.com/questions/60361519/cant-find-a-variable-atob
import { decode, encode } from 'base-64'
import { Platform, InteractionManager } from 'react-native';

export function initFixes() {
  if (!(global as any).btoa) { (global as any).btoa = encode }
  if (!(global as any).atob) { (global as any).atob = decode }

  // Fix for timeout warning: https://github.com/firebase/firebase-js-sdk/issues/97
  const _setTimeout = global.setTimeout;
  const _clearTimeout = global.clearTimeout;
  const MAX_TIMER_DURATION_MS = 60 * 1000;
  if (Platform.OS === 'android') {
    // Work around issue `Setting a timer for long time`
    // see: https://github.com/firebase/firebase-js-sdk/issues/97
    const timerFix: any = {};
    const runTask = (id: any, fn: any, ttl: any, args: any) => {
      const waitingTime = ttl - Date.now();
      if (waitingTime <= 1) {
        InteractionManager.runAfterInteractions(() => {
          if (!timerFix[id]) {
            return;
          }
          delete timerFix[id];
          fn(...args);
        });
        return;
      }

      const afterTime = Math.min(waitingTime, MAX_TIMER_DURATION_MS);
      timerFix[id] = _setTimeout(() => runTask(id, fn, ttl, args), afterTime);
    };

    (global as any).setTimeout = (fn: any, time: any, ...args: any[]) => {
      if (MAX_TIMER_DURATION_MS < time) {
        const ttl = Date.now() + time;
        const id = '_lt_' + Object.keys(timerFix).length;
        runTask(id, fn, ttl, args);
        return id;
      }
      return _setTimeout(fn, time, ...args);
    };

    global.clearTimeout = id => {
      if (typeof id === 'string' && (id as any).startWith('_lt_')) {
        _clearTimeout(timerFix[id]);
        delete timerFix[id];
        return;
      }
      _clearTimeout(id);
    };
  }
}