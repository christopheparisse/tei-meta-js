"use strict";
/**
 * @module edit.js
 * @author Christophe Parisse
 * création des structures HTML permettant l'édiion d'un ODD et d'un TEI
 * toutes les structures sous-jacentes (contenus à éditer)
 * ont été générés précédemment dans les fonctions odd.loadOdd et tei.load
 * les champs xxID qui permettent de récupérer les valeurs sont créés ici
 */
Object.defineProperty(exports, "__esModule", { value: true });
var odd = require("./odd");
var schema = require("./schema");
var load = require("./load");
var system = require("../ui/opensave");
exports.values = {};
/**
 * format an integer into 2-digit values
 * @method intFormat2
 * @param {integer} value
 * @return {string} formatted value
 */
function intFormat2(v) {
    return (v < 10) ? "0" + v : v;
}
/**
 * format the presentation of time in the transcript
 * @method formatTime
 * @param {float} time in seconds
 * @param {string} time format : hms 00:00 ?:00:00 and raw
 * @param {number} nb of digit to the right of the point
 * @return {string} time as string
 */
function formatTime(t) {
    if (t === undefined || t === null || t === '')
        t = 0; // no time
    var d = new Date(t * 1000);
    var h = d.getUTCHours();
    var r;
    if (odd.odd.params.fmt === 'hms') {
        if (h > 0)
            r = h + 'h' + d.getUTCMinutes() + "m" + d.getSeconds() + "s";
        else
            r = d.getUTCMinutes() + "m" + d.getSeconds() + "s";
    }
    else if (odd.odd.params.fmt === '00:00') {
        r = intFormat2(h * 60 + d.getUTCMinutes()) + ':' + intFormat2(d.getSeconds());
    }
    else if (odd.odd.params.fmt === '?:00:00') {
        if (h > 0)
            r = h + ':' + intFormat2(d.getUTCMinutes()) + ':' + intFormat2(d.getSeconds());
        else
            r = intFormat2(d.getUTCMinutes()) + ':' + intFormat2(d.getSeconds());
    }
    else if (odd.odd.params.fmt === '0:00:00') {
        if (h > 0)
            r = h + ':' + intFormat2(d.getUTCMinutes()) + ':' + intFormat2(d.getSeconds());
        else
            r = h + ':' + intFormat2(d.getUTCMinutes()) + ':' + intFormat2(d.getSeconds());
    }
    else {
        r = h;
    }
    if (!odd.odd.params.nbdigits)
        return r;
    var ms = '0.0';
    if (odd.odd.params.nbdigits === 3)
        ms = ms.substring(2, 5);
    else if (odd.odd.params.nbdigits === 2)
        ms = ms.substring(2, 4);
    else if (odd.odd.params.nbdigits === 1)
        ms = ms.substring(2, 3);
    if (odd.odd.params.fmt === 'hms')
        return r + ms;
    else
        return r + '.' + ms;
}
/**
 * check and modify the value of the time edited directly by the user
 * @method checkTime
 * @param event
 */
