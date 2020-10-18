import {id} from './util';
import {Style} from './cascade';
import {Inline, BlockContainer, BlockContainerOfBlocks, BlockContainerOfInline} from './flow';
import {Run} from './text';

export type LogicalArea = {
  blockStart: number
  blockEnd: number
  inlineStart: number
  inlineEnd: number
  blockSize: number
  inlineSize: number
};

const horizontalTb = (area: Area):LogicalArea => ({
  get blockStart() { return area.top; },
	set blockStart(v) { area.top = v; },
  get blockEnd() { return area.bottom; },
  set blockEnd(v) { area.bottom = v; },
  get inlineStart() { return area.left; },
  set inlineStart(v) { area.left = v; },
  get inlineEnd() { return area.right; },
  set inlineEnd(v) { area.right = v; },
  get blockSize() { return area.height; },
  set blockSize(v) { area.height = v; },
  get inlineSize() { return area.width; },
  set inlineSize(v) { area.width = v; }
});

const verticalLr = (area: Area):LogicalArea => ({
  get blockStart() { return area.left; },
  set blockStart(v) { area.left = v; },
  get blockEnd() { return area.right; },
  set blockEnd(v) { area.right = v; },
  get inlineStart() { return area.top; },
  set inlineStart(v) { area.top = v; },
  get inlineEnd() { return area.bottom; },
  set inlineEnd(v) { area.bottom = v; },
  get blockSize() { return area.width; },
  set blockSize(v) { area.width = v; },
  get inlineSize() { return area.height; },
  set inlineSize(v) { area.height = v; }
});

const verticalRl = (area: Area):LogicalArea => ({
  get blockStart() { return area.right; },
  set blockStart(v) { area.right = v; },
  get blockEnd() { return area.left; },
  set blockEnd(v) { area.left = v; },
  get inlineStart() { return area.top; },
  set inlineStart(v) { area.top = v; },
  get inlineEnd() { return area.bottom; },
  set inlineEnd(v) { area.bottom = v; },
  get blockSize() { return area.width; },
  set blockSize(v) { area.width = v; },
  get inlineSize() { return area.height; },
  set inlineSize(v) { area.height = v; }
});

export type WritingMode = 'horizontal-tb' | 'vertical-lr' | 'vertical-rl';

const throwOverSpecified = (a, side) => new Error(
  `Cannot set ${side} on area ${a.id} because this dimension is already ` +
  'locked-in (must choose two of width, left, right, for example)'
);

export class Area {
  id: string;
  x = 0;
  y = 0;
  w = 0;
  h = 0;
  parent?: Area;

  private spec: {
    t?: number;
    r?: number;
    b?: number;
    l?: number;
    w?: number;
    h?: number;
  } = {};

  private hasAbsolutified = false;

  constructor(id: string, x?: number, y?: number, w?: number, h?: number) {
    this.id = id;

    if (x != null && y != null && w != null && h != null) {
      [this.x, this.y, this.w, this.h] = [x, y, w, h];
      this.hasAbsolutified = true;
    }
  }

  setParent(p: Area) {
    this.parent = p;
  }

  set top(v: number) {
    if (this.spec.b != null && this.spec.h != null) {
      throwOverSpecified(this, 'top');
    }
    this.spec.t = v;
  }

  set right(v: number) {
    if (this.spec.l != null && this.spec.w != null) {
      throwOverSpecified(this, 'right');
    }
    this.spec.r = v;
  }

  set bottom(v: number) {
    if (this.spec.t != null && this.spec.h != null) {
      throwOverSpecified(this, 'bottom');
    }
    this.spec.b = v;
  }

  set left(v: number) {
    if (this.spec.r != null && this.spec.w != null) {
      throwOverSpecified(this, 'left');
    }
    this.spec.l = v;
  }

  set width(v: number) {
    if (this.spec.l != null && this.spec.r != null) {
      throwOverSpecified(this, 'width');
    }
    this.spec.w = v;
  }

  set height(v: number) {
    if (this.spec.t != null && this.spec.b != null) {
      throwOverSpecified(this, 'height');
    }
    this.spec.h = v;
  }

  get width() {
    if (this.hasAbsolutified) return this.w;
    if (this.spec.w != null) return this.spec.w;
    if (this.spec.l != null && this.spec.r != null && this.parent) {
      return this.parent.width - this.spec.l - this.spec.r;
    }
    throw new Error (`Cannot get width of area ${this.id}`);
  }

  get height() {
    if (this.hasAbsolutified) return this.h;
    if (this.spec.h != null) return this.spec.h;
    if (this.spec.t != null && this.spec.b != null && this.parent) {
      return this.parent.height - this.spec.t - this.spec.b;
    }
    throw new Error (`Cannot get height of area ${this.id}`);
  }

  isComplete() {
    let n = 0;
    for (const _ in this.spec) {
      const k = _ as keyof Area["spec"];
      if (this.spec[k] != null) ++n;
    }
    return n === 4;
  }

