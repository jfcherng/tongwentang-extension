import { createConverterMap, type Converter } from 'tongwen-core';
import { LangType, type DicObj, type SrcPack } from 'tongwen-core/dictionaries';
import type { PrefWord } from '../../preference/types/v2';
import { bgGetPref } from '../state/storage';

const getDict = async (dir: LangType, type: 'char' | 'phrase') => {
  return fetch(`dictionaries/${dir}-${type}.min.json`).then(async r => r.json() as Promise<DicObj>);
};

const createSrcPack = async ({ default: def, custom }: PrefWord): Promise<SrcPack> => {
  console.log(`createSrcPack: ${JSON.stringify(custom)}`);
  return Promise.all([
    def.s2t.char ? getDict(LangType.s2t, 'char') : {},
    def.s2t.phrase ? getDict(LangType.s2t, 'phrase') : {},
    def.t2s.char ? getDict(LangType.t2s, 'char') : {},
    def.t2s.phrase ? getDict(LangType.t2s, 'phrase') : {},
  ]).then(([ss, sp, ts, tp]) => ({ s2t: [ss, sp, custom.s2t], t2s: [ts, tp, custom.t2s] }));
};

let converter: Converter | undefined = undefined;
let queue: Promise<Converter> | undefined = undefined;

export const getConverter = async (): Promise<Converter> => {
  const pref = await bgGetPref();

  // dirty fix... because "getConverter" will be called multiple times
  // ideally, "converter" and "queue" should be only set to undefined when settings are updated
  if (pref.general.debugMode) {
    converter = undefined;
    queue = undefined;
  }

  return converter
    ? Promise.resolve(converter)
    : (queue ??
        (queue = createSrcPack(pref.word)
          .then(src => (converter = createConverterMap(src)))));
};
