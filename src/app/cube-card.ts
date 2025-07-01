import { C, F } from "@thegraid/common-lib";
import { CenterText, CircleShape, NamedContainer, RectWithDisp, TextInRect, type CountClaz, type Paintable } from "@thegraid/easeljs-lib";
import { Text, type Container, type DisplayObject } from "@thegraid/easeljs-module";
import { AliasLoader, Tile } from "@thegraid/hexlib";
import { CardShape } from "./card-shape";
import { TileExporter } from "./tile-exporter";
import { TextTweaks, type TWEAKS } from "./text-tweaks";

type CARD = { Aname: string, color: string, cost: number, now?: string, active?: string, run?: string, runp?: string };
function rgbaToName(v: Uint8ClampedArray, alpha?: number|string) {
    return `rgba(${v[0]},${v[1]},${v[2]},${alpha ?? (v[3]/255).toFixed(2)})`
  }

export class CubeCard extends Tile  {
  static nameFont = F.fontSpec(65, 'SF Compact Rounded');
  static coinFont = F.fontSpec(80, 'SF Compact Rounded', 'bold');
  static titleFont = F.fontSpec(36, 'SF Compact Rounded');
  static textFont = F.fontSpec(36, 'SF Compact Rounded');
  static get fnames() {
    return  [... Object.keys(CubeCard.cmap), ... Object.values(CubeTweaker.glyphImage)];
  }
  static cards: CARD[] = [
    {Aname: 'Green Card', cost: 4, color: 'green', now: '', active: 'If you would bust, use this: \nselect 1 Grey $= from Roll Zone, \nset it to a face; you do not bust', run: 'Lose the $= you selected'},
    {Aname: 'Yellow Card', cost: 7, color: 'yellow', now: 'Gain 1 $# per active Grey $=,\ngain 1 Grey $=', active: '', run: 'If you have > 4 active Grey $=,\nlose this'},
    {Aname: 'Switch Hitter', cost: 4, color: 'orange', now: '', run: 'Lose 1 non-Grey $= [not optional], \nGain $f = half the cost of that die'},
    // {Aname: 'Card Name', cost: 4, color: 'brown', now: '', run: 'You may lose a grey from Roll, \nIf you do: \ngain a grey die and 1 Move'},
    // {Aname: 'Card Name', cost: 6, color: 'white', now: '', run: '+1 Move per active grey die; \n-1 Move per active green die'},
    // {Aname: 'Card Name', cost: 1, color: 'red', now: 'test text', run: ''},
    // {Aname: 'Cubasaurus', cost: 1, color: 'purple', now: 'test text', run: ''},
    // {Aname: 'Card\nName', cost: 1, color: 'blue', now: 'Gain 2 Feet', run: 'Lose a Grey die'},
    // {Aname: 'Card\nName', cost: 8, color: 'orange', now: 'Gain 1 Move per active grey die, \nuse them immediately', active: '', run: 'If you have > 5 active grey dice,\nlose this'},
    // {Aname: 'Card Name', cost: 7, color: 'yellow', now: 'If a green is active, lose it,\ngain 3 Move & 3 coin', run: 'gain a cube costing < that die'},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
  ];

  get mcolor() {
    return CubeCard.cmap[this.color] ?? 'pink';
  }
  get tcolor() {
    return (this.color == 'yellow') ? '#003300' : (this.color == 'white') ? 'DARKBLUE' : C.WHITE;
  }

  // todo: map from canonical names to print colors
  /** color map: canonical name -> hmtl color code */
  static cmap = {
    red: 'rgb(178,60,20)',
    orange: 'orange',
    yellow: 'yellow',
    green: 'rgb(51,193,69)',
    blue: 'rgb(112, 153, 227)',
    purple:'rgb(128,39,188)',// '0x7e27bc',
    brown: 'rgb(192,134,50)',
    white: 'rgb(198, 197, 205)',
  } as Record<string, string>;

  static allCards(): CountClaz[] {
    return CubeCard.cards.map((card: CARD) => [1, CubeCard, card]);
  }

  override get radius() { return 734 } // nextRadius

  x0 = 200; // align title, colored text/boxes
  color = 'white';
  cost = 2;
  now = '';
  active = '';
  run = '';
  runp = '';
  image?: ImageBitmap;
  tweaker: CubeTweaker;
  gridSpec = TileExporter.euroPoker;