function checkTime(event, id) {
    //console.log(event);
    //console.log(event.target);
    event.preventDefault();
    // découper en parties
    var tx = event.target.value;
    if (tx === '' || tx === 0 || tx === null) {
        // sets the time
        exports.values[id].value = '';
        return;
    }
    var newt = 0;
    if (odd.odd.params.fmt === 'hms') {
        var m = tx.split(/[hmsHMS]/);
        if (m.length !== 3) {
            system.alertUser('Mauvais format de temps. Format correct: HhMmSs.ms');
            return;
        }
        var h = parseInt(m[0]);
        var mn = parseInt(m[1]);
        var s = parseFloat(m[2]);
        if (mn > 59 || mn < 0) {
            system.alertUser('Mauvais format des minutes: entre 0 et 59');
            return;
        }
        if (s > 59 || s < 0) {
            system.alertUser('Mauvais format des secondes: entre 0 et 59');
            return;
        }
        newt = h * 3600 + mn * 60 + s;
    }
    else {
        var m = tx.split(':');
        if (m.length === 1) {
            newt = parseFloat(m[0]);
        }
        else if (m.length === 2) {
            var mn_1 = parseInt(m[0]);
            var s_1 = parseFloat(m[1]);
            newt = mn_1 * 60 + s_1;
        }
        else if (m.length !== 3) {
            system.alertUser('Mauvais format de temps. Format correct: H:M:S.ms');
            return;
        }
        else {
            var h_1 = parseInt(m[0]);
            var mn_2 = parseInt(m[1]);
            var s_2 = parseFloat(m[2]);
            if (mn_2 > 59 || mn_2 < 0) {
                system.alertUser('Mauvais format des minutes: entre 0 et 59');
                return;
            }
            if (s_2 > 59 || s_2 < 0) {
                system.alertUser('Mauvais format des secondes: entre 0 et 59');
                return;
            }
            newt = h_1 * 3600 + mn_2 * 60 + s_2;
        }
    }
    // sets the time to newt
    exports.values[id].value = newt;
}
exports.checkTime = checkTime;
function styleTime() {
    var s;
    switch (odd.odd.params.fmt) {
        case 'hms':
        case 'HMS':
            s = "Format: 0h0m0s";
            break;
        case '00:00':
            s = "Format: 00:00";
            break;
        case '00:00:00':
            s = "Format: 00:00:00";
            break;
        case '?:00:00':
            s = "Format: 00:00 ou 00:00:00";
            break;
        default:
            s = "Format en secondes";
            break;
    }
    return s;
}
var lastId = 0;
function createID() {
    var id = 'id' + lastId;
    lastId++;
    return id;
}
exports.createID = createID;
// variantes de forme des icones
// fa-circle-o fa-minus-circle fa-minus-square-o
// fa-circle fa-thumbs-o-up fa-check-square
// affichage de la validation ou non des elementSpec
// la validation ou non passe par un changement de forme
// la couleur dépend seulement du fait que c'est obligatoire ou optionnel 
// elle n'est pas modifiée dans cette fonction mais dans l'affichage initial
// les classes fa-choice-validated et fa-choice-not-validated sont des pseudo-classes pour connaitre l'état de l'élément
function setOnOff(event, id, styleOn, styleOff) {
    if (event.target.className.indexOf('fa-choice-not-validated') >= 0) {
        event.target.className = 'validate fa fa-size2 fa-choice-validated ' + styleOn;
        exports.values[id].select = true;
        // ici il faut mettre à 'ok' les parentElementSpec.
        setOnParents(exports.values[id].eltSpec);
    }
    else {
        system.askUserModal('Voulez vous supprimer cet élément et tous ses descendants de votre document ?', function (ret) {
            if (ret) {
                event.target.className = 'validate fa fa-size2 fa-choice-not-validated ' + styleOff;
                exports.values[id].select = false;
                setOffChildren(exports.values[id].eltSpec);
            }
        });
        /*
        if (system.askUser('Voulez vous supprimer cet élément et tous ses descendants de votre document ?')) {
            console.log("mettre les enfants à ---", eltSpec);
            event.target.className = 'validate fa fa-size2 fa-choice-not-validated ' + styleOff;
            values[id].select = false;
            setOffChildren(values[id].eltSpec);
        }
        */
    }
}
exports.setOnOff = setOnOff;
function setStyleOnOff(id, val, styleOn, styleOff) {
    var node = document.getElementById(id);
    if (!node) {
        console.log("pas d'id trouvé pour", id);
        return;
    }
    if (val) {
        node.className = 'validate fa fa-size2 fa-choice-validated ' + styleOn;
    }
    else {
        node.className = 'validate fa fa-size2 fa-choice-not-validated ' + styleOff;
    }
    //console.log(event);
}
function setOnParents(eltSpec) {
    console.log("mettre les parents à +++", eltSpec);
    eltSpec.validatedES = 'ok';
    if (eltSpec.usage === 'req')
        setStyleOnOff(eltSpec.validatedESID, true, 'fa-bookmark fa-color-required', 'fa-bookmark-o fa-color-required');
    else
        setStyleOnOff(eltSpec.validatedESID, true, 'fa-bookmark fa-color-optional', 'fa-bookmark-o fa-color-optional');
    if (eltSpec.parentElementSpec)
        setOnParents(eltSpec.parentElementSpec);
}
function setOffChildren(eltSpec) {
    console.log("mettre les enfants à ---", eltSpec);
}
function setOnOffES(event, id, usage) {
    if (usage === 'req')
        setOnOff(event, id, 'fa-bookmark fa-color-required', 'fa-bookmark-o fa-color-required');
    else
        setOnOff(event, id, 'fa-bookmark fa-color-optional', 'fa-bookmark-o fa-color-optional');
}
exports.setOnOffES = setOnOffES;
/*
export function setOnOffEC(event, id) {
    setOnOff(event, id, 'fa-check-square fa-color-expand', 'fa-minus-square-o fa-color-expand');
}
*/
function createEC(event, id) {
    var c = exports.values[id];
    // values[uniqCreate] = {elt: ec.model, tab: ec.eCI, id: uniqCreate, path: ec.absolutepath};
    var eci = new schema.ElementCountItem();
    eci.parentElementSpec = c.eltSpec;
    eci.type = c.elt.type;
    if (c.elt.type === 'elementRef') {
        eci.model = c.elt.model;
        var h = load.ptrListElementSpec[eci.model];
        eci.element = load.loadElementSpec(h, null, c.path + '/' + eci.model, "0", "unbounded", c.eltSpec);
    }
    else {
        eci.model = [];
        eci.element = [];
        for (var _i = 0, _a = c.elt.model; _i < _a.length; _i++) {
            var ece = _a[_i];
            eci.model.push(ece);
            var h = load.ptrListElementSpec[ece];
            eci.element.push(load.loadElementSpec(h, null, c.path + '/' + ece, "0", "unbounded", c.eltSpec));
        }
    }
    // la duplication ne concerne que le premier niveau ?
    // propager à tous les enfants la mise à zéro des champs node
    // normalement pas copié à vérifier
    // odd.setNodesToNull(eci.element);
    eci.validatedEC = false;
    eci.validatedECID = createID();
    exports.values[eci.validatedECID] = { select: false, eltSpec: c.eltSpec };
    c.tab.push(eci);
    var s = '<div class="headSequence">\n';
    /*
    s += '<i class="validate fa fa-minus-square-o fa-choice-not-validated fa-color-expand " '
        + 'onclick="window.ui.setOnOffEC(event, \'' + eci.validatedECID + '\')"></i>\n';
    */
    s += '<div class="content">\n';
    if (eci.type === 'elementRef') {
        s += generateElement(eci.element, 'single');
    }
    else {
        for (var _b = 0, _c = eci.element; _b < _c.length; _b++) {
            var ece = _c[_b];
            s += generateElement(ece, 'single');
        }
    }
    s += '</div>';
    s += '</div>';
    //console.log(event, id);
    var referenceNode = document.getElementById(id);
    /*
    var newEl = document.createElement('div');
    newEl.innerHTML = s;
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
    */
    referenceNode.insertAdjacentHTML('beforeend', s);
}
exports.createEC = createEC;
function setText(event, id) {
    exports.values[id].value = event.target.value;
    setOnParents(exports.values[id].eltSpec);
    //console.log(event);
}
exports.setText = setText;
function setAttr(event, id) {
    exports.values[id].value = event.target.value;
    setOnParents(exports.values[id].eltSpec);
    //console.log(event);
}
exports.setAttr = setAttr;
function toggle(el, value) {
    var display = (window.getComputedStyle ? getComputedStyle(el, null) : el.currentStyle).display;
    if (display == 'none')
        el.style.display = value;
    else
        el.style.display = 'none';
}
function toggleES(event, id) {
    //console.log(event, id);
    // toggle
    var node = document.getElementById('show' + id);
    // if (el.classList) el.classList.contains(className);
    // if (el.classList) el.classList.add(className);
    // if (el.classList) el.classList.remove(className);
    toggle(node, "block");
}
exports.toggleES = toggleES;
function showAll() {
    var nodes = document.getElementsByClassName('toggle');
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].style.display = "block";
    }
}
exports.showAll = showAll;
function hideAll() {
    var nodes = document.getElementsByClassName('toggle');
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].style.display = "none";
    }
}
exports.hideAll = hideAll;
/**
 * @function generateHtml
 * @param elist
 */
