長らくテストとテスト容易設計を生業としてきましたが、最近は色々な限界を感じて形式手法に取り組んでいます。

この記事では、**既存の自動テストのどこに限界を感じてなぜ形式手法が必要なのか**の私見を説明します。



# お前誰よ

とあるテストマンです（[経歴](https://gist.github.com/Kuniwak/0d203a08dfe49220f5aaac65cf7e1745)）。最近はギョームで形式手法をやっています（他にも色々やっている）。



# 自動テストの限界
## 自動テストとは

私がここ数年悩んでいたことは、iOS や Web アプリのモデル層のバグを従来の自動テストで見つけられないことでした。ここでいう自動テストとは以下のようにテスト対象を実際に実行して結果を確認する方法を意図しています：

```javascript
// 自分で実装した add（と equals）で 1+1 が 2 になるかを検証する自動テスト。
describe('add', () => {
  context('when given 1 and 1', () => {
    it('should return 2', () => {
      const actual = add(ONE, ONE);

      const expected = TWO;
      assert(equals(actual, expected));
    });
  });
});
```

この例では自分で実装した `add` 関数の挙動を確認するために `equals(add(ONE, ONE), TWO)` の結果を検証しています。
ただ、足し算の動作確認として 1+1 だけを確認しても安心はできないですから、これに加えて別のテストケースを足していくことになります。

なあ、先に今回の話のポイントを提示しておくと、このように**「テストケースの追加」を続けていくとどのように考え方を変えなければならないか**ということです。



## テストケースの増加への対応

さて、1+1 以外のテストケースとして `add(1, 0) == 1` を検証しようとすると、次のように同じような単純なテストケース（[Single Condition Test](http://xunitpatterns.com/Principles%20of%20Test%20Automation.html)）を増やすことになるでしょう：

```javascript
describe('add', () => {
  context('when given 1 and 1', () => {
    it('should return 2', () => {
      const actual = add(ONE, ONE);

      const expected = TWO;
      assert(equals(actual, expected));
    });
  });

  // 別の入力を試したいならテストケースを分ける。
  context('when given 1 and 0', () => {
    it('should return 2', () => {
      const actual = add(ONE, ZERO);

      const expected = ONE;
      assert(equals(actual, expected));
    });
  });
});
```

<dl>
<dt>ここまでの流れ
<dd>単条件のテストケース追加
</dl>

これも悪くないですが、1つのテストケースを足すたびに8行ほどの記述が必要なのは少し辛いですね[^1]。そこで、この例のように複数のテストケースが入力値だけ異なるとき次のような共通化を図ります（[Parameterized Test](http://xunitpatterns.com/Parameterized%20Test.html)やTable Driven Testと呼ばれます）：

```javascript
describe('add', () => {
  [
    {lhs: ONE, rhs: ONE, expected: TWO },
    {lhs: ONE, rhs: ZERO, expected: ONE },
  ].forEach(({lhs, rhs, expected}) => {
    context(`(${lhs}, ${rhs})`, () => {
      it(`should return ${expected}`, () => {
        const actual = add(lhs, rhs);

        assert(equals(actual, expected));
      });
    });
  });
});
```

こうすると、新たなテストケースを足すのに必要な行数はたったの1行となり保守が楽になります。ここまでは自動テストでも余裕で対応できます。

<dl>
<dt>ここまでの流れ
<dd>単条件のテストケース追加 → Parameterized Test
</dl>

ところで、今回のテスト対象である足し算をきちんと実装できたと安心できるテストケースの数はどれぐらいでしょうか？少なくとも今回試した2つだけでは安心できないはずです。このようなときにテストマンがよく使う手法は「**同値分割**」と「**境界値分析**」です。これらはいずれも試さないといけない入力が大量にある状況を現実的な時間で対処するために入力を間引くための方法です。同値分割は出力が同じになる入力から代表値を選ぶという方法で入力を間引きますし、境界値分析では内部の条件分岐のちょうど境目付近を通過する入力はなるべく間引かない方法とも言い換えられるでしょう。

今回は厳密な同値分割はせず、ざっくり小さい値と大きな値から代表値をテストケースに加えるとしましょう。ついでに境界値になりそうな 0 も入れておきます：

```
describe('add', () => {
  [
    {lhs: ONE, rhs: ONE, expected: TWO }, // 小さい値と小さい値の組み合わせ
    {lhs: ONE, rhs: ZERO, expected: ONE },
    {lhs: ONE_MILLION, rhs: ONE, expected: ONE_MILLION_ONE }, // 大きい値と小さい値の組み合わせ
    {lhs: ONE, rhs: ONE_MILLION, expected: ONE_MILLION_ONE }, // 小さい値と大きい値の組み合わせ
    {lhs: ZERO, rhs: ZERO, expected: ZERO }, // 境界値になりそうな値
  ].forEach(({lhs, rhs, expected}) => {
    context(`(${lhs}, ${rhs})`, () => {
      it(`should return ${expected}`, () => {
        const actual = add(lhs, rhs);

        assert(equals(actual, expected));
      });
    });
  });
});
```

このように足せました！さらに慎重な方ならば、自然数型の最大値も境界値になりそうなのでこれも加えるでしょう（この例は簡単にするために最大値を設けていません）。

<dl>
<dt>ここまでの流れ
<dd>単条件のテストケース追加 → Parameterized Test → 同値分割・境界値分析
</dl>

さて、ここまで検査対象の入力を広げてきましたが、これなら安心できるでしょうか？以前の私であればこのあたりを現実的な安心のラインとして手を止めていました。実はこの判断は**「大抵のバグは入力空間の小さい部分を探すだけで見つかる」という小スコープ仮説[^2]を暗黙に仮定しています**。この例ではよっぽど妙な実装をしない限りは成り立つと感じますが、検査する対象によっては成り立たないこともあります（特に後述する並列システムなど）。ここでは説明を簡単に保つために、この仮説が足し算でも成り立たないとして話を進めます。

ということで、安心できるようになるまでテストケース数を増やしていきましょう。ただ、そろそろ手で追加してくるのが厳しくなってきたはずです。このような時にテストマンが使う方法は **[QuickCheck](https://hackage.haskell.org/package/QuickCheck) に代表される Property-based Testing です**。Property-based Testing ではこれまでの手法とは異なり入力をプログラマが指示しません。代わりに型や値の生成器が入力を自動的に大量に生成してくれます。

なんて便利なんだ！と思うかもしれませんが、実はここで**考え方の転換が必要になります**。今までのコードを思い出して欲しいのですが、自動テストでは期待する出力と実際の出力の比較という形で記述してきました：

```javascript
// これまでのコード
describe('add', () => {
  context('when given 1 and 1', () => {
    it('should return 2', () => {
      const actual = add(ONE, ONE); // プログラマが入力として 1, 1 を選び、

      const expected = TWO; // 期待する出力として 2 を指定する。
      assert(equals(actual, expected));
    });
  });
});
```

しかし、入力が自動生成されるのであれば期待する出力をどのように指定すればいいのでしょうか？

```javascript
// Property-based Testing のコード
describe('add', () => {
  context('when given X and Y', () => {
    it('should return a result same as result of Y and X', () => {
      const [x, y] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(x, y);

      const expected = '???'; // 期待する出力として ??? を指定する。
      assert(equals(actual, expected));
    });
  });
});
```

何となく考え方を転換しないといけない部分がわかってきたでしょうか。Property-based Testing では入力に対する具体的な出力を指定できないのです。代わりに **入力と出力の間で成り立つ関係を利用します**。例えば足し算は順序を変えても結果が同じはず（`x + y == y + x`）ですから、次のように引数の順序をひっくり返しても結果が同じになるといった指定をします：

```javascript
describe('add', () => {
  context('when given X and Y', () => {
    it('should return a result same as result of Y and X', () => {
      const [x, y] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(x, y);

      const expected = add(y, x); // 順序を反対にしても計算結果が変わらないことを確かめる。
      assert(equals(actual, expected));
    });
  });
});
```

これだけだと全く不十分ですから、次のように足し算の持つ様々な入出力の間の関係の検証も追加していきます：

```javascript
describe('add', () => {
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

  // ... 前の Parameterized Test も残しておくとより安心。
});
```

このようにして入力を自動生成すれば手で書いた時よりもずっと多くできるわけですから、より強い安心を得られるわけです。

**ただし代わりに失われたものもあります**。Parameterized Testまでは具体的な期待を書けたため深く考えなくてもよかったのですが、Property-based Testing では具体的な期待を書けなくなったためにより抽象度の高い「入力と出力の間の関係」を見抜かねばなりません。これには一定の訓練（後述）が必要です。

<dl>
<dt>ここまでの流れ
<dd>単条件のテストケース追加 → Parameterized Test → 同値分割・境界値分析 ——(入出力の具体性の壁)—→ Property-based Testing
</dl>

さて、実はこれでもまだテストケースは完全ではありません。自動生成された値は手で作られたよりもずっと大きいわけですが、それでも入力可能な値（自然数型の値すべて）よりはずっと小さいわけです。そして、ここから先が形式手法の世界になってきます。

今回の `add` の実装が次のようだったとします：

```javascript
class Zero {}


class Suc {
    constructor(nat) {
        this.v = nat;
    }
}


function add(a, b) {
  if (b instanceof Zero) {
    return a;
  }
  return new Suc(add(a, b.v))
}


function equals(a, b) {
  if (a instanceof Suc && b instanceof Suc) {
    return equals(a.v, b.v);
  }
  return a instanceof Zero && b instanceof Zero;
}
```





[^1]: 実際は1つのテストケースで複数の入力を連続して試すコードも多く見受けられますが、これは [Eager Test](http://xunitpatterns.com/Assertion%20Roulette.html)と呼ばれるアンチパターンです。2つの点で最初の方で assertion が失敗すると後続の検証が実行されず、テスト失敗の情報量が少なくなるからです。他にも、複数の入力を1つのテストケースでまとめてしまうとテストケースの名前が曖昧になります（テストの意図を推測する上で重要な情報が失われる）。なので、この記事のように1つの試したい入力に対して1つのテストーケースが対応するようにしましょう。
[^2]: https://pdfs.semanticscholar.org/0c6d/97fbc3c753f59e7fb723725639f1b18706bb.pdf
