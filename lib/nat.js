class Zero {
  toString() { return `0` }
}


class Suc {
    constructor(nat) {
        this.v = nat;
    }

    toString() {
      return eval(`${this.v.toString()} + 1`);
    }
}


const ZERO = new Zero();
const ONE = new Suc(ZERO);
const TWO = new Suc(ONE);

const ONE_MILLION = (() => {
  let result = ZERO;
  for (let i = 0; i < 1000; i++) {
    result = new Suc(result);
  }
  return result;
})();

const ONE_MILLION_ONE = new Suc(ONE_MILLION);


function equals(a, b) {
  if (a instanceof Suc && b instanceof Suc) {
    return equals(a.v, b.v);
  }
  return a instanceof Zero && b instanceof Zero;
}


function add(a, b) {
  if (b instanceof Zero) {
    return a;
  }
  return new Suc(add(a, b.v))
}


module.exports = {
  ZERO: ZERO,
  ONE: ONE,
  TWO: TWO,
  ONE_MILLION: ONE_MILLION,
  ONE_MILLION_ONE: ONE_MILLION_ONE,
  add: add,
  equals: equals,
}
