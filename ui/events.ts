/**
 * 
 */

import * as edit from '../teiedit/edit';
import * as odd from '../teiedit/odd';
import * as schema from '../teiedit/schema';
import * as tei from '../teiedit/tei';
import * as load from '../teiedit/load';
import * as system from './opensave';

const NEWFILENAME = 'nouveau-fichier.xml';

export let teiData = {
    oddName: '',
    fileName: '',
    dataOdd: null,
    dataTei: null,
    html: null,
    new: true,
    parser: null,
    doc: null,
    system: ''
};

function finishLoad(err, name, data) {
    teiData.fileName = name;
    let el = document.getElementById('filename');
    el.innerHTML = "Fichier: " + name;
    load.loadTei(data, teiData);
    teiData.html = edit.generateHTML(teiData);
    el = document.getElementById('teidata');
    el.innerHTML = teiData.html;
    teiData.new = false;
    //console.log("openfile TEI", teiData.dataTei);
    //console.log(edit.values);
}

export function dumpHtml() {
    system.saveFileLocal("html", "page.html", teiData.html);
}

export function checkChange(fun) {
    if (edit.change() === false) {
        fun();
        return;
    }
    system.askUserModalYesNoCancel(
        "Le fichier n'est pas sauvegardé. Voulez vous le sauver, quitter sans sauver ou annuler ?",
        (ret) => {
            if (ret === 'yes') { //save
                if (teiData.system === 'electron') {
                    save(fun);
                } else {
                    saveAsLocal(fun);
                }
            } else if (ret === 'no') {
                fun(); // do not save
            } else {
                return; // cancel
            }
        }
    );
}

export function open() {
    // checked changes
    checkChange(() => {
        system.chooseOpenFile(function(err, name, data) {
            if (!err) {
                if (!teiData.dataOdd) {
                    newFile(function() { finishLoad(1, null, null); } );
                } else {
                    finishLoad(0, name, data);
                }
            } else
                console.log(name, err);
        });
    });
};

export function newFile(callback) {
    // checked changes
    checkChange(() => {
        try {
            let ls = localStorage.getItem("previousODD");
            if (ls) {
                var js = JSON.parse(ls);
                if (!js.version || js.version !== schema.version) {
                    console.log('ancienne version de localstorage');
                    emptyFile();
                    if (callback) callback(0);
                    return;
                }
                openOddLoad(js.oddName, js.data);
                if (callback) callback(0);
            } else {
                emptyFile();
            }
        } catch (error) {
            console.log(error);
            emptyFile();
            if (callback) callback(0);
        }
    });
}

export function reLoad(callback) {
    try {
        let ls = localStorage.getItem("previousODD");
        let lx = localStorage.getItem("previousXML");
        let lxname = localStorage.getItem("previousXMLName");
        if (ls && lx) {
            var js = JSON.parse(ls);
            if (!js.version || js.version !== schema.version) {
                console.log('ancienne version de localstorage');
                emptyFile();
                if (callback) callback(0);
                return;
            }
            openOddLoad(js.oddName, js.data);
            finishLoad(0, lxname, lx);
            if (callback) callback(0);
        } else {
            emptyFile();
        }
    } catch (error) {
        console.log(error);
        emptyFile();
    }
}

export function openOddLoad(name, data) {
    teiData.oddName = name;
    let el = document.getElementById('oddname');
    el.innerHTML = "ODD: " + name;
    teiData.dataOdd = odd.loadOdd(data);
    load.loadTei(null, teiData);
    teiData.html = edit.generateHTML(teiData);
    teiData.fileName = NEWFILENAME;
    teiData.new = true;

    el = document.getElementById('filename');
    el.innerHTML = "Fichier: " + teiData.fileName;
    el = document.getElementById('teidata');
    el.innerHTML = teiData.html;
    let js = JSON.stringify({data: data, oddName: name, version: schema.version});
    localStorage.setItem("previousODD", js);
}

export function openOdd() {
    // checked changes
    checkChange(() => {
        system.chooseOpenFile(function(err, name, data) {
            if (!err) {
                openOddLoad(name, data);
            } else
                console.log(name, err);
        });
    });
};

export function emptyFile() {
    let dt = document.getElementById('teidata');
    dt.innerHTML = '';
    teiData.oddName = "Pas de nom de fichier";
    teiData.fileName = 'Pas de nom de fichier';
    teiData.new = true;
    let el = document.getElementById('oddname');
    el.innerHTML = "ODD: " + teiData.oddName;
    el = document.getElementById('filename');
    el.innerHTML = "Fichier: " + teiData.fileName;
}

export function saveAs(fun) {    
    system.chooseSaveFile('xml', function(err, name) {
        if (!err) {
            teiData.fileName = name;
            let el = document.getElementById('filename');
            el.innerHTML = "Fichier: " + teiData.fileName;
            var ed = tei.generateTEI(teiData);
            system.saveFile(teiData.fileName, ed, null);
            edit.change(false);
            if (fun && typeof fun === "function") fun();
        } else
            console.log('saveas cancelled', name, err);
    });
};

export function saveStorage() {
    var ed = tei.generateTEI(teiData);
    localStorage.setItem("previousXML", ed);
    localStorage.setItem("previousXMLName", teiData.fileName);
};

export function save(fun) {
    if (teiData.fileName !== NEWFILENAME) {
            var ed = tei.generateTEI(teiData);
            edit.change(false);
            system.saveFile(teiData.fileName, ed, null);
            if (fun && typeof fun === 'function') fun();
    } else {
        return saveAs(fun);
    }
};

export function saveAsLocal(fun) {
    var ed = tei.generateTEI(teiData);
    // console.log(ed);
    edit.change(false);
    system.saveFileLocal('xml', teiData.fileName, ed);
    if (fun && typeof fun === 'function') fun();
};
