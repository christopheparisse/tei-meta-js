/*
 * SAUVEGARDE DU FICHIER TEI
 */

import * as system from '../ui/opensave';
import * as odd from './odd';
import * as edit from './edit';

let entities = require("entities");
let dom = require('xmldom').DOMParser;

let basicTEI = '<?xml version="1.0" encoding="UTF-8"?>\
<TEI xmlns:xi="http://www.w3.org/2001/XInclude" xmlns:svg="http://www.w3.org/2000/svg"\
     xmlns:math="http://www.w3.org/1998/Math/MathML" xmlns="http://www.tei-c.org/ns/1.0">\
</TEI>';

function encodeXML(s) {
    if (odd.odd.params.encodeXMLFull)
        return entities.encodeXML(s);
    s = s.replace(/\</,'&lt;');
    s = s.replace(/\>/,'&gt;');
    return s;
}

function clean(node) {
    var nodes=[], values=[];
    for (let att, i = 0, atts = node.attributes, n = atts.length; i < n; i++) {
            att = atts[i];
//            nodes.push(att.nodeName);
//            values.push(att.nodeValue);
            if (!/\S/.test(att.nodeValue)) {
                node.removeAttribute(att.nodeName);
                i --;
            }
    }
    for (let n = 0; n < node.childNodes.length; n ++) {
        let child = node.childNodes[n];
        if (  child.nodeType === 8 
           || (child.nodeType === 3 && !/\S/.test(child.nodeValue))
           ) {
            node.removeChild(child);
            n --;
        } else if(child.nodeType === 1) {
            clean(child);
        }
    }
}

export function generateTEI(teiData) {
    let eltspec = teiData.dataTei;
    if (!edit.values[eltspec.validatedESID].select) {
        console.log(eltspec.absolutepath, " racine imprimée bien que non validée", edit.values[eltspec.validatedESID]);
        //system.alertUser(eltspec.absolutepath + " racine non imprimé car non validée ? >" + edit.values[eltspec.validatedESID].select + "<");
        //return;
    }
    if (!teiData.doc) {
        if (teiData.dataOdd.namespace) {
            let s = '<?xml version="1.0" encoding="UTF-8"?>';
            s += '<' + teiData.dataOdd.rootTEI + ' xmlns="' + teiData.dataOdd.namespace + '"></' + teiData.dataOdd.rootTEI + '>'
            teiData.doc = new dom().parseFromString(s, 'text/xml');
        } else {
            teiData.doc = new dom().parseFromString(basicTEI, 'text/xml');
        }
        teiData.root = teiData.doc.documentElement;
        eltspec.node = teiData.root;
    }
    // first generate the root otherwise it would be duplicated
    let s = '';
    s += '<!-- ajout de ' + eltspec.absolutepath + ' -->\n';
    s += generateFilledElement(eltspec, teiData.doc, eltspec.node);
    if (eltspec.content)
        s += generateTEIContent(eltspec.content, teiData.doc, eltspec.node);
    // console.log(s);
    // transform doc to text
    console.log(teiData.doc);
    /*
    var sr = new XMLSerializer();
    var str = sr.serializeToString(teiData.doc.documentElement);
    return str;
    */
    return teiData.doc.toString();
}

function generateElement(espec, doc, node) {
    let s = '';
    // console.log("geneElemts:",eci);
    if (edit.values[espec.validatedESID].select) {
        // si node est vide en créer un en dernier fils du node d'au dessus
        let current = espec.node;
        if (!current) {
            current = doc.createElement(espec.ident);
            node.appendChild(current);
            espec.node = current;
            s += '<!-- ajout de ' + espec.absolutepath + ' -->\n';
        }
        s += generateFilledElement(espec, doc, current);
        if (espec.content) {
            s += generateTEIContent(espec.content, doc, current);
        }
    } else {
        // supprimer le noeud si c'est autorisé
        console.log(espec.absolutepath, " non imprimé car non validé: ", edit.values[espec.validatedESID]);
        if (espec.node && odd.odd.params.canRemove) {
            espec.node.parentNode.removeChild(espec.node);
            espec.node = null;
        }
    }
    return s;
}

/**
 * @method setTextNode
 * set the value of the text node only, without touching the children (unlike textContent or innerHTML)
 * @param node 
 * @param val 
 * @param doc
 */
