"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paint = void 0;
function camelToKebab(camel) {
    return camel.replace(/[A-Z]/g, s => '-' + s.toLowerCase());
}
function drawDiv(style, attrs) {
    const styleString = Object.entries(style).map(([prop, value]) => {
        return `${camelToKebab(prop)}: ${value}`;
    }).join('; ');
    const attrString = Object.entries(attrs).map(([name, value]) => {
        return `${name}="${value}"`; // TODO html entities
    }).join(' ');
    return `<div style="${styleString};" ${attrString}></div>`;
}
function drawColoredBoxDiv({ id, x, y, width, height }, { r, g, b, a }, level) {
    return drawDiv({
        position: 'absolute',
        left: x + 'px',
        top: y + 'px',
        width: width + 'px',
        height: height + 'px',
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`,
        zIndex: level
    }, { title: `area id: ${id}` });
}
function paintBlockContainer(blockContainer, level = 0) {
    const style = blockContainer.style;
    const { backgroundColor, backgroundClip } = style;
    const { paddingArea, borderArea, contentArea } = blockContainer;
    let s = backgroundClip === 'border-box' ? drawColoredBoxDiv(borderArea, backgroundColor, level) :
        backgroundClip === 'padding-box' ? drawColoredBoxDiv(paddingArea, backgroundColor, level) :
            backgroundClip === 'content-box' ? drawColoredBoxDiv(contentArea, backgroundColor, level) :
                '';
    // now paint borders TODO border styles that aren't solid, border-radius
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        const sideWidth = style[`border${side}Width`];
        if (sideWidth > 0) {
            const borderColor = style[`border${side}Color`];
            const height = side === 'Top' || side === 'Bottom' ? sideWidth : borderArea.height;
            const width = side === 'Left' || side === 'Right' ? sideWidth : borderArea.width;
            const x = side == 'Right' ? paddingArea.x + paddingArea.width : borderArea.x;
            const y = side === 'Bottom' ? paddingArea.y + paddingArea.height : borderArea.y;
            s += drawColoredBoxDiv({ id: -1, x, y, width, height }, borderColor, level);
        }
    }
    for (const child of blockContainer.children) {
        if (child.isBlockContainer && !child.isInlineLevel) {
            s += paintBlockContainer(child, level + 1);
        }
    }
    return s;
}
function paint(blockContainer) {
    return paintBlockContainer(blockContainer);
}
exports.paint = paint;