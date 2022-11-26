window.onload = async () => {
    document.getElementById('usage').innerHTML=`使用说明：<br>
    - | \\ / 化学键，放于原子团前面或者后面<br>
    [] 在原子团后面表示取代基，多个取代基使用,分隔<br>
    = # 写在最前面表示双键和三键<br>
    < > 对于后面相邻的键，旋转15°`
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