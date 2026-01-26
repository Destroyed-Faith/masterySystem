export function drawLine(svgElement, x1, y1, x2, y2, color = "black", strokeWidth = 3) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", strokeWidth);

    // Schatten/Glow Effekt
    line.style.filter = "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))";

    // Sanfter Fade-in
    line.style.opacity = "0";
    line.style.transition = "opacity 0.3s ease";
    svgElement.appendChild(line);

    // Trigger Fade-in
    requestAnimationFrame(() => {
        line.style.opacity = "1";
    });
}
