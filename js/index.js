window.onload = async () => {
    loadSaves();
}

const changePaint = () => {
    let regex = document.getElementById("regex_text").value;
    document.getElementById('error').innerText = '\n';
    try {
        parse(regex);
        document.getElementById('render').innerHTML = draw();
    } catch (err) {
        document.getElementById('error').innerText = err;
    }
}

const round = (num, i) => {
    let decimalNum = null;
    if (!isNaN(num)) {
        let arr = num.toString().split(".");
        if (arr.length > 1 && arr[1].length > i) {
            let decimal = arr[1].slice(i, i + 1);
            if (decimal == '5')
                num += Math.pow(0.1, i + 1);
            decimalNum = num.toFixed(i);
        }
        else
            decimalNum = num;
        decimalNum = Number(decimalNum);
    }
    return decimalNum;
}

let atomList = [], boneList = [];
const boneLength = 30, textOffsetX = 12.5, textOffsetY = 12.5, margin = 50;
const dirKey = '-|/\\', rotateKey = '<>', angle = { '-': 0, '\\': 45, '|': 90, '/': -45, '>': 15, '<': -15 };
const mulKey = '=#', multibone = { '=': 2, '#': 3 };
const c_atom = 'C*';

const parse = (regex) => {
    atomList = [];
    boneList = [];
    parseOne(regex, 0, 0);
}

const parseOne = (regex, centerX, centerY) => {
    let atom = regex;
    if (regex.indexOf('[') != -1) {
        if (regex.slice(-1) != ']') throw Error('Can\'t find end of array');
        let sub = regex.slice(regex.indexOf('[') + 1, regex.length - 1);
        atom = regex.slice(0, regex.indexOf('['));
        subAtom(sub, centerX, centerY, c_atom.indexOf(atom) != -1);
    }
    atomList.push({ atom: atom, x: centerX, y: centerY });
}

const subAtom = (regex, centerX, centerY, is_c) => {
    let subs = [], sub = '', stack = 0;
    for (let char of regex) {
        if (char == ',' && stack == 0) {
            subs.push(sub);
            sub = '';
        } else {
            sub += char;
            if (char == '[') stack++;
            if (char == ']') stack--;
        }
    }
    subs.push(sub);
    for (let sub of subs)
        parseSingle(sub, centerX, centerY, is_c);
}

const parseSingle = (regex, centerX, centerY, is_c) => {
    if (regex == '') throw Error('Unexpected empty atom group');
    let dir = [], mirrorFlag = 1, atom = '', count = 1, inAtom = false, stack = 0, rotate = 0;
    for (let i = 0; i < regex.length; i++) {
        if (mulKey.indexOf(regex[i]) != -1 && !inAtom) {
            if (i == 0) count = mulKey.indexOf(regex[i]) + 2;
            else throw Error('Unexpected multibone key');
        } else if (rotateKey.indexOf(regex[i]) != -1 && stack == 0) {
            if (rotate != 0) throw Error('Too many rotate key');
            rotate = angle[regex[i]];
        } else if (dirKey.indexOf(regex[i]) != -1 && stack == 0) {
            let a = angle[regex[i]] + rotate;
            if (dir.find(x => x.mirror == mirrorFlag && x.angle == a) != null)
                throw Error('Too many bones');
            dir.push(mirrorFlag == -1 ? a + 180 : a);
            rotate = 0;
        } else {
            if (mirrorFlag == -1 && stack == 0) throw Error('Too many sub atom group');
            inAtom = true;
            atom += regex[i];
            if (regex[i] == '[') stack++;
            if (regex[i] == ']') stack--;
            if ((mulKey + rotateKey + dirKey).indexOf(regex[i + 1]) != -1 && stack == 0 || i + 1 == regex.length) {
                mirrorFlag = -1;
                inAtom = false;
            }
        }
    }
    if (rotate != 0) throw Error('Too many rotate key');
    if (atom == '') throw Error('Missing atom group');
    if (dir.length == 0) throw Error('Missing bones');
    for (let angle of dir) {
        let offsetX = boneLength * round(Math.cos(angle / 180 * Math.PI), 10), offsetY = boneLength * round(Math.sin(angle / 180 * Math.PI), 10);
        boneList.push({ angle: angle, count: count, x: centerX + offsetX, y: centerY + offsetY, c: { start: is_c, end: c_atom.indexOf(atom.split('[')[0]) != -1 } });
        parseOne(atom, centerX + offsetX * 2, centerY + offsetY * 2);
    }
}

