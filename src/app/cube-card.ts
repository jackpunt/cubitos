import { C, F } from "@thegraid/common-lib";
import { CenterText, CircleShape, NamedContainer, TextInRect, type CountClaz, type Paintable } from "@thegraid/easeljs-lib";
import { Text } from "@thegraid/easeljs-module";
import { AliasLoader, Tile } from "@thegraid/hexlib";
import { CardShape } from "./card-shape";
import { TileExporter } from "./tile-exporter";

type CARD = { Aname: string, color: string, cost: number, now?: string, active?: string, run?: string, runp?: string };
function rgbaToName(v: Uint8ClampedArray, alpha?: number|string) {
    return `rgba(${v[0]},${v[1]},${v[2]},${alpha ?? (v[3]/255).toFixed(2)})`
  }

export class CubeCard extends Tile  {
  static nameFont = F.fontSpec(65, 'SF Compact Rounded');
  static coinFont = F.fontSpec(80, 'SF Compact Rounded', 'bold');
  static titleFont = F.fontSpec(36, 'SF Compact Rounded');
  static textFont = F.fontSpec(36, 'SF Compact Rounded');

  static cards: CARD[] = [
    {Aname: 'Card Name', cost: 1, color: 'red', now: '', run: ''},
    {Aname: 'Cubasaurus', cost: 1, color: 'purple', now: '', run: ''},
    {Aname: 'Card Name', cost: 1, color: 'blue', now: '', run: ''},
    {Aname: 'Card Name', cost: 4, color: 'green', now: '', active: 'If you would bust, use this: \nselect 1 grey die from Roll Zone, \nset it to a face; you do not bust', run: 'lose the die you selected'},
    {Aname: 'Card Name', cost: 8, color: 'orange', now: 'Gain 1 Move per active grey die, \nuse them immediately', active: '', run: 'if you have > 5 active grey dice,\nlose this'},
    {Aname: 'Card Name', cost: 7, color: 'yellow', now: 'gain 1 Credit per active grey die,\ngain 1 grey die', active: '', run: 'if you have > 5 active grey dice,\nlose this'},
    {Aname: 'Switch Hitter', cost: 4, color: 'orange', now: '', run: 'lose one non-grey die (not optional), gain feet = half the cost of that die'},
    {Aname: 'Card Name', cost: 7, color: 'yellow', now: 'if a green is active, lose it,\ngain 3 Move & 3 coin', run: 'gain a cube costing < that die'},
    {Aname: 'Card Name', cost: 4, color: 'brown', now: '', run: 'you may lose an active grey die, if you do: gain a grey die and 1 foot'},
    {Aname: 'Card Name', cost: 6, color: 'white', now: '', run: '+1 foot per active grey die; -1 foot per active green die'},
    {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
    {Aname: 'Card Name', cost: 1, color: '', now: '', run: ''},
  ];

  get mcolor() {
    return CubeCard.cmap[this.color] ?? 'pink';
  }
  get tcolor() {
    return (this.color == 'yellow' || this.color == 'white') ? 'DARKBLUE' : C.WHITE;
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
    white: 'rgb(240,240,240)',
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

  constructor(desc: CARD) {
    super(desc.Aname);
    const desc2 = { now: '', active: '', run: '', power: '', ...desc };
    this.color = desc.color;
    this.cost = desc.cost;
    this.now = desc2.now;
    this.active = desc2.active;
    this.run = desc2.run;
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
    const gridSpec = TileExporter.euroPoker;
    const h = gridSpec.cardh!;
    const bmImage = AliasLoader.loader.getBitmap(this.color, h); // scaled to fit cardh
    const bmBounds = bmImage.getBounds();
    const bmw = bmBounds?.width ?? 345;
    const { x, y, height, width } = this.baseShape.getBounds();
    const x0 = this.x0 = x + bmw;
    bmImage.x = x0-bmw/2; // put image.width at x0
    if (bmImage) {
      this.addChild(bmImage);
    }
    //
    const y0 = 0 - h * .36;
    const nameText = new CenterText(this.Aname, CubeCard.nameFont, this.tcolor);
    nameText.textAlign = 'left';
    nameText.y = y0;
    nameText.x = x0;
    const coin = this.makeCoin(x + width - 100, y0);
    this.addChild(nameText, coin); // titleName, not Tile.nameText
    this.addBoxes(y0 + nameText.getMeasuredLineHeight());
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
      const tbox = this.makeTitleBox(key.toUpperCase(), y0); // TextInRect
      this.addChild(tbox);
      y0 += tbox.getBounds().height;
      const cbox = this.makeContentBox(txt, y0);
      this.addChild(cbox);
      y0 += cbox.getBounds().height + ygap;
      return tbox;
    });
  }
  darken(color: string, dc = .8) {
    const rgb = C.nameToRgba(color);
    const darka = rgb.map(cv => Math.floor(cv * dc));
    const rgba = rgbaToName(darka, 1); // leave alpha at 1 for now
    return rgba;
  }

  /** darker, one-line, up case: NOW, ACTIVE, RUN, POWER-RUN */
  makeTitleBox(title = 'NOW', y = 0 ) {
    const bgColor = this.darken(this.mcolor, .8);
    const tText = new Text(`${title}              `, CubeCard.titleFont, this.tcolor);
    const box = new TextInRect(tText, { bgColor })
    box.y = y;
    box.x = this.x0;
    return box;
  }

  /** explanatory text */
  makeContentBox(text = 'do this...', y0 = 0) {
    const bgColor = this.darken(this.mcolor, .9);
    const cText = new Text(text, CubeCard.textFont, this.tcolor);
    const box = new TextInRect(cText, { bgColor })
    box.y = y0;
    box.x = this.x0 + 30;
    return box;
  }

  override paint(colorn?: string, force?: boolean): void {
    super.paint(this.mcolor, force);
    return;
  }
}


