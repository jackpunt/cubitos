import { C } from "@thegraid/common-lib";
import type { CountClaz, Paintable } from "@thegraid/easeljs-lib";
import { AliasLoader, Tile } from "@thegraid/hexlib";
import { CardShape } from "./card-shape";

type CARD = { Aname: string, color: string, cost: number, now?: string, active?: string, run?: string };

export class CubeCard extends Tile  {
  static cards: CARD[] = [
    {Aname: 'card', cost: 4, color: 'green', now: '', active: 'If you would bust, use this: select 1 grey die from Roll Zone, set it to a face; you do not bust', run: 'lose the die you selected'},
    {Aname: 'card', cost: 8, color: 'orange', now: 'gain 1 foot per active grey die, use them immediately', active: '', run: 'if you have > 5 active grey dice, lose this'},
    {Aname: 'card', cost: 7, color: 'yellow', now: 'gain 1 credit per active grey die, gain 1 grey die', active: '', run: 'if you have > 5 active grey dice, lose this'},
    {Aname: 'Switch Hitter', cost: 4, color: 'orange', now: '', run: 'lose one non-grey die (not optional), gain feet = half the cost of that die'},
    {Aname: 'card', cost: 7, color: 'yellow', now: 'if a green is active, lose it, gain 3 feet & 3 coin', run: 'gain a cube costing < that die'},
    {Aname: 'card', cost: 4, color: 'brown', now: '', run: 'you may lose an active grey die, if you do: gain a grey die and 1 foot'},
    {Aname: 'card', cost: 6, color: 'white', now: '', run: '+1 foot per active grey die; -1 foot per active green die'},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
    {Aname: 'card', cost: 1, color: '', now: '', run: ''},
  ];

  // todo: map from canonical names to print colors
  /** color map: canonical name -> hmtl color code */
  static cmap = {
    red: 'red',
    orange: 'orange',
    yellow: 'yellow',
    green: 'green',
    blue: 'blue',
    magenta: 'magenta',
    brown: 'brown',
    white: 'white',
  }

  static allCards(): CountClaz[] {
    return CubeCard.cards.map((card: CARD) => [1, CubeCard, card]);
  }

  override get radius() { return 734 } // nextRadius

  color = 'white';
  cost = 2;
  now = '';
  active = '';
  run = '';
  power = '';
  image?: ImageBitmap;

  constructor(desc: CARD) {
    super(desc.Aname);
    const desc2 = { now: '', active: '', run: '', power: '', ...desc };
    this.color = desc.color;
    this.color = desc.color;
    this.cost = desc.cost;
    this.now = desc2.now;
    this.active = desc2.active;
    this.run = desc2.run;
    AliasLoader.loader.getImage(this.color);
    this.paint(this.color)
  }

  // invoked by constructor.super()
  override makeShape(): Paintable {
    return new CardShape('lavender', this.color, this.radius);
  }
  // TODO: put all the components on the canvas

  // background, with grey rhombus
  // image scaned from card (includes dice faces!)
  // Name
  // Cost (in dual circles)
  // [now], [active], [power-run], [run]
  addComponents() {
    //
  }

  override paint(colorn?: string, force?: boolean): void {
    super.paint(colorn, force);
    return;
  }
}