const draw = () => {
    let xMin = Math.min(atomList.reduce((p, c) => p < c.x ? p : c.x, Number.MAX_VALUE), boneList.reduce((p, c) => p < c.x ? p : c.x, Number.MAX_VALUE)) - margin;
    let xMax = Math.min(atomList.reduce((p, c) => p > c.x ? p : c.x, Number.MIN_VALUE), boneList.reduce((p, c) => p > c.x ? p : c.x, Number.MIN_VALUE)) + margin;
    let yMin = Math.min(atomList.reduce((p, c) => p < c.y ? p : c.y, Number.MAX_VALUE), boneList.reduce((p, c) => p < c.y ? p : c.y, Number.MAX_VALUE)) - margin;
    let yMax = Math.min(atomList.reduce((p, c) => p > c.y ? p : c.y, Number.MIN_VALUE), boneList.reduce((p, c) => p > c.y ? p : c.y, Number.MIN_VALUE)) + margin;
    let hide_c = document.getElementById("hide_c").checked;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${xMax - xMin}" height="${yMax - yMin}">`;
    svg += '<style>text{text-anchor:middle;dominant-baseline:middle;font-size:25px}</style>';
    if (!document.getElementById('hide_bone').checked)
        for (let { x, y, angle, count, c } of boneList)
            svg += addBone(x - xMin, y - yMin, angle, count, c.start && hide_c, c.end && hide_c);
    for (let { x, y, atom } of atomList)
        if (c_atom.indexOf(atom) == -1 || !hide_c)
            svg += addMiddleText(x - xMin, y - yMin, atom == '*' ? ' ' : atom);
    svg += '</svg>';
    return svg;
}

const addMiddleText = (x, y, text) => `<text x="${x}" y="${y + 2}">${text}</text>`;

const addBone = (x, y, angle, count, c_start, c_end) => {
    let xMul = round(Math.cos(angle / 180 * Math.PI), 10), yMul = round(Math.sin(angle / 180 * Math.PI), 10);
    let offsetX1 = (boneLength - (c_start ? 0 : textOffsetX)) * xMul, offsetY1 = (boneLength - (c_start ? 0 : textOffsetY)) * yMul;
    let offsetX2 = (boneLength - (c_end ? 0 : textOffsetX)) * xMul, offsetY2 = (boneLength - (c_end ? 0 : textOffsetY)) * yMul;
    let o_2_x = 2 * yMul, o_2_y = 2 * -xMul;
    let o_3_x = 4 * yMul, o_3_y = 4 * -xMul;
    console.log(x, y, angle, xMul, yMul);
    if (count == 1)
        return `<line x1="${x - offsetX1}" y1="${y - offsetY1}" x2="${x + offsetX2}" y2="${y + offsetY2}" stroke="black" stroke-width="2"></line>`;
    if (count == 2)
        return `<line x1="${x - offsetX1 + o_2_x}" y1="${y - offsetY1 + o_2_y}" x2="${x + offsetX2 + o_2_x}" y2="${y + offsetY2 + o_2_y}" stroke="black" stroke-width="2"></line>`
            + `<line x1="${x - offsetX1 - o_2_x}" y1="${y - offsetY1 - o_2_y}" x2="${x + offsetX2 - o_2_x}" y2="${y + offsetY2 - o_2_y}" stroke="black" stroke-width="2"></line>`;
    if (count == 3)
        return `<line x1="${x - offsetX1}" y1="${y - offsetY1}" x2="${x + offsetX2}" y2="${y + offsetY2}" stroke="black" stroke-width="2"></line>`
            + `<line x1="${x - offsetX1 + o_3_x}" y1="${y - offsetY1 + o_3_y}" x2="${x + offsetX2 + o_3_x}" y2="${y + offsetY2 + o_3_y}" stroke="black" stroke-width="2"></line>`
            + `<line x1="${x - offsetX1 - o_3_x}" y1="${y - offsetY1 - o_3_y}" x2="${x + offsetX2 - o_3_x}" y2="${y + offsetY2 - o_3_y}" stroke="black" stroke-width="2"></line>`;
}

let examples = [], saves = [];