  absolutify() {
    if (!this.parent || !this.parent.hasAbsolutified) {
      throw new Error(`Cannot absolutify area ${this.id}, parent is not ready`);
    }

    if (!this.isComplete()) {
      throw new Error(`Cannot absolutify area ${this.id} incomplete geometry`);
    }

    const {w: pw, h: ph, x: px, y: py} = this.parent;

    if (this.spec.l != null) this.x = px + this.spec.l;
    if (this.spec.r != null) this.x = px + pw - this.spec.r - this.width;

    if (this.spec.t != null) this.y = py + this.spec.t;
    if (this.spec.b != null) this.y = py + ph - this.spec.b - this.height;

    this.w = this.width;
    this.h = this.height;

    this.hasAbsolutified = true;
  }

  createLogicalView(writingMode: WritingMode) {
    return writingMode === 'horizontal-tb' ? horizontalTb(this)
		: writingMode === 'vertical-lr' ? verticalLr(this)
		: verticalRl(this);
  }
}

export type ContainingBlockState = {
  lastBlockContainerArea: Area,
  lastPositionedArea: Area
};

type DescendIf = (box: Box) => boolean;

type DescendState = Iterable<['pre' | 'post', Box]>;

export class Box {
  public id: string;
  public style: Style;
  public children: Box[];
  public isAnonymous: boolean;
  public containingBlock: Area | null = null;

  public borderArea: Area;
  public paddingArea: Area;
  public contentArea: Area;

  constructor(style: Style, children: Box[], isAnonymous: boolean) {
    this.id = id();
    this.style = style;
    this.children = children;
    this.isAnonymous = isAnonymous;

    this.borderArea = new Area(this.id + 'b');
    this.paddingArea = new Area(this.id + 'p');
    this.contentArea = new Area(this.id + 'c');
    this.paddingArea.setParent(this.borderArea);
    this.contentArea.setParent(this.paddingArea);
  }

  isBlockContainer(): this is BlockContainer {
    return false;
  }

  isBlockContainerOfBlocks(): this is BlockContainerOfBlocks {
    return false;
  }

  isBlockContainerOfInline(): this is BlockContainerOfInline {
    return false;
  }

  isRun(): this is Run {
    return false;
  }

  isInline(): this is Inline {
    return false;
  }

  get isRelativeOrStatic() {
    return this.style.position === 'relative'
      || this.style.position === 'static'
      // XXX anonymous boxes won't have a position since position doesn't
      // inherit. Possible this could cause a problem later, so take note
      || this.isAnonymous && !this.style.position;
  }

  get isAbsolute() {
    return this.style.position === 'absolute';
  }

  get isPositioned() {
    return this.style.position !== 'static';
  }

  get isInlineLevel() {
    return false;
  }

  get desc() {
    return 'Box';
  }

  get sym() {
    return '◼︎';
  }

  assignContainingBlocks(cbstate: ContainingBlockState) {
    // CSS2.2 10.1
    if (this.isRelativeOrStatic) {
      this.containingBlock = cbstate.lastBlockContainerArea;
    } else if (this.isAbsolute) {
      this.containingBlock = cbstate.lastPositionedArea;
    } else {
      throw new Error(`Could not assign a containing block to box ${this.id}`);
    }

    cbstate = Object.assign({}, cbstate);
    this.borderArea.setParent(this.containingBlock);

    if (this.isBlockContainer()) {
      cbstate.lastBlockContainerArea = this.contentArea;
    }

    if (this.isPositioned) {
      cbstate.lastPositionedArea = this.paddingArea;
    }

    for (const child of this.children) {
      if (!child.isRun()) child.assignContainingBlocks(cbstate);
    }
  }

  absolutify() {
    this.borderArea.absolutify();
    this.paddingArea.absolutify();
    this.contentArea.absolutify();
    for (const c of this.children) c.absolutify();
  }

  *descendents(boxIf?: DescendIf, subtreeIf?: DescendIf): DescendState {
    if (this.children) {
      for (const child of this.children) {
        let skipChild = false;

        if (boxIf && !boxIf(child)) {
          skipChild = true;
          break;
        }

        if (skipChild) continue;

        yield ['pre', child];

        let skipSubtree = false;

        if (subtreeIf && !subtreeIf(child)) {
          skipSubtree = true;
          break;
        }

        if (!skipSubtree) {
          yield* child.descendents(boxIf, subtreeIf);
        }

        yield ['post', child];
      }
    }
  }

  repr(indent = 0, options?: {containingBlocks: boolean}) {
    let c = '';

    if (!this.isRun()) {
      c = '\n' + this.children.map(c => c.repr(indent + 1, options)).join('\n');
    }

    let extra = '';

    if (options && options.containingBlocks && (this.isBlockContainer() || this.isInline())) {
      extra += ` (cb = ${this.containingBlock ? this.containingBlock.id : '(null)'})`;
    }

    return '  '.repeat(indent) + this.sym + ' ' + this.desc + extra + c;
  }
}