function setTextNode(node, val, doc) {
    if (!doc) {
        node.textContent = val;
        return;
    }
    let first = false;
    for (let child in node.childNodes) {
        if (node.childNodes[child].nodeType === 3) {
            if (first === false) {
                first = true;
                node.childNodes[child].nodeValue = val;
                node.childNodes[child].data = val;
            } else {
                node.childNodes[child].nodeValue = '';
                node.childNodes[child].data = '';
            }
        }
    }
    if (first === false) {
        // pas de noeud texte rencontré
        let nn = doc.createTextNode(val);
        node.appendChild(nn);
    }
}

/**
 * @method createAbsolutePath
 * creates a path from top of xml file and returns last node created
 * @param path 
 * @param doc
 * @returns node 
 */
function createAbsolutePath(path, doc) {
    let p = path.split('/').slice(1);
    // le nom de l'élément racine est ignoré
    // on pourrait controler si le nom de l'élément correspond au nom donné dans l'ODD
    /*
    if (p[0] !== 'TEI') {
        let s = 'impossible de créer des chemins qui ne commencent pas par TEI';
        system.alertUser(s);
        return null;
    }
    */
    let node = doc.documentElement;
    for (let i = 1; i < p.length; i++) {
        let nds = odd.getChildrenByName(node, p[i]);
        if (nds.length > 1) {
            let s = p.slice(0,i).join('/');
            s = '<!-- attention element ' + s + " n'est pas unique. -->";
            console.log(s);
            // system.alertUser(s);
        }
        if (nds.length > 0) {
            node = nds[0];
        } else {
            let newnode = doc.createElement(p[i]);
            node.appendChild(newnode);
            node = newnode;
        }
    }
    return node;
}

function generateElementRef(eci, doc, current) {
    let s = '';
    // pointeur sur l'élément dans ec
    for ( let i = 0; i < eci.eCI.length ; i++) {
        if (eci.minOccurs !== '1' && eci.maxOccurs !== '1') {
            console.log('min:', eci.minOccurs);
            console.log('max:', eci.maxOccurs);
            console.log('id1:', eci.eCI[i].validatedEC);
            console.log('id2:', eci.eCI[i].validatedECID);
            console.log('id3:', edit.values[eci.eCI[i].validatedECID]);
        }
        s += generateElement(eci.eCI[i].element, doc, current);
    }
    return s;
}

function generateSequence(eci, doc, current) {
    let s = '';
    // pointeur sur l'élément dans ec
    for ( let i = 0; i < eci.eCI.length ; i++) {
        if (eci.minOccurs !== '1' && eci.maxOccurs !== '1') {
            console.log('min:', eci.minOccurs);
            console.log('max:', eci.maxOccurs);
            console.log('xd1:', eci.eCI[i].validatedEC);
            console.log('xd2:', eci.eCI[i].validatedECID);
            console.log('xd3:', edit.values[eci.eCI[i].validatedECID]);
        }
        for ( let k = 0; k < eci.eCI[i].element.length; k++) {
            s += generateElement(eci.eCI[i].element[k], doc, current);
        }
    }
    return s;
}

function generateTEIContent(ct, doc, current) {
    let s = '';
    for (let ec of ct.sequencesRefs) {
        // ec au format ElementCount
        if (ec.type === 'elementRef') {
            s += generateElementRef(ec, doc, current);
        } else {
            s += generateSequence(ec, doc, current);
        }
    }
    return s;
}

function generateFilledElement(elt, doc, node) {
    let s = '';
    s += '<' + elt.ident;
    // attributs
    for (let i = 0; i < elt.attr.length; i++) {
        if (elt.attr[i].ident) {
            if (!elt.attr[i].datatype.type) {
                elt.attr[i].datatype.valueContent = elt.attr[i].rend;
            } else {
                let v = edit.values[elt.attr[i].datatype.valueContentID].value;
                console.log(v);
                elt.attr[i].datatype.valueContent = encodeXML(String(v));
            }
            node.setAttribute(elt.attr[i].ident, elt.attr[i].datatype.valueContent);
            s += ' ' + elt.attr[i].ident + '="' + elt.attr[i].datatype.valueContent + '"';
        }
    }
    s += '>';
    if (elt.content && elt.content.datatype) {
        elt.content.datatype.valueContent = encodeXML(edit.values[elt.content.datatype.valueContentID].value);
        setTextNode(node, elt.content.datatype.valueContent, doc);
        s += '<textNode>' + elt.content.datatype.valueContent + '</textNode>\n';
    }
    s += '</' + elt.ident + '>\n';
    return s;
}