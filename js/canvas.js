class Canvas {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = canvas.getContext('2d');
        this.ctx.font = '25px Arial';
    }
    clear = () => this.canvas.height = this.canvas.height;
    drawLine = (start, end, color, width) => this.drawLines(new Array(start, end), color, width);
    drawLines = (points, color, width) => {
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].X, points[0].Y);
        for (let i = 1; i < points.length; i++)
            this.ctx.lineTo(points[i].X, points[i].Y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }
    fillCircle = (center, radius, color) => {
        this.ctx.beginPath();
        this.ctx.arc(center.X, center.Y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
    drawMiddleString = (text, point, color) => {
        let size = this.getTextSize(text);
        point = makePoint(point.X - size.X / 2, point.Y - size.Y / 2);
        this.drawString(text, point, color);
    }
    drawString = (text, point, color) => {
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, point.X, point.Y);
    }
    getTextSize = (text) => {
        let span = document.createElement("span");
        span.style.fontSize = '20px';
        span.innerText = text;
        document.body.appendChild(span);
        let size = makePoint(span.offsetWidth, span.offsetHeight);
        document.body.removeChild(span);
        return size;
    }
}
const addPoint = (p1, p2) => makePoint(p1.X + p2.X, p1.Y + p2.Y);
const makePoint = (X, Y) => ({ X, Y });

const addBoneToCanvas = (canvas, x, y, angle, c) => {
    let xMul = round(Math.cos(angle / 180 * Math.PI), 10), yMul = round(Math.sin(angle / 180 * Math.PI), 10)
    let offsetX = (boneLength - textOffsetX) * xMul, offsetY = (boneLength - textOffsetY) * yMul;
    let o_2_x = 2 * yMul, o_2_y = 2 * -xMul;
    let o_3_x = 4 * yMul, o_3_y = 4 * -xMul;
    if (c == 1)
        canvas.drawLine(makePoint(x - offsetX, y - offsetY), makePoint(x + offsetX, y + offsetY), '#000', 2);
    if (c == 2) {
        canvas.drawLine(makePoint(x - offsetX + o_2_x, y - offsetY + o_2_y), makePoint(x + offsetX + o_2_x, y + offsetY + o_2_y), '#000', 2);
        canvas.drawLine(makePoint(x - offsetX - o_2_x, y - offsetY - o_2_y), makePoint(x + offsetX - o_2_x, y + offsetY - o_2_y), '#000', 2);
    } if (c == 3) {
        canvas.drawLine(makePoint(x - offsetX, y - offsetY), makePoint(x + offsetX, y + offsetY), '#000', 2);
        canvas.drawLine(makePoint(x - offsetX + o_3_x, y - offsetY + o_3_y), makePoint(x + offsetX + o_3_x, y + offsetY + o_3_y), '#000', 2);
        canvas.drawLine(makePoint(x - offsetX - o_3_x, y - offsetY - o_3_y), makePoint(x + offsetX - o_3_x, y + offsetY - o_3_y), '#000', 2);
    }
}