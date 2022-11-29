class Canvas {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
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
    drawString = (text, point, color, font) => {
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.fillText(text, point.X, point.Y);
    }
    drawMiddleString = (text, point, color, font) => {
        let size = this.getTextSize(text, font);
        point = addPoint(point, makePoint(-size.X / 2, -size.Y / 2))
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.fillText(text, point.X, point.Y);
    }
    getTextSize = (text, font) => {
        let span = document.createElement("span");
        span.style.font = font;
        span.innerText = text;
        document.body.appendChild(span);
        let size = makePoint(span.offsetWidth, span.offsetHeight);
        document.body.removeChild(span);
        return size;
    }
}
const addPoint = (p1, p2) => makePoint(p1.X + p2.X, p1.Y + p2.Y);
const makePoint = (X, Y) => ({ X, Y });