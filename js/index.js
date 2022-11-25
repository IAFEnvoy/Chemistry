const changePaint = () => {
    let regex = document.getElementById("regex_text").value;
    document.getElementById('error').innerText = '\n';
    try {
        parse(regex);
        draw();
    } catch (err) {
        document.getElementById('error').innerText = err;
    }
}

let atomList = [], boneList = [];
const boneLength = 30, textOffset = 12.5, margin = 50;
const dirKey = '-|/\\', angle = { '-': 0, '\\': 60, '|': 90, '/': 300 };
const mulKey = '=#', multibone = { '=': 2, '#': 3 };

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
        subAtom(sub, centerX, centerY);
        atom = regex.slice(0, regex.indexOf('['));
    }
    atomList.push({ atom: atom, x: centerX, y: centerY });
}

const subAtom = (regex, centerX, centerY) => {
    let subs = [], sub = '', stack = 0;
    for (let i = 0; i < regex.length; i++) {
        if (regex[i] == ',' && stack == 0) {
            subs.push(sub);
            sub = '';
        } else {
            sub += regex[i];
            if (regex[i] == '[') stack++;
            if (regex[i] == ']') stack--;
        }
    }
    subs.push(sub);
    for (let i = 0; i < subs.length; i++)
        parseSingle(subs[i], centerX, centerY);
}

const parseSingle = (regex, centerX, centerY) => {
    if (regex == '') throw Error('Unexpected empty atom group');
    let dir = [], mirror = 1, atom = '', count = 1, inAtom = false, stack = 0;
    for (let i = 0; i < regex.length; i++) {
        if (mulKey.indexOf(regex[i]) != -1 && !inAtom) {
            if (i == 0) count = mulKey.indexOf(regex[i]) + 2;
            else throw Error('Unexpected multibone key');
        }
        else if (dirKey.indexOf(regex[i]) != -1 && stack == 0) {
            if (dir.find(x => x.mirror == mirror && x.angle == angle[regex[i]]) != null) throw Error('Too many bones');
            dir.push({ mirror: mirror, angle: angle[regex[i]] });
        } else {
            if (mirror == -1 && stack == 0) throw Error('Too many sub atom group ' + i);
            inAtom = true;
            atom += regex[i];
            if (regex[i] == '[') stack++;
            if (regex[i] == ']') stack--;
            if (i + 1 == regex.length || dirKey.indexOf(regex[i + 1]) != -1 && stack == 0) {
                mirror = -1;
                inAtom = false;
                continue;
            }
        }
    }
    if (atom == '') throw Error('Missing atom group');
    for (let i = 0; i < dir.length; i++) {
        let offsetX = boneLength * round(Math.cos(dir[i].angle / 180 * Math.PI), 10) * dir[i].mirror, offsetY = boneLength * round(Math.sin(dir[i].angle / 180 * Math.PI), 10) * dir[i].mirror;
        boneList.push({ angle: dir[i].angle, count: count, x: centerX + offsetX, y: centerY + offsetY });
        parseOne(atom, centerX + offsetX * 2, centerY + offsetY * 2);
    }
}

const draw = () => {
    let xMin = Math.min(atomList.reduce((p, c) => p < c.x ? p : c.x, Number.MAX_VALUE), boneList.reduce((p, c) => p < c.x ? p : c.x, Number.MAX_VALUE)) - margin;
    let xMax = Math.min(atomList.reduce((p, c) => p > c.x ? p : c.x, Number.MIN_VALUE), boneList.reduce((p, c) => p > c.x ? p : c.x, Number.MIN_VALUE)) + margin;
    let yMin = Math.min(atomList.reduce((p, c) => p < c.y ? p : c.y, Number.MAX_VALUE), boneList.reduce((p, c) => p < c.y ? p : c.y, Number.MAX_VALUE)) - margin;
    let yMax = Math.min(atomList.reduce((p, c) => p > c.y ? p : c.y, Number.MIN_VALUE), boneList.reduce((p, c) => p > c.y ? p : c.y, Number.MIN_VALUE)) + margin;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${xMax - xMin}" height="${yMax - yMin}">`;
    svg += '<style>text{text-anchor:middle;dominant-baseline:middle;font-size:25px}</style>';
    for (let { x, y, angle, count } of boneList)
        svg += addBone(x - xMin, y - yMin, angle, count);
    for (let { x, y, atom } of atomList)
        svg += addMiddleText(x - xMin, y - yMin, atom == '*' ? ' ' : atom);
    svg += '</svg>';
    document.getElementById('render').innerHTML = svg;
}

const addMiddleText = (x, y, text) => {
    return `<text x="${x}" y="${y}">${text}</text>`
}

const addBone = (x, y, angle, c) => {
    let xMul = round(Math.cos(angle / 180 * Math.PI), 10), yMul = round(Math.sin(angle / 180 * Math.PI), 10)
    let offsetX = (boneLength - textOffset) * xMul, offsetY = (boneLength - textOffset) * yMul;
    let o_2_x = 2 * yMul, o_2_y = 2 * -xMul;
    let o_3_x = 4 * yMul, o_3_y = 4 * -xMul;
    if (c == 1)
        return `<line x1="${x - offsetX}" y1="${y - offsetY}" x2="${x + offsetX}" y2="${y + offsetY}" stroke="black" stroke-width="2"></line>`;
    if (c == 2)
        return `<line x1="${x - offsetX + o_2_x}" y1="${y - offsetY + o_2_y}" x2="${x + offsetX + o_2_x}" y2="${y + offsetY + o_2_y}" stroke="black" stroke-width="2"></line>`
            + `<line x1="${x - offsetX - o_2_x}" y1="${y - offsetY - o_2_y}" x2="${x + offsetX - o_2_x}" y2="${y + offsetY - o_2_y}" stroke="black" stroke-width="2"></line>`;
    if (c == 3)
        return `<line x1="${x - offsetX}" y1="${y - offsetY}" x2="${x + offsetX}" y2="${y + offsetY}" stroke="black" stroke-width="2"></line>`
            + `<line x1="${x - offsetX + o_3_x}" y1="${y - offsetY + o_3_y}" x2="${x + offsetX + o_3_x}" y2="${y + offsetY + o_3_y}" stroke="black" stroke-width="2"></line>`
            + `<line x1="${x - offsetX - o_3_x}" y1="${y - offsetY - o_3_y}" x2="${x + offsetX - o_3_x}" y2="${y + offsetY - o_3_y}" stroke="black" stroke-width="2"></line>`;
}


const round = (num, i) => {
    let decimalNum = null;
    if (!isNaN(num)) {
        let arr = num.toString().split(".");
        if (arr.length > 1 && arr[1].length > i) {
            let decimal = arr[1].slice(i, i + 1);
            if (decimal === '5')
                num += Math.pow(0.1, i + 1);
            decimalNum = num.toFixed(i);
        }
        else
            decimalNum = num;
        decimalNum = Number(decimalNum);
    }
    return decimalNum;
}