import { C, stime, type Constructor } from '@thegraid/common-lib';
import { makeStage, type NamedObject } from '@thegraid/easeljs-lib';
import { AliasLoader, GameSetup as GameSetupLib, Hex2, HexMap, LogWriter, MapCont, Player, Player as PlayerLib, Scenario as Scenario0, TP, TP as TPLib, type GamePlay, type Hex, type HexAspect, type ScenarioParser, type SetupElt, type Table } from '@thegraid/hexlib';
// import { CardShape } from './card-shape';

import { TileExporter } from './tile-exporter';

/** returns an Array filled with n Elements: [0 .. n-1] or [dn .. dn+n-1] or [f(0) .. f(n-1)] */
export function arrayN(n: number, nf: number | ((i: number) => number) = 0) {
  const fi = (typeof nf === 'number') ? (i: number) => (i + nf) : nf;
  return Array.from(Array(n), (_, i) => fi(i))
}

type Params = Record<string, any>; // until hexlib supplies
export interface Scenario extends Scenario0 {
  nPlayers?: number;
};

/** initialize & reset & startup the application/game. */
class ColGameSetup extends GameSetupLib {
  declare table: Table;
  declare gamePlay: GamePlay;
  declare scenarioParser: ScenarioParser;
  declare startupScenario: SetupElt;

  /** current/most-recent GameSetup running with a canvasId. */
  static gameSetup: GameSetup;
  constructor(canvasId?: string, qParam?: Params) {
    super(canvasId, qParam)
  }

  tileExporter = new TileExporter(); // enable 'Make Pages' buttons

  override initialize(canvasId: string): void {
    if (canvasId) GameSetup.gameSetup = this;
    // for hexmarket to bringup their own menus:
    window.addEventListener('contextmenu', (evt: MouseEvent) => evt.preventDefault())
    console.log(stime(this, `---------------------   GameSetup.initialize  ----------------`))
    super.initialize(canvasId)
    return;
  }

  override loadImagesThenStartup() {
    AliasLoader.loader.fnames = [];
    super.loadImagesThenStartup();    // loader.loadImages(() => this.startup(qParams));
  }

  override startup(scenario: Scenario): void {
    // ColCard.nextRadius = CardShape.onScreenRadius; // reset to on-screen size
    super.startup(scenario)
  }

  update() {
    const hexCont = this.hexMap.mapCont?.hexCont;
    hexCont?.cacheID && hexCont.updateCache()  // when toggleText: hexInspector
    hexCont?.stage?.update();
  }

  /** compute nRows & nCols for nPlayers; set TP.nHexes = nr & TP.mHexes = nc */
  setRowsCols(np = TP.numPlayers) {
    let nr = TP.nHexes, nc = TP.mHexes;
    let tc = 0;
    TP.setParams({ nHexes: nr, mHexes: nc, }, false, TPLib)
    TP.setParams({ cardsInPlay: tc }, false, TP)
    return [nr, nc] as [nr: number, nc: number];
  }

  override makeHexMap(
    hexMC: Constructor<HexMap<Hex>> = HexMap,
    hexC: Constructor<Hex> = Hex2, // (radius, addToMapCont, hexC, Aname)
    cNames = MapCont.cNames.concat() as string[], // the default layers
  ) {
    const [nr] = this.setRowsCols();
    // set color of 'hex' for each row (district); inject to HexMap.distColor
    const dc = arrayN(nr).map(i => C.grey224);
    HexMap.distColor.splice(0, HexMap.distColor.length, ...dc);
    const hexMap = super.makeHexMap(hexMC, hexC, cNames); // hexMap.makeAllHexes(nh=TP.nHexes, mh=TP.mHexes)
    return hexMap;
  }

  // override makeTable(): ColTable {
  //   return new ColTable(this.stage);
  // }

  // override makeGamePlay(scenario: Scenario): GamePlay {
  //   return new GamePlay(this, scenario); // sure, we could specialize here (recordMeep)
  // }

  override makePlayer(ndx: number, gamePlay: GamePlay) {
    return new Player(ndx, gamePlay);
  }

  override resetState(stateInfo: Scenario & HexAspect): void {
    const n = stateInfo.nPlayers ?? `${TP.numPlayers}`;   // convert {nPlayers: 3} --> {n: 3}
    this.qParams = { ...this.qParams, n };  // qParams from ng is readonly
    super.resetState(stateInfo);
  }

  override startScenario(scenario: Scenario0) {
    const gp = super.startScenario(scenario)
    return gp
  }
}

export class GameSetup extends ColGameSetup {

}
