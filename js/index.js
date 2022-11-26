window.onload = async () => {
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