const assert = require('assert');
const {describe, it} = require('mocha');
const context = describe;
const {ZERO, ONE, TWO, ONE_MILLION, ONE_MILLION_ONE, equals, add} = require('./nat');


describe('add', () => {
  [
    {lhs: ONE, rhs: ONE, expected: TWO}, // 小さい値と小さい値の組み合わせ
    {lhs: ONE, rhs: ZERO, expected: ONE},
    {lhs: ONE_MILLION, rhs: ONE, expected: ONE_MILLION_ONE}, // 大きい値と小さい値の組み合わせ
    {lhs: ONE, rhs: ONE_MILLION, expected: ONE_MILLION_ONE}, // 小さい値と大きい値の組み合わせ
    {lhs: ZERO, rhs: ZERO, expected: ZERO}, // 境界値になりそうな値
  ].forEach(({lhs, rhs, expected}) => {
    context(`(${lhs}, ${rhs})`, () => {
      it('should return 2', () => {
        const actual = add(lhs, rhs);

        assert(equals(actual, expected));
      });
    });
  });


  context('when given X and Y', () => {
    it('should return a result same as result of Y and X', () => {
      const [x, y] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(x, y);

      const expected = add(y, x); // 引数の順序を反対にしても計算結果が変わらないこと（交換法則）を確かめる。
      assert(equals(actual, expected));
    });
  });

  context('when given (X and Y) and Z', () => {
    it('should return a result same as result of X and (Y and Z)', () => {
      const [x, y, z] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(add(x, y), z);

      const expected = add(x, add(y, z)); // 計算する順序を変えても結果が変わらないこと（結合法則）を確かめる。
      assert(equals(actual, expected));
    });
  });

  context('when given X and 0', () => {
    it('should return X', () => {
      const [x] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(x, ZERO);

      const expected = x; // 0 と足しても元の数字と同じになること（単位元の存在）を確かめる。
      assert(equals(actual, expected));
    });
  });

  context('when given X', () => {
    it('should return something not equal X itself', () => {
      const [x] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(x, ONE);

      const unexpected = x; // 1を足せば結果はXとは異なることを確かめる。
      assert(!equals(actual, unexpected));
    });
  });
});


function valuesGen() {
  return [valueGen(), valueGen(), valueGen()];
}


function valueGen() {
  const values = [
    ZERO,
    ONE,
    TWO,
    ONE_MILLION,
    ONE_MILLION_ONE,
  ];

  switch (Math.floor(values.length * Math.random())) {
    case 0:
      return ZERO;
    case 1:
      return ONE;
    case 2:
      return TWO;
    case 3:
      return ONE_MILLION;
    case 4:
      return ONE_MILLION_ONE;
  }
}