  constructor(desc: CARD) {
    super(desc.Aname);
    const desc2 = { now: '', active: '', run: '', power: '', ...desc };
    this.color = desc.color;
    this.cost = desc.cost;
    this.now = desc2.now;
    this.active = desc2.active;
    this.run = desc2.run;
    this.tweaker = new CubeTweaker(this);
    this.addComponents();
  }

  // invoked by constructor.super()
  override makeShape(): Paintable {
    return new CardShape('lavender', this.color, this.radius);
  }
  // TODO: put all the components on the canvas

  // background, with grey rhombus
  // image scaned from card (includes dice faces!)
  // Name
  // Cost (in dual circles, 130px)
  // [now], [active], [power-run], [run]
  addComponents() {
    //
    const h = this.gridSpec.cardh!;
    const bmImage = AliasLoader.loader.getBitmap(this.color, this.gridSpec.cardw!); // scaled to fit cardw
    const bmBounds = bmImage.getBounds();
    const bmw = bmBounds?.width ?? 3160;
    const { x, y, height, width } = this.baseShape.getBounds();
    const x0 = this.x0 = x + width * .44;
    if (bmImage) {
      bmImage.x += 0; // can fudge if you want to see the cropped bleed graphics
      this.addChild(bmImage);
    }
    //
    const y0 = 0 - h * .36; // for baseLine = 'middle'
    const nameText = new CenterText(this.Aname, CubeCard.nameFont, this.tcolor);
    nameText.textAlign = 'left';
    const mlh = nameText.getMeasuredLineHeight();
    const dy2 = nameText.text.includes('\n') ? mlh/2 : 0;
    nameText.y = y0 - dy2;
    nameText.x = x0;
    const coin = this.makeCoin(x + width - 100, y0);
    this.addBoxes(y0 + mlh + dy2);
    this.addChild(nameText, coin); // titleName, not Tile.nameText
    // this.reCache(); // do not reCache: extends bouds to whole bmImage!
    this.paint(this.color)
  }

  makeCoin(x0=0, y0=0) {
    const cont = new NamedContainer('costCoin');
    const ring = new CircleShape(C.coinGold, 60, '');
    const disk = new CircleShape('rgb(180,130,17)', 50, '');
    const cost = new CenterText(`${this.cost}`, CubeCard.coinFont, C.coinGold)
    cont.addChild(ring, disk, cost)
    cont.x = x0; cont.y = y0;
    return cont;
  }

  addBoxes(y0 = 0, ygap = 16) {
    const keys = ((this.color == 'red') ? ['now', 'active', 'run', 'runp'] : ['now', 'active', 'run', 'runp'])  as (keyof CubeCard)[];
    const lines = keys.filter(l => this[l]).map(l => ({ key: l, txt: this[l] })) as Record<string, string>[];
    lines.map(txtr => {
      const { key, txt } = txtr;
      const cbox = this.makeContentBox(txt, y0);
      const ch = cbox.getBounds().height;
      const tbox = this.makeTitleBox(key.toUpperCase(), y0, ch); // TextInRect
      cbox.y += tbox.getBounds().height - ch + 4;
      this.addChild(tbox, cbox);
      y0 += tbox.getBounds().height + ygap;
      return tbox;
    });
  }

  /** darker, one-line, up case: NOW, ACTIVE, RUN, POWER-RUN */
  makeTitleBox(title = 'NOW', y0 = 0, below = 0 ): DisplayObject {
    const bColor = C.pickTextColor(C.WHITE, [this.mcolor, this.tcolor])
    const bgColor = (bColor == this.tcolor) ? bColor : this.darken(bColor, .5);
    return this.makeBox(title, y0, below, bgColor, CubeCard.titleFont, .45);
  }

  /** explanatory text --> dObj with Bounds */
  makeContentBox(text = 'do this...', y0 = 0): DisplayObject {
    const bColor = C.pickTextColor(C.WHITE, [this.mcolor, this.tcolor])
    const bgColor = (bColor == this.tcolor) ? this.darken(this.mcolor, .91) : this.darken(bColor, .82);
    return this.makeBox(text, y0, 0, bgColor, CubeCard.textFont, .5);
  }