function generateHTML(teiData) {
    return generateElement(teiData.dataTei, 'root');
}
exports.generateHTML = generateHTML;
function generateContent(ct, abspath) {
    var s = '';
    for (var _i = 0, _a = ct.sequencesRefs; _i < _a.length; _i++) {
        var ec = _a[_i];
        //console.log(">>>",ec.model);
        if (ec.minOccurs === '1' && ec.maxOccurs === '1') {
            //console.log("1-1",ec.model);
            s += '<div class="headHRef">';
            if (ec.type === 'elementRef') {
                s += generateElement(ec.eCI[0].element, 'single');
            }
            else {
                for (var _b = 0, _c = ec.eCI[0].element; _b < _c.length; _b++) {
                    var ece = _c[_b];
                    s += generateElement(ece, 'single');
                }
            }
            s += '</div>';
        }
        else {
            // console.log("multiple",ec.eCI[0].model);
            s += generateMultiple(ec, abspath);
        }
    }
    return s;
}
function generateMultiple(ec, abspath) {
    // ec est un ElementCount
    var s = '';
    var uniqCreate = createID();
    s += '<div class="contentCountMany" id="' + uniqCreate + '" >\n';
    // on peut en rajouter ... ou supprimer
    s += '<div class="plusCM"><i class="create fa fa-plus-square fa-color-expand" '
        + 'onclick="window.ui.createEC(event, \'' + uniqCreate + '\')"></i></div>\n';
    exports.values[uniqCreate] = { elt: ec.eCI[0], tab: ec.eCI, id: uniqCreate, path: abspath, eltSpec: ec.parentElementSpec };
    for (var i in ec.eCI) {
        var uniq = createID();
        ec.eCI[i].validatedECID = uniq;
        s += '<div class="headSequence">\n';
        exports.values[uniq] = { select: ec.eCI[i].validatedEC, eltSpec: ec.parentElementSpec };
        // HERE can put info about expansions
        s += '<div class="content">\n';
        if (ec.eCI[i].type === 'elementRef') {
            s += generateElement(ec.eCI[i].element, 'multiple');
        }
        else {
            for (var _i = 0, _a = ec.eCI[i].element; _i < _a.length; _i++) {
                var ece = _a[_i];
                s += generateElement(ece, 'multiple');
            }
        }
        s += '</div>\n';
        s += '</div>\n';
    }
    s += '</div>\n';
    return s;
}
function editDataType(datatype) {
    var s = '<div class="nodeEdit">\n';
    // il faut editer l'élément texte du noeud
    var uniq = createID();
    // gérer le type d'édition du champ
    switch (datatype.type) {
        case 'list':
            if (!datatype.vallist || datatype.vallist.length <= 0) {
                // grosse erreur ou manque liste vide
                system.alertUser("pas de liste de valeurs pour le datatype: " + datatype.type);
                return '';
            }
            if (datatype.vallist.length <= 1) {
                // liste avec un seul element
                if (!datatype.valueContent)
                    datatype.valueContent = datatype.vallist[0].ident;
                exports.values[uniq] = { value: datatype.valueContent, eltSpec: datatype.parentElementSpec };
                datatype.valueContentID = uniq;
                return '';
            }
            datatype.valueContentID = uniq;
            exports.values[uniq] = { value: datatype.valueContent, eltSpec: datatype.parentElementSpec };
            // edition de la valeur
            /*
            if (usage === 'req') {
                s += '<label for="' + uniq + '">';
                s += '<em>obligatoire</em>';
                s += '</label>\n';
            }
            */
            // choix dans une liste
            s += '<select class="listattr" id="' + uniq + '" ';
            s += 'onchange="window.ui.setAttr(event, \'' + uniq + '\');" >\n';
            for (var k = 0; k < datatype.vallist.length; k++) {
                s += '<option value="' +
                    datatype.vallist[k].ident + '" ';
                if (datatype.valueContent === datatype.vallist[k].ident)
                    s += 'selected="selected" ';
                s += '>' + datatype.vallist[k].desc + '</option>\n';
            }
            s += '</select>\n';
            break;
        case 'openlist':
            // attributs avec liste
            datatype.valueContentID = uniq;
            exports.values[uniq] = { value: datatype.valueContent, eltSpec: datatype.parentElementSpec };
            s += '<input type=text class="awesomplete listattr" data-minchars="0" list="' + uniq + '" value="' + datatype.valueContent + '" ';
            s += 'onchange="window.ui.setAttr(event, \'' + uniq + '\');"/>\n';
            s += '<datalist id="' + uniq + '">';
            for (var k in datatype.vallist) {
                s += '<option value="' +
                    datatype.vallist[k].ident + '" ';
                s += '>' + datatype.vallist[k].desc;
                s += '</option>\n';
            }
            s += '</datalist>\n';
            break;
        case 'duration':
            datatype.valueContentID = uniq;
            exports.values[uniq] = { value: datatype.valueContent, eltSpec: datatype.parentElementSpec };
            // edition de la valeur
            s += '<label for="' + uniq + '">';
            /*
            if (usage === 'req') {
                s += '<em>obligatoire</em>';
            }
            */
            s += ' ' + styleTime();
            s += '</label>\n';
            s += '<input name="' + uniq + '" id="' + uniq + '" ';
            s += 'onchange="window.ui.checkTime(event, \'' + uniq + '\');"';
            s += ' value="' + formatTime(datatype.valueContent) + '"';
            s += ' />\n';
            break;
        case 'date':
        case 'month':
            datatype.valueContentID = uniq;
            exports.values[uniq] = { value: datatype.valueContent, eltSpec: datatype.parentElementSpec };
            // edition de la valeur
            /*
            if (usage === 'req') {
                s += '<label for="' + uniq + '">';
                s += '<em>obligatoire</em>';
                s += '</label>\n';
            }
            */
            s += '<input type="date" name="' + uniq + '" id="' + uniq + '" ';
            s += 'onchange="window.ui.setText(event, \'' + uniq + '\');"';
            if (datatype.valueContent)
                s += ' value="' + formatTime(datatype.valueContent) + '"';
            s += ' />\n';
            break;
        case 'anyURI':
        case 'uri':
        case 'url':
        case 'string':
        default:
            datatype.valueContentID = uniq;
            exports.values[uniq] = { value: datatype.valueContent, eltSpec: datatype.parentElementSpec };
            // edition de la valeur
            /*
            if (usage === 'req') {
                s += '<label for="' + uniq + '">';
                s += '<em>obligatoire</em>';
                s += '</label>\n';
            }
            */
            s += '<input name="' + uniq + '" id="' + uniq + '" ';
            s += 'onchange="window.ui.setText(event, \'' + uniq + '\');"';
            if (datatype.valueContent)
                s += ' value="' + datatype.valueContent + '"';
            s += ' />\n';
            break;
    }
    s += '</div>\n';
    return s;
}
function classOf(usage) {
    switch (usage) {
        case 'req':
            return 'color-required';
        case 'rec':
            return 'color-recommended';
        default:
            return 'color-optional';
    }
}
function editAttr(elt) {
    if (elt.attr.length < 1)
        return;
    var s = '<div class="nodeAttr">\n';
    for (var i in elt.attr) {
        if (!elt.attr[i].datatype)
            continue; // pas d'édition de la valeur
        if (elt.attr[i].rend)
            elt.attr[i].valueContent = elt.attr[i].rend;
        s += '<span class="eltNodeAttr-' + classOf(elt.attr[i].usage) + '">\n';
        if (elt.attr[i].desc) {
            s += '<span class="descAttr">';
            s += odd.textDesc(elt.attr[i].desc, odd.odd.params.language);
            s += '</span>\n';
        }
        s += editDataType(elt.attr[i].datatype);
        s += '</span>\n';
        /*
        if (elt.attr[i].datatype === 'list') {
            if (!elt.attr[i].items || elt.attr[i].items.length <= 0) {
                // grosse erreur ou manque liste vide
                system.alertUser("pas de liste de valeurs pour l'attribut: " + elt.attr.ident);
                continue;
            }
            if (elt.attr[i].items.length <= 1) {
                // liste avec un seul element
                let uniq = createID();
                if (!elt.attr[i].value) // si vide mettre le premier de la liste
                    elt.attr[i].value =  elt.attr[i].items[0].ident;
                values[uniq] = { value: elt.attr[i].value, eltSpec: elt.parentElementSpec };
                elt.attr[i].valueID = uniq;
                continue;
            }
            // attributs avec liste
            let uniq = createID();
            if (!elt.attr[i].value) // si vide mettre le premier de la liste
                elt.attr[i].value =  elt.attr[i].items[0].ident;
            values[uniq] = { value: elt.attr[i].value, eltSpec: elt.parentElementSpec };
            elt.attr[i].valueID = uniq;
            if (elt.attr[i].desc) {
                s += '<label for="' + uniq + '">';
                s += '<b>' + odd.textDesc(elt.attr[i].desc, odd.odd.params.language) + '</b>';
                s +='</label>\n';
            }
            s +='<select class="listattr" id="' + uniq + '" ';
            s +='onchange="window.ui.setAttr(event, \'' + uniq + '\');">\n';
            for (let k in elt.attr[i].items) {
                s += '<option value="' +
                    elt.attr[i].items[k].ident + '" ';
                    if (elt.attr[i].value === elt.attr[i].items[k].ident)
                        s  += 'selected="selected" ';
                    s += '>' + elt.attr[i].items[k].desc;
                    s += '</option>\n';
            }
            s += '</select>\n';
        } else if (elt.attr[i].datatype === 'openlist') {
            if (!elt.attr[i].items || elt.attr[i].items.length <= 0) {
                // grosse erreur ou manque liste vide
                system.alertUser("pas de liste de valeurs pour l'attribut: " + elt.attr.ident);
                continue;
            }
            if (elt.attr[i].items.length <= 1) {
                // liste avec un seul element
                continue;
            }
            // attributs avec liste
            let uniq = createID();
            if (!elt.attr[i].value) // si vide mettre le premier de la liste
                elt.attr[i].value =  elt.attr[i].rend;
            values[uniq] = { value: elt.attr[i].value, eltSpec: elt.parentElementSpec };
            elt.attr[i].valueID = uniq;
            if (elt.attr[i].desc) {
                s += '<label for="' + uniq + '">';
                s += '<b>' + odd.textDesc(elt.attr[i].desc, odd.odd.params.language) + '</b>';
                s +='</label>\n';
            }
            s +='<input type=text class="awesomplete listattr" data-minchars="0" list="' + uniq + '" value="' + elt.attr[i].value + '" ';
            s +='onchange="window.ui.setAttr(event, \'' + uniq + '\');"/>\n';
            s +='<datalist id="' + uniq + '">';
            for (let k in elt.attr[i].items) {
                s += '<option value="' +
                    elt.attr[i].items[k].ident + '" ';
                    s += '>' + elt.attr[i].items[k].desc;
                    s += '</option>\n';
            }
            s += '</datalist>\n';
        } else {
            // attribut sans liste: edition de la valeur
            let uniq = createID();
            values[uniq] = { value: elt.attr[i].value, eltSpec: elt.parentElementSpec };
            elt.attr[i].valueID = uniq;
            let type = 'text';
            switch (elt.attr[i].datatype) {
                case 'month':
                    type = 'month';
                    break;
                case 'duration':
                    type = 'duration';
                    break;
                case 'date':
                    type = 'date';
                    break;
                case 'number':
                    type = 'number';
                    break;
                case 'anyURI':
                case 'uri':
                case 'url':
                    type = 'url';
                    break;
            }
            if (elt.attr[i].desc) {
                s += '<label for="' + uniq + '">';
                s += '<b>' + odd.textDesc(elt.attr[i].desc, odd.odd.params.language) + '</b>';
                if (type === "duration")
                    s += ' ' + styleTime();
                s += '</label>\n';
            } else if (type === "duration") {
                s += '<label for="' + uniq + '">';
                s += ' ' + styleTime();
                s += '</label>\n';
            }
            if (type === "duration") {
                s += '<input name="' + uniq + '" id="' + uniq + '" ';
                s += 'onchange="window.ui.checkTime(event, \'' + uniq + '\');" ';
                s += ' value="' + formatTime(elt.attr[i].value) + '"';
                s += ' />\n';
            } else {
                s += '<input type = "' + type + '" name="' + uniq + '" id="' + uniq + '"';
                s += 'onchange="window.ui.setText(event, \'' + uniq + '\');"';
                if (elt.attr[i].value) s += ' value="' + elt.attr[i].value + '"';
                values[uniq] = { value: (elt.attr[i].value) ? elt.attr[i].value : '', eltSpec: elt.parentElementSpec };
                s += ' />\n';
            }
        }
        */
    }
    s += '</div>\n';
    return s;
}
function generateElement(elt, validatedStyle) {
    // let s = '<div class="element">';
    var s = '';
    var uniq = createID();
    var prof = (elt.absolutepath.match(/\//g) || []).length - 1;
    if (odd.odd.params.displayFullpath || elt.attr.length > 0 || (elt.content && elt.content.datatype)) {
        var lprof = (odd.odd.params.displayFullpath) ? prof * odd.odd.params.leftShift : 0;
        s += '<div class="nodeField node-' + classOf(elt.usage) + '" title="' + elt.absolutepath + '" style="margin-left: ' + lprof + 'px;">\n';
        if (odd.odd.params.validateRequired && validatedStyle !== 'root') {
            // on peut tout valider donc on ne se pose pas de question
            exports.values[uniq] = { select: elt.validatedES, eltSpec: elt.parentElementSpec };
            elt.validatedESID = uniq;
            if (elt.validatedES) {
                s += '<i id="' + elt.validatedESID + '" class="validate fa fa-size2 fa-bookmark fa-choice-validated fa-'
                    + classOf(elt.usage)
                    + '" onclick="window.ui.setOnOffES(event, \'' + uniq + '\', \'' + elt.usage + '\')"></i>';
            }
            else {
                s += '<i id="' + elt.validatedESID + '" class="validate fa fa-size2 fa-bookmark-o fa-choice-not-validated fa-'
                    + classOf(elt.usage)
                    + '" onclick="window.ui.setOnOffES(event, \'' + uniq + '\', \'' + elt.usage + '\')"></i>';
            }
        }
        else {
            // on ne peut pas valider les req - ils sont toujours à validatedES === true
            if ((elt.usage === 'req' && validatedStyle !== 'multiple') || validatedStyle === 'root')
                elt.validatedES = true;
            exports.values[uniq] = { select: elt.validatedES, eltSpec: elt.parentElementSpec };
            elt.validatedESID = uniq;
            if (validatedStyle !== 'root' && (elt.usage !== 'req' || validatedStyle === 'multiple')) {
                if (elt.validatedES) {
                    s += '<i id="' + elt.validatedESID + '" class="validate fa fa-size2 fa-bookmark fa-choice-validated fa-'
                        + classOf(elt.usage)
                        + '" onclick="window.ui.setOnOffES(event, \'' + uniq + '\', \'' + elt.usage + '\')"></i>';
                }
                else {
                    s += '<i id="' + elt.validatedESID + '" class="validate fa fa-size2 fa-bookmark-o fa-choice-not-validated fa-'
                        + classOf(elt.usage)
                        + '" onclick="window.ui.setOnOffES(event, \'' + uniq + '\', \'' + elt.usage + '\')"></i>';
                }
            }
        }
        // contenu (node principal)
        s += '<i class="hidebutton fa fa-size2 fa-star-half-o fa-color-toggle" '
            + 'onclick="window.ui.toggleES(event, \'' + uniq + '\')"></i>';
        if (odd.odd.params.displayFullpath) {
            s += '<span class="nodeIdent">' + elt.ident + '</span>\n';
            s += '<span class="nodeAbspath">' + elt.absolutepath + '</span>\n';
            s += '<div class="toggle" id="show' + uniq + '">';
            // description
            if (elt.desc)
                s += '<div class="eltDescBlock">' + odd.textDesc(elt.desc, odd.odd.params.language) + '</div>\n';
        }
        else {
            s += '<div class="toggle" id="show' + uniq + '">';
            // description
            if (elt.desc)
                s += '<div class="eltDesc">' + odd.textDesc(elt.desc, odd.odd.params.language) + '</div>\n';
            else
                s += '<div class="eltDesc">' + elt.ident + '</div>\n';
        }
        // champ texte du noeud
        if (elt.content && elt.content.datatype)
            s += editDataType(elt.content.datatype);
        // Attributes
        if (elt.attr.length > 0)
            s += editAttr(elt);
        // enfants
        if (elt.content && elt.content.sequencesRefs.length > 0) {
            s += '<div class="nodeContent">';
            s += generateContent(elt.content, elt.absolutepath);
            s += '</div>\n';
        }
        s += '</div>\n';
        s += '</div>\n';
    }
    else {
        s += '<div class="nodeField node-' + classOf(elt.usage) + ' " style="margin-left: '
            + 'px;">\n';
        exports.values[uniq] = { select: true, eltSpec: elt.parentElementSpec }; // elt.validatedES // on ne peut pas accepter les éléments non validés car ils sont cachés
        elt.validatedESID = uniq;
        if (elt.content && elt.content.sequencesRefs.length > 0) {
            s += '<div class="nodeContent">';
            s += generateContent(elt.content, elt.absolutepath);
            s += '</div>\n';
        }
        s += '</div>\n';
    }
    return s;
}