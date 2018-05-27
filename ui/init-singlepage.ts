/**
 * initalone.js
 */

import * as events from './events';
import * as odd from '../teiedit/odd';
import * as schema from '../teiedit/schema';
import * as edit from '../teiedit/edit';
import * as syscall from './opensave';
import * as help from './help';
import * as common from './common';
import * as msg from './messages';

function bodyKeys(e) {
/*    
    console.log('keyCode '+ e.keyCode);
    console.log('charCode '+ e.charCode);
    console.log('ctrl '+ e.ctrlKey);
    console.log('alt '+ e.altKey);
    console.log('shift '+ e.shiftKey);
    console.log('meta '+ e.metaKey);
    console.log('ident ' + e.keyIdentifier);
*/    
/*    if (e.which === 117 && e.altKey !== true && e.ctrlKey !== true) {
        e.preventDefault();
        teiEdit.insertLineAtEnd(e);
    }
*/  
    if (e.which === 79 && (e.ctrlKey === true || e.metaKey === true) && e.shiftKey === true) { // ctrl shift O
        e.preventDefault();
        events.openOdd();
        return;
    }
    if (e.which === 79 && (e.ctrlKey === true || e.metaKey === true)) { // ctrl O
        e.preventDefault();
        events.openXml();
    }
    if (e.which === 83 && (e.ctrlKey === true || e.metaKey === true) && (e.altKey === true)) { // ctrl alt S
        e.preventDefault();
        events.dumpHtml();
        return;
    }
    if (e.which === 83 && (e.ctrlKey === true || e.metaKey === true)) { // ctrl S
        e.preventDefault();
        events.saveAsLocal(null);
    }
    if (e.which === 78 && (e.ctrlKey === true || e.metaKey === true)) { // ctrl N
        e.preventDefault();
        events.newFile(null); // checked changes
    }
}

export function init() {
    events.teiData.system = 'html';
    // load params
    common.loadParams();
    // load previous data
    events.newFile(null);

    common.init(bodyKeys);
    window.addEventListener("beforeunload", function (e) {
        if (edit.change() === false) {
            return undefined;
        }

        var confirmationMessage = msg.msg('leavinghtml');

        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    });

    common.setLanguage(odd.odd.params.language, false);
}

// in case the document is already rendered
if (document.readyState!='loading')
    init();
else if (document.addEventListener)
    document.addEventListener('DOMContentLoaded', init);
