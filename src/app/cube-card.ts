import { C, F, stime } from "@thegraid/common-lib";
import { CenterText, CircleShape, NamedContainer, RectShape, RectWithDisp, type CountClaz, type Paintable } from "@thegraid/easeljs-lib";
import { Shape, Text, type Bitmap, type Container, type DisplayObject } from "@thegraid/easeljs-module";
import { AliasLoader, Tile } from "@thegraid/hexlib";
import { CardShape } from "./card-shape";
import { TextTweaks, type TWEAKS } from "./text-tweaks";
import { TileExporter } from "./tile-exporter";

// some cards have multiple 'run' boxes! so we allow string | string[]
type CARD = {
  Aname: string, color: string, cost: number,
  now?: string | string[], active?: string | string[], run?: string | string[],
};
type BoxKey = Extract<keyof CARD, 'now'|'active'|'run'>;
type CARD_DESC = Required<Pick<CARD, BoxKey>>;

function rgbaToName(v: Uint8ClampedArray, alpha?: number|string) {
    return `rgba(${v[0]},${v[1]},${v[2]},${alpha ?? (v[3]/255).toFixed(2)})`
  }

export class CubeCard extends Tile  {
  // static family = 'SF Compact Rounded'; static fontLead = 0;
  // static family = 'Nunito'; static fontLead = 0;
  // static family = 'Futura'; static fontLead = 12; // Futura steps on itsefl..
  static family = 'Helvetica Neue'; static fontLead = 6;
  static nameFont = (`normal 470 condensed 65px ${CubeCard.family}`);
  static coinFont = F.fontSpec(90, `${CubeCard.family}`, 'bold');
  static titleFont = F.fontSpec(36, `${CubeCard.family}`, 'bold');
  static textFont = F.fontSpec(36, `${CubeCard.family}`, '470 condensed');
  static itextFont = F.fontSpec(36, `${CubeCard.family}`, 'italic 470 condensed');
  static get fnames() {
    return  [... Object.keys(CubeCard.cmap), ... Object.values(CubeTweaker.glyphImage)];
  }
  static cards: CARD[] = [
    {Aname: 'Red Menace 2', cost: 6, color: 'red', now: '', run: ['($! RUN)$! = 2 $X each.','(RUN [COMPARE $X])MOST $X:\n[Start player $= breaks ties]\n\nGain an ORANGE or YELLOW $=.\n\nLose 1 RED $= [not optional].']},
    {Aname: 'Red Menace', cost: 5, color: 'red', now: '', run: '(RUN [COMPARE $X])MOST $X:\n[Start player $= breaks ties]\n\nGain an ORANGE or YELLOW $=.\n\nLose 1 RED $= [not optional].'},
    {Aname: 'Slim Cat', cost: 5, color: 'white', run: 'Gain 1$$.\n\nGain 1 GRAY $= [if possible]\nand gain 2$f'},
    {Aname: 'Cat Box', cost: 7, color: 'white', now: 'Gain a GREY $=.\n\nRoll ($r) a GREY $= from \nany zone.', run: 'Gain 1 $f per active GREY $=. \n\nLose $f per active GREEN $=.'},

    {Aname: 'Cubiquitous', cost: 9, color: 'purple', now: '', run: 'Gain 1 $f per active PURPLE $=.\n\nGain $f or $$ equal to the cost \nof the bonus you stop on.'},
    {Aname: 'Niña Cubelada', cost: 5, color: 'green', now: '', active: 'If you would bust, use this: \nYou may select 1 GREY $= from \nyour Roll Zone and set it to a face.\nIf you did, you do not bust.\n\nLose that $= at end of round \n[not optional]'},
    {Aname: 'Mellow Yellow', cost: 7, color: 'yellow', now: 'Gain 1 $# per active GREY $=.', active: '', run: 'Gain a GREY $=.\n\nIf more than 4 active GREY $=,\nlose this.'},
    {Aname: 'Yellow Card', cost: 7, color: 'yellow', now: 'Lose an active GREEN $= (if able).\n\nGain a $= costing < the $= you lost.', run: 'Gain 2$$.\n\nGain $f = cost of the $= you lost.'},
    {Aname: 'Switch Hitter', cost: 6, color: 'orange', now: '', run: 'Lose 1 NON-GREY $= [not optional]. \n\nGain $f = half the cost of that die.'},
    {Aname: 'Bone Yard', cost: 3, color: 'brown', now: '', run: 'You may lose a GREY $= from Roll, \nIf you do: \ngain a GREY $= and 1 $f.'},
    {Aname: 'White Card', cost: 6, color: 'white', now: '', run: '+1 $f per active GREY $=; \n-1 $f per active GREEN $=.'},
    {Aname: 'Chilly\nMcChillster', cost: 1, color: 'blue', now: 'Gain 2 $f: these $f may be \nused to enter water spaces.', run: 'Lose a GREY $=.'},
    {Aname: 'Grand Slam', cost: 8, color: 'orange', now: 'Gain 1 $f per active GREY $=, \nuse them immediately.', active: '', run: 'If you have > 4 active GREY $=,\nlose this.'},
    {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    // {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
  ];

  /** main color of card: cmap[this.color] */
  get mcolor() {
    return CubeCard.cmap[this.color] ?? 'pink';
  }
  get useAltColor() {
    return (this.color == 'yellow') || (this.color == 'white');
  }
  /** text color on card, generally WHITE, but white & yellow cards use alternate color */
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
  desc: CARD_DESC;
  image?: ImageBitmap;
  tweaker: CubeTweaker;
  gridSpec = TileExporter.euroPoker;
  keys = ['now', 'active', 'run'] as BoxKey[];

  constructor(desc: CARD) {
    super(desc.Aname);
    this.desc = { now: '', active: '', run: '', ...desc };
    this.color = desc.color;
    this.cost = desc.cost;
    this.tweaker = new CubeTweaker(this);
    this.addComponents();
  }

  // invoked by constructor.super()
  override makeShape(): Paintable {
    return new CardShape('lavender', this.color, this.radius, false, 0, 10);
  }

  // TODO: background, with grey rhombus
  // image scanned from card (includes dice faces!)
  // Card Name (maybe two lines)
  // Cost (in dual circles, 130px)
  // [now], [active], [run]
  addComponents() {
    //
    const h = this.gridSpec.cardh!;
    const bmImage = AliasLoader.loader.getBitmap(this.color, this.gridSpec.cardw!); // scaled to fit cardw
    const { x, y, height, width } = this.baseShape.getBounds();
    const x0 = this.x0 = x + width * .44;
    if (bmImage) {
      bmImage.x += 0; // can fudge if you want to see the cropped bleed graphics
      this.addChild(bmImage);
    }
    // set card name:
    const y0 = 0 - h * .36; // for baseLine = 'middle'
    const nameText0 = new CenterText(this.Aname, CubeCard.nameFont, this.tcolor);
    const mlh = nameText0.getMeasuredLineHeight();
    const nlh = mlh + CubeCard.fontLead;
    const tweaks: TWEAKS = { color: this.tcolor, nlh, align: 'left'};
    this.tweaker.cont = this;  // add directly with this.addChild();
    const nameText = this.tweaker.setTextTweaks(this.Aname, CubeCard.nameFont, tweaks); // addChild(nameText)
    const nlines = nameText.text.split('\n').length;
    const dy2 = nlines * nlh;
    nameText.y = y0 - (nlines == 1 ? 0 : mlh/2);
    nameText.x = x0;
    // set cost coin:
    const coin = this.makeCoin(x + width - 100, y0);
    this.addBoxes(nameText.y + dy2);
    this.addChild(nameText, coin); // titleName, not Tile.nameText
    // this.reCache(); // do not reCache: extends bouds to whole bmImage!
    this.paint(this.color)
  }

  makeCoin(x0 = 0, y0 = 0) {
    const cont = new NamedContainer('costCoin');
    const bmi = AliasLoader.loader.getBitmap('coin', 300); // noStencil
    bmi.x += 2; bmi.y -= 2;
    const cost = new CenterText(`${this.cost}`, CubeCard.coinFont, C.coinGold)
    cont.addChild(bmi, cost);
    cont.x = x0; cont.y = y0;
    return cont;
  }

  addBoxes(y0 = 0, ygap = 16) {
    const keys0 = ['now', 'active', 'run'] as BoxKey[];
    const keys = keys0.filter(l => this.desc[l]); // as Record<string|'txt', string>[];
    keys.map(key => {
      const desc = this.desc[key];
      const txt_ary = (typeof desc == 'string') ? [desc] : desc;
      txt_ary.map(txt0 => {
      const txt = `${txt0 as string} `;
      const special = txt.match(/^\((.*)\)([\s\S]*)/); // surrounded by (..) then all the rest
      const title = special ? special[1] : key.toUpperCase();
      const content = special ? special[2] : txt;
      const tbox = this.makeTitleBox(title, y0) as RectWithDisp;
      const cbox = this.makeContentBox(content, y0);
      // overlap corner radius, lead, descenders (approx)
      const overlap = this.corner + 2 + (F.fontSize(CubeCard.titleFont) / 9);
      cbox.y = tbox.y + tbox.getBounds().height - overlap;
      cbox.y -= cbox.getBounds().y; // when glyph causes bounds to grow up...
      this.addChild(tbox, cbox);
      y0 = cbox.y + cbox.getBounds().height + ygap;
      // In case glyph or title have descenders, extend southern border:
      tbox.borders = [undefined, undefined, undefined, 15];
      tbox.setBounds(undefined, 0, 0, 0);
      tbox.paint(undefined, true);
      return tbox;
      })
    });
  }

  /** darker, one-line, up case: NOW, ACTIVE, RUN, POWER-RUN */
  makeTitleBox(title = 'NOW', y0 = 0 ): DisplayObject {
    const bColor = C.pickTextColor(C.WHITE, [this.mcolor, this.tcolor])
    const bgColor = this.useAltColor ? bColor : this.darken(bColor, .4);
    return this.makeBox(title, y0, bgColor, CubeCard.titleFont, C.WHITE, .45);
  }

  /** explanatory text --> dObj with Bounds */
  makeContentBox(text = 'do this...', y0 = 0): DisplayObject {
    const bColor = C.pickTextColor(C.WHITE, [this.mcolor, this.tcolor])
    const bgColor = this.useAltColor ? this.darken(this.mcolor, .91) : this.darken(bColor, .82);
    const tColor = this.tcolor;
    const strokec = this.useAltColor ? bColor : this.darken(bColor, .5);
    const rwd = this.makeBox(text, y0, bgColor, CubeCard.textFont, tColor, .5, strokec) as RectWithDisp;
    const ss = 3;
    rwd.rectShape.setRectRad({ s: ss }); //
    rwd.rectShape.setBounds(undefined, 0, 0, 0);
    rwd.rectShape.paint(undefined, true);
    rwd.x += ss; // account for strokec
    // rwd.y += 1;
    return rwd
  }
  lineShape(y = 0, x0 = 0, dx = 90, color = 'red') {
    const s = new Shape();
    s.graphics.beginStroke(color).mt(x0, y).lt(x0+dx, y).endStroke();
    return s;
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
   * @param y0 y-coord: top of box wrt this.cont
   * @param below extend below text extent [hmm, could be simply the corner radius!]
   * @param bgColor fillc for this box
   * @param fontSpec as from F.fontSpec: "italic bold 36px Ariel"
   * @param dw x-offset as fraction of cardw
   * @returns a RectWithDisp around a cont holding text
   */
  makeBox(text = 'NOW', y0 = 0, bgColor: string, fontSpec: string, tColor = this.tcolor, dw = .45, strokec = ''): DisplayObject {
    // FIX: If mcolor is 'whitish', then brighten bcolor & tColor = tcolor
    const tText = new Text(text, fontSpec, tColor);
    const size = F.fontSize(tText.font);
    const glyphRE = this.tweaker.glyphRE; // red: $! $X
    const tweaks = { glyphRE, align: 'left', baseline: 'top', font: fontSpec, color: tColor, size, nlh: size + 5 } as TWEAKS;
    const cont = this.tweaker.cont = new NamedContainer('aBox');
    const bText = this.tweaker.setTextTweaks(tText, fontSpec, tweaks);
      const tb = cont.getBounds();
      const tw = Math.max(tb.width, this.gridSpec.cardw! * dw);
      cont.setBounds(tb.x, tb.y, tw, tb.height);
    const box = new RectWithDisp(cont, { bgColor, corner: this.corner, border: this.border });
    const rect = box.rectShape;
    rect.strokec = strokec;
    box.paint(rect.colorn, true);
    box.y = y0;
    box.x = this.x0;
    return box;
  }
  corner = 8;
  border = 6;

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
   */
  glyphRE = /\$[=f$#Fr!CXVH]/g; //

  static glyphImage: Record<string, string> = {
    '=': 'cube', 'f': 'foot', 'F': 'flag', '$': 'coin', '#': 'credit2', 'r': 'roll',
    '!': 'power', 'C': 'cat', 'X': 'sword', 'V': 'shield', 'H': 'cheese' };

    /** suitable for 36px textFont */
  glyphParams: Record<string, Partial<Record<'dx' | 'dy' | 'tx' | 'size' | 'noStencil', number | undefined>>> = {
    foot: { dx: 15, dy: 18, size: 45 },
    cube: { dx: 18, dy: 18, size: 80 },
    credit: { dx: 15, dy: 20, size: 60, noStencil: 1 },
    credit2: { dx: 15, dy: 18, size: 46, noStencil: 1 },
    roll: { dx: 50, dy: 17, size: 90 },
    flag: { dx: 25, dy: 20, size: 90 },
    coin: { dx: 20, dy: 17, size: 60, noStencil: 1 },
    power: { dx: 25, dy: 17, size: 45 },
    sword: { dx: 25, dy: 17, size: 45 },
    shield: { dx: 25, dy: 20, size: 40 },
    cat: { dx: 25, dy: 18, size: 46 },
    cheese: { dx: 25, dy: 22, size: 40 },
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
    const params = this.glyphParams[name] ?? {};
    const { dx, dy, size } = { dx: 0, dy: 0, size: lineh - 2, ...params };
    const tx = params.tx ?? dx * 2;  // Assert: images is centered
    const aliasLoader = AliasLoader; // for debugger access
    const bmi0 = aliasLoader.loader.getBitmap(name, size);
    const color = fragt.color;
    const bmi = (color.match(/white/i) || params.noStencil) ? bmi0 : new StencilImage(bmi0, color);
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
class StencilImage extends NamedContainer {
  colorRect!: RectShape
  /** color bitmap with 'source-atop' */
  constructor(public bitmap: Bitmap, public color: string, scale = 1) {
    super('stencil')

    const w = bitmap.image.width, h = bitmap.image.height;
    bitmap.setBounds(0, 0, w, h)
    this.addChild(bitmap);

    const { x, y, width, height } = this.getBounds();
    this.colorRect = new RectShape({x, y, w: width, h: height}, color,'')
    this.colorRect.compositeOperation = "source-atop";
    this.addChild(this.colorRect);
    this.cache(x, y, width, height, scale)
  }
  paint(color: string) {
    this.colorRect.paint(color)
    this.updateCache();
  }
}