  darken(color: string, dc = .8) {
    const rgb = C.nameToRgba(color);
    const darka = rgb.map(cv => Math.min(255, Math.floor(cv * dc)));
    const rgba = rgbaToName(darka, 1); // leave alpha at 1 for now
    return rgba;
  }

  /**
   *
   * @param text
   * @param y0
   * @param below
   * @param bgColor
   * @param fontSpec as from F.fontSpec: "italic bold 36px Ariel"
   * @param dw
   * @returns
   */
  makeBox(text = 'NOW', y0 = 0, below = 0, bgColor: string, fontSpec: string, dw = .45): DisplayObject {
    // FIX: If mcolor is 'whitish', then brighten bcolor & tColor = tcolor
    const tColor = C.pickTextColor(bgColor, [this.tcolor, C.WHITE]);
    const tText = new Text(text, fontSpec, tColor);
    const size = F.fontSize(tText.font);
    const glyphRE = this.tweaker.glyphRE; // red: $! $X
    const cont = this.tweaker.cont = new NamedContainer('aBox');
    const tweaks = { glyphRE, align: 'left', baseline: 'top', font: fontSpec, size } as TWEAKS;
    this.tweaker.setTextTweaks(tText, fontSpec, tweaks);
      const tb = cont.getBounds();
      const tw = Math.max(tb.width, this.gridSpec.cardw! * dw);
      cont.setBounds(tb.x, tb.y, tw, tb.height + below);
    const box = new RectWithDisp(cont, { bgColor, corner: 8 });
    box.y = y0;
    box.x = this.x0;
    return box;
  }

  override paint(colorn?: string, force?: boolean): void {
    super.paint(this.mcolor, force);
    return;
  }
}

class CubeTweaker extends TextTweaks {
  /**
   * - $= Cube Icon
   * - $f Foot Icon
   * - $F Flag
   * - $$ Coin Icon
   * - $# Credit Icon
   * - $r Roll die
   * - $! power die
   * - $C Cat face?
   * - $X Swords
   * - $V shield
   * - $H cheese
   * - $
   */
  glyphRE = /\$[=f$#Fr!CXVH]/g; //

  static glyphImage: Record<string, string> = {
    '=': 'cube', 'f': 'foot', 'F': 'flag', '$': 'coin', '#': 'credit', 'r': 'roll',
    '!': 'power', 'C': 'cat', 'X': 'sword', 'V': 'shield', 'H': 'cheese' };
  glyphParams: Record<string, Partial<Record<'dx' | 'dy' | 'tx' | 'size', number | undefined>>> = {
    foot: { dx: 15, dy: 20, size: 48, tx: 30 },
    cube: { dx: 15, dy: 20, size: 60, tx: 30 },
    credit: { dx: 15, dy: 20, size: 60, tx: 30 },
  };

  /**
   *
   * @param fragt text before the glyph (for metrics)
   * @param trigger match from regex (typically: $<char>)
   * @param linex where next text/char would go
   * @param liney where next text/char would go
   * @param lineh line height (lineHeight + leading) (could effect 'size' of glyph?)
   * @returns
   */
  override setGlyph(cont: Container, fragt: Text, trigger: string, linex = 0, liney = 0, lineh = fragt.lineHeight): number {
    const key = trigger[1];
    const name = CubeTweaker.glyphImage[key];
    const params = this.glyphParams[name];
    const { dx, dy, size } = { dx: 0, dy: 0, size: lineh - 2, ...params };
    const alias = AliasLoader, loader = alias.loader;//x
    const bmi = AliasLoader.loader.getBitmap(name, size);
    const bmw = bmi.getBounds().width;
    const tx = params.tx ?? bmw;
    bmi.x += linex + dx;
    bmi.y += liney + dy;
    cont.addChild(bmi);

    switch (key) {
      case '=': // Cube
        break;
      case 'f': // Foot
        break;
      case '$': // Coin
        break;
      case '#': // Credit
        break;
      case 'C': // cat face
        break;
      case 'F': // Flag
        break;
      case 'r': // roll die
        break;
      case '!': // power die
        break;
      case 'X': // crossed swords
        break;
    }

    return tx;
  }
}