const loadSaves = () => {
    examples.push({ "id": 0, "name": "甲烷", "regex": "C[|-H|-]" });
    examples.push({ "id": 1, "name": "乙烯", "regex": "C[=-C[/\\H],H/\\]" });
    examples.push({ "id": 2, "name": "乙炔", "regex": "C[#-C[-H],H-]" });
    examples.push({ "id": 3, "name": "苯", "regex": "C[H-,=>\\C[H</,-C[>\\H,=</C[-H]]],</C[H>\\,=-C[</H,>\\*]]]" });
    examples.push({ "id": 4, "name": "萘", "regex": "C[H-,=>\\C[C[=>\\C[-*,H</],H-]</,-C[>\\C[-H,=C[>\\H]</],=</C[-H]]],</C[H>\\,=-C[</H,>\\*]]]" })

    saves = window.localStorage.getItem('saves');
    saves = saves == null ? [] : saves.split('!').reduce((p, c) => {
        if (c != '') p.push(JSON.parse(c));
        return p;
    }, []);

    document.getElementById('examples').innerHTML = '';
    for (let { id, name, regex } of examples)
        document.getElementById('examples').innerHTML += `<div class="save_obj" onclick="load('examples',${id})">
        <b style="font-size:20px">${name}</b><br>
        <span style="font-size:10px">${regex}</span></div>`;
    loadCustom();
}

const loadCustom = () => {
    document.getElementById('local_saves').innerHTML = '';
    for (let { id, name, regex } of saves)
        document.getElementById('local_saves').innerHTML += `<div class="save_obj" onclick="load('saves',${id})">
        <b style="font-size:20px">${name}</b>
        <button class="del" onclick="deleteSave(${id})">删除</button><br>
        <span style="font-size:10px">${regex}</span></div>`;
}

const deleteSave = (id) => {
    saves.splice(id, 1);
    for (let save of saves)
        save.id = i;
    window.localStorage.setItem('saves', saves.reduce((p, c) => p + '!' + JSON.stringify(c), ''));
    loadCustom();
}

const save = () => {
    if (document.getElementById('regex_text').value == '') return;
    saves.push({ id: saves.length, name: document.getElementById('name_text').value, regex: document.getElementById("regex_text").value });
    window.localStorage.setItem('saves', saves.reduce((p, c) => p + '!' + JSON.stringify(c), ''));
    loadCustom();
}

const load = (type, id) => {
    if (type == 'examples') {
        document.getElementById('name_text').value = examples[id].name;
        document.getElementById("regex_text").value = examples[id].regex;
    }
    if (type == 'saves') {
        document.getElementById('name_text').value = saves[id].name;
        document.getElementById("regex_text").value = saves[id].regex;
    }
    parse(document.getElementById("regex_text").value);
    document.getElementById('render').innerHTML = draw();
}

const save2Svg = () => {
    if (document.getElementById('regex_text').value == '') return;
    let blob = new Blob([document.getElementById('render').innerHTML], { type: 'text/plain;charset=utf-8' });
    let save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
    let urlObject = window.URL || window.webkitURL || window;
    save_link.href = urlObject.createObjectURL(blob);
    let name = document.getElementById('name_text').value;
    save_link.download = `${name == '' ? document.getElementById('regex_text').value : name}.svg`;
    save_link.click();
}

const save2Img = () => {
    if (document.getElementById('regex_text').value == '') return;
    let xMin = Math.min(atomList.reduce((p, c) => p < c.x ? p : c.x, Number.MAX_VALUE), boneList.reduce((p, c) => p < c.x ? p : c.x, Number.MAX_VALUE)) - margin;
    let xMax = Math.min(atomList.reduce((p, c) => p > c.x ? p : c.x, Number.MIN_VALUE), boneList.reduce((p, c) => p > c.x ? p : c.x, Number.MIN_VALUE)) + margin;
    let yMin = Math.min(atomList.reduce((p, c) => p < c.y ? p : c.y, Number.MAX_VALUE), boneList.reduce((p, c) => p < c.y ? p : c.y, Number.MAX_VALUE)) - margin;
    let yMax = Math.min(atomList.reduce((p, c) => p > c.y ? p : c.y, Number.MIN_VALUE), boneList.reduce((p, c) => p > c.y ? p : c.y, Number.MIN_VALUE)) + margin;
    let canvas = new Canvas(document.createElement('canvas'), xMax - xMin, yMax - yMin);

    for (let { x, y, angle, count } of boneList)
        addBoneToCanvas(canvas, x - xMin, y - yMin - 20, angle, count);
    for (let { x, y, atom } of atomList)
        canvas.drawMiddleString(atom == '*' ? ' ' : atom, makePoint(x - xMin, y - yMin), '#000');

    let a = document.createElement('a');
    let name = document.getElementById('name_text').value;
    a.download = `${name == '' ? document.getElementById('regex_text').value : name}.png`;
    a.href = canvas.canvas.toDataURL("image/png");
    a.dataset.downloadurl = [a.download, a.href].join(':');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}