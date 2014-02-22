var sch = {
  ab: 'abjuration',
  en: 'enchantment',
  ev: 'evocation',
  il: 'illusion',
  tr: 'transmutation'
};

var eff = {
  rf: 'reflect',
  dm: 'damage'
};



exports = module.exports = {
  /**
   *  Evocation spells
   */
  magicArrow: {
    school: sch.ev,
    cost: 2,
    minDamage: 3,
    maxDamage: 6,
    criticalChance: 0.05,
    effect: eff.dm
  },
  
  
  
  /**
   *  Abjuration spells
   */
  reflect: {
    school: sch.ab,
    cost: 1,
    minDefence: 0,
    maxDefence: 6,
    effect: eff.rf
  }
}