/**
 * version.ts
 */

import * as alert from './alert';
import * as msg from './messages';

export let version = '0.5.9';
export let date = '29-06-2018';

export function about() {
    var s = msg.msg('versionname') + version + " - " + date + "</br></br>";
    s += msg.msg('shorthelp');
    alert.alertUser(s);
};
