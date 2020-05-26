長らく自動テストとテスト容易設計を生業としてきましたが、最近は色々な限界を感じて形式手法に取り組んでいます。

この記事では、**既存の自動テストのどこに限界を感じてなぜ形式手法が必要なのか**の私見を説明します。なお、私もまだ完全理解には程遠いため間違いがあるかもしれません。ご指摘やご意見はぜひ [Kuniwak](https://twitter.com/orga_chem) までいただけると嬉しいです。



# お前誰よ

とあるテストマンです（[経歴](https://gist.github.com/Kuniwak/0d203a08dfe49220f5aaac65cf7e1745)）。最近はギョームで形式手法をやっています（他にも色々やっている）。



# 自動テストの限界
## 自動テストとは

私がここ数年悩んでいたことは、iOS や Web アプリなどのモデル層のバグを従来の自動テストで見つけられないことでした。ここでいう自動テストとは以下のようにテスト対象を実際に実行して結果を確認する方法を意図しています：

```javascript
// 自分で実装した add で 1+1 が 2 になるかを検証する自動テスト。
describe('add', () => {
  context('when given 1 and 1', () => {
    it('should return 2', () => {
      const actual = add(ONE, ONE);

      const expected = TWO;
      assert.deepStrictEqual(actual, expected);
    });
  });
});
```

この例では自分で実装した `add` 関数の挙動を確認するために `add(ONE, ONE)` の結果が `TWO` と等しくなることを検証しています。
ただ、足し算の動作確認として 1 + 1 だけを確認しても安心はできないですから、これに加えて別のテストケースを足していくことになります。

なお、先に今回の話の前半のポイントを提示しておくと、このように**「テストケースの追加」を続けていくとどのように考え方を変えなければならないか**ということです。



## テストケース増加への対応の限界

さて、1 + 1 = 2 以外のテストケースとして 1 + 0 = 1 を検証しようとすると、次のように同じような単純なテストケース（[Single Condition Test](http://xunitpatterns.com/Principles%20of%20Test%20Automation.html)）を増やすことになるでしょう：

```javascript
describe('add', () => {
  context('when given 1 and 1', () => {
    it('should return 2', () => {
      const actual = add(ONE, ONE);

      const expected = TWO;
      assert.deepStrictEqual(actual, expected);
    });
  });

  // 別の入力を試したいならテストケースを分ける。
  context('when given 1 and 0', () => {
    it('should return 1', () => {
      const actual = add(ONE, ZERO);

      const expected = ONE;
      assert.deepStrictEqual(actual, expected);
    });
  });
});
```

<dl>
<dt>ここまでの流れ
<dd>単条件のテストケース追加
</dl>

これも悪くないですが、1つのテストケースを足すたびに8行ほどの記述が必要なのは少し辛いですね[^1]。そこで、この例のように複数のテストケースが入力値だけ異なるとき次のような共通化を図ります（[Parameterized Test](http://xunitpatterns.com/Parameterized%20Test.html)やTable Driven Testと呼ばれる）：

```javascript
describe('add', () => {
  [
    {lhs: ONE, rhs: ONE, expected: TWO },
    {lhs: ONE, rhs: ZERO, expected: ONE },
  ].forEach(({lhs, rhs, expected}) => {
    context(`(${lhs}, ${rhs})`, () => {
      it(`should return ${expected}`, () => {
        const actual = add(lhs, rhs);

      assert.deepStrictEqual(actual, expected);
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

ところで、今回のテスト対象である足し算をきちんと実装できたと安心できるテストケースの数はどれぐらいでしょうか？少なくともいま試した2つだけでは安心できないはずです。このようなときにテストマンがよく使う手法は「**同値分割**」と「**境界値分析**」です。これらはいずれも試さないといけない入力が大量にある状況を現実的な時間で対処するために入力を間引くための方法です。同値分割は出力が同じになる入力から代表値を選ぶという方法で入力を間引きますし、境界値分析では内部の条件分岐のちょうど境目付近を通過する入力はなるべく間引かない方法とも言い換えられるでしょう。

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

        assert.deepStrictEqual(actual, expected);
      });
    });
  });
});
```

このように足せました！さらに慎重な方ならば、自然数型の最大値も境界値になりそうなのでこれも加えるでしょう（この例は簡単にするために最大値を設けていない）。

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
      assert.deepStrictEqual(actual, expected);
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
      assert.deepStrictEqual(actual, expected);
    });
  });
});
```

何となく考え方を転換しないといけない部分がわかってきたでしょうか。Property-based Testing では入力に対する具体的な期待出力を指定できないのです。代わりに **入力と出力の間で成り立つ関係を利用します**。例えば足し算は順序を変えても結果が同じはず（`x + y = y + x`）ですから、次のように引数の順序をひっくり返しても結果が同じになるといった指定をします：

```javascript
describe('add', () => {
  context('when given X and Y', () => {
    it('should return a result same as result of Y and X', () => {
      const [x, y] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(x, y);

      const expected = add(y, x); // 順序を反対にしても計算結果が変わらないことを確かめる。
      assert.deepStrictEqual(actual, expected);
    });
    // 実際にはこれを大量に繰り返す。
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
      assert.deepStrictEqual(actual, expected);
    });
  });

  context('when given (X and Y) and Z', () => {
    it('should return a result same as result of X and (Y and Z)', () => {
      const [x, y, z] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(add(x, y), z);

      const expected = add(x, add(y, z)); // 計算する順序を変えても結果が変わらないこと（結合法則）を確かめる。
      assert.deepStrictEqual(actual, expected);
    });
  });

  context('when given X and 0', () => {
    it('should return X', () => {
      const [x] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(x, ZERO);

      const expected = x; // 0 と足しても元の数字と同じになること（単位元の存在）を確かめる。
      assert.deepStrictEqual(actual, expected);
    });
  });

  context('when given X', () => {
    it('should return something not equal X itself', () => {
      const [x] = valuesGen(/* 値の生成器が自動的に何らかの自然数を選ぶので、*/);
      const actual = add(x, ONE);

      const unexpected = x; // 1を足せば結果はXとは異なることを確かめる。
      assert.deepStrictEqual(actual, expected);
    });
  });

  // 実際にはそれぞれを大量に繰り返す。

  // 前の Parameterized Test も残しておくとより安心。
});
```

このようにして入力を自動生成すれば手で書いた時よりもずっと多くできるわけですから、より強い安心を得られるわけです。

**ただし代わりに失われたものもあります**。Parameterized Testまでは具体的な期待を書けたため深く考えなくてもよかったのですが、Property-based Testing では具体的な期待を書けなくなったためにより抽象度の高い「入力と出力の間の関係」を見抜かねばなりません。これには一定の訓練が必要です。

<dl>
<dt>ここまでの流れ
<dd>単条件のテストケース追加 → Parameterized Test → 同値分割・境界値分析 → (入出力の具体性の壁) → Property-based Testing
</dl>

さて、実はこれでもまだテストケースは完全ではありません。自動生成された値は手で作られたよりもずっと大きいですが、それでも**入力可能な値（自然数型の値すべて）よりはずっと小さい**のです。ただ、自然数の例では前述の小スコープ仮説（大抵のバグは入力空間の小さい部分を探すだけで見つかる）が成り立つでしょうから、きっと入力すべての動作確認は不必要に思えるでしょう。しかし後述する並行システムでは小スコープ仮説が成り立たないことが多く、したがって網羅性は依然として重要なのです。そのためもう少し網羅性の話を続けます。

なお、これまでの手法の延長線上で入力を網羅的に扱う方法として、網羅的な入力が可能なレベルまで入力可能な値の数を減らす方法があります。自然数の例でいうと利用したい最大の自然数がそこまで大きくないのであれば、最大値を設けてそこまでの入力すべてを網羅的に検証する方法をとれます（この考え方は後述する並行システムでも重要）。ここまできて、ようやく従来の方法の延長線上でも網羅的な動作確認が可能になりました。

<dl>
<dt>ここまでの流れ
<dd>単条件のテストケース追加 → Parameterized Test → 同値分割・境界値分析 → (入出力の具体性の壁) → Property-based Testing → (網羅性の壁) → 可能なら入力空間の制限
</dl>

ただしこの方法は入力を絞れるときのみ使える方法だったことを思い出してください。仕様によってはこれが適用できないことも少なく、特に並行システムにおいてはこの方法をとってもなお入力空間が広すぎる場合が頻繁におきえます。

そして、ここから先こそが形式手法の力を借りないといけない世界なのです。

<dl>
<dt>ここまでの流れ
<dd>単条件のテストケース追加 → Parameterized Test → 同値分割・境界値分析 → (入出力の具体性の壁) → Property-based Testing → (網羅性の壁) → 可能なら入力空間の制限 → (扱える入力空間の大きさの壁) →形式手法（？？？）
</dl>



## 網羅性への挑戦

ここから先は、Isabelle という定理証明支援系のシステムを駆使して検査したい対象の入力すべてに対して性質を確認します。ただ、このように説明されてもなかなか飲み込めないと思いますので、もう少し自然数の例を続けていきます。

さて、今回の `add` の実装が次のようだったとします：

```javascript
// add 関数の入力値は Zero または Succ のいずれか。Zero は 0 を意味し、Succ はパラメータの自然数を +1 した自然数を表現する。
// つまり、new Succ(new Zero()) は 0 + 1 なので 1 を意味し、new Succ(new Succ(new Zero())) は (0 + 1) + 1 なので 2 を意味する。
class Zero {}
class Succ {
    constructor(nat) { this.v = nat }
}


function add(a, b) {
  // もし b が 0 なら a が結果（a + 0 = a ということ）。
  if (b instanceof Zero) {
    return a;
  }

  // もし b が 0 でなければ b の Succ 前の値（b - 1）と a に対して再帰的に add を呼び出して、
  // 最後に全体として +1 する（つまり (a + (b - 1)) + 1 = a + b ということ）。
  // こうすると、最終的に b が 0 になるまで再帰的に add が繰り返され、b が 0 になった時点の
  // 結果で再帰が停止して b の自然数の回数分 +1 して値が戻ってくる。
  return new Succ(add(a, b.v));
}
```

厳密な対応はさておき[^3]、上の JavaScript のコードは次の Isabelle での表現と対応するとしましょう：

```isabelle
(* JavaScript の Zero と Succ のクラスに対応する型を nat として定義する。 *)
datatype nat = Zero | Succ nat

(* add は JavaScript の add と同じ再帰的な定義とする。 *)
primrec add :: "nat =>> nat => nat" where
  "add a Zero = a"
| "add a (Succ b) = Succ (add a b)"
```

Isabelle ではこのように記述された定義に対して Property-based Testing での検証と似た「証明」が可能です。Isabelle で記述されたコードは、数学の証明のように論理的な推論によって結果がどうなるかを推測できるためです。なお、この方法でも Property-based Testing と同様に入出力の間で成り立つ関係を使います。

例えば、前の Property-based Testing で検証した `x + 0 = x` は次のように Isabelle で記述でき、しかも今回は全自動で証明できます（Isabelle は自動的な証明に優れている）：

```isabelle
(* すべての自然数 x について x + 0 = x が成り立つことを証明する。 *)
theorem "∀x. add x Zero = x"
  by auto (* 自動での証明を指示（自動で解ける）。 *)
```

この証明が成功するということは、**どんな自然数 `x` であっても `x + 0 = 0` を満たす** と確認できたことを意味します。ここで重要なのは「どんな自然数でも」という部分で、今回は自然数の定義の上限を与えていませんからとてつもなく大きな自然数であってもこれが成り立つのです[^4]。

しかしおそらくこれでは実感が湧かないと思うので、試しに `add` の定義をわざと間違えてどうなるかを見てみましょう：

```
primrec add :: "nat ⇒ nat ⇒ nat" where
  "add a Zero = Zero" (* わざと間違えてみる *)
| "add a (Succ b) = Succ (add a b)"
```

この状態で、先ほどの `x + 0 = x` を証明しようとすると証明は失敗します：

```
(* すべての自然数 x について x + 0 = x が成り立つことを証明する。 *)
theorem "∀x. add x Zero = x"
  by auto (* 自動での証明を指示（失敗する）。 *)

(* Isabelle の出力：
  theorem add_iden: ?x = add ?x Zero
  Failed to finish proof⌂:
  goal (1 subgoal):
   1. x = Zero
*)
```

よくみると `subgoal: x = 0` という出力になっています。これはどんな自然数 `x` に対しても `x = 0` が成立するなら上記の間違った定義でも証明できると Isabelle が教えてくれています。要するに `x` が 0, 1, 2, 3, ... のいずれでも `x = 0` が成立すれば証明できるということですが、`x` が 0 以外については `x = 0` が成立するとまずいわけですから、どこかで間違えたとわかるのです。このように Isabelle は証明したいことがらを論理的な推論によって証明できる極めて強力な手段となります。

また、次のように `x + 0 = x` の例以外の性質もほぼ自動で証明できます（一部は人間の手で補題を切り出してヒントを与えている）：

```isabelle
lemma add_iden [simp]: "x = add x Zero"
  by auto


lemma add_assoc: "add (add x y) z = add x (add y z)"
  apply(induct_tac z)
  by auto


(* 自動推論のための手がかりを与えるための補題。 *)
lemma [simp]: "Succ (add x y) = add (Succ x) y"
  apply(induct_tac y)
  by auto


lemma add_comm: "add x y = add y x"
  apply(induct_tac y)
  apply(auto)
  apply(induct_tac x)
  by auto


theorem "∀ x y. add x y = add y x"
  apply(intro allI)
  by (rule add_comm)


theorem "∀ x y z. add (add x y) z = add x (add y z)"
  apply(intro allI)
  by (rule add_assoc)
```

まとめると、ここでは定理証明支援系を使えば入力空間を制限できない状況であっても網羅的な検査ができるとわかりました。なお、これ以外の例でよりパターン数が多い状況でも Isabelle は高い威力を発揮できると知られています（[ケプラー予想](https://ja.wikipedia.org/wiki/%E3%82%B1%E3%83%97%E3%83%A9%E3%83%BC%E4%BA%88%E6%83%B3)の形式証明に Isabelle が使われた例が参考になる）。

<dl>
<dt>ここまでの流れ
<dd>単条件のテストケース追加 → Parameterized Test → 同値分割・境界値分析 → (入出力の具体性の壁) → Property-based Testing → (網羅性の壁) → 可能なら入力空間の制限 → (扱える入力空間の大きさの壁) → 定理証明支援系による形式検証
</dl>



## 現実的な例

ここまでの例では、説明を簡単にするため極めて単純化された非現実的な例を扱ってきました。そこでここからは現実的に形式手法が必要になる状況を説明していきます。

私がこれまで悩んできたのは、iOS アプリや Web アプリにおいて多用する協調して動作する状態機械のバグを従来の自動テストで見つけられないことでした。iOS アプリに限らず、何らか状態をもつオブジェクトは状態機械として設計しておくと状態の大局観の把握が楽になります。そのため、状態機械は頻出の設計パターンとなります（具体的にどのようなコードになるかは [Kuniwai/reversi-ios](https://github.com/Kuniwak/reversi-ios) を参照）。なお、これらの状態機械には状態が変わったことを監視できるイベントストリームを用意しておいて、View はここから変更を検知して見た目を変更するように構成します。

さて、これが単純な状態機械ただ1つなら話は簡単でした。問題は現実的なアプリは小さな状態機械1つでは表現できないため、小さな状態機械を複数組み合わせる必要があるという点です（この方法は一般的に [Hierarchal Finite State Machine](https://web.stanford.edu/class/cs123/lectures/CS123_lec08_HFSM_BT.pdf) として知られている）。

一般に、このような **並列動作する状態機械の組み合わせの検証に必要なテストケース数は人間の想像を超えてきます** 。例えば、次の図は[とあるイベント](https://swift-tweets.connpass.com/event/171382/)で実装したアプリの状態機械全体の状態遷移図です（全部載り切らないのでごく一部）：

[[f:id:devorgachem:20200524132128p:plain]](https://github.com/Kuniwak/reversi-ios/blob/master/img/total-state-diagram.svg)

この図を一見しただけで、Property-based Testing を含む従来のいずれの方法もほぼ無力だとわかると思います。なお、この中のごくわずかな部分にバグが潜んでいて、実際に今回のリバーシアプリでもアニメーションに一貫性のないバグが後から見つかりました。この原因はイベントストリームの購読者が2ついることに気づいておらずしかも購読者の呼び出し順序が期待と違っていたことが原因でした（この図の中のいずれかの遷移に想定外の遷移がたった1つあったのが原因）。

この話を一般化すると、よく並行並列システム（特にマルチスレッドプログラミング）の開発が難しいと言われるのは、この膨大な数の組み合わせのなかのごくわずかな部分にデッドロックや無限ループなどの欠陥が潜んでいることに人間が気づけないからです。そして、これまで見てきたように、膨大の入力の組み合わせ数があるとき自動テストを含む動的検査は無力です。だから形式手法が重要になるのです。

なお上記のアプリについては、今回紹介した定理証明支援系とは別の形式手法である「モデル検査[^5]」を試みました（[詳細](https://github.com/Kuniwak/reversi-ios#%E6%95%99%E8%A8%93%E3%83%86%E3%82%B9%E3%83%88%E5%AE%B9%E6%98%93%E8%A8%AD%E8%A8%88%E3%81%8B%E3%82%89%E3%83%A2%E3%83%87%E3%83%AB%E6%A4%9C%E6%9F%BB%E5%AE%B9%E6%98%93%E8%A8%AD%E8%A8%88%E3%81%B8)）。モデル検査は並列システムの網羅的な検証を得意としていて、私の悩みを解決できる有力な手段の1つです。このモデル検査も巨大な状態遷移グラフを扱う際には具体的な入出力を指示できないため、これまで同様に抽象的にものごとを捉えなければならない点は共通しています。



## テストケースの増加につれ起こったこと

これまでの流れを少し振り返りましょう。自然数の足し算を例にテストケースの数が増えるにつれ次の箇条書きリストの下の方へ手法が移り変わってたことを見てきました：

<ol>
<li>単条件のテストケース追加
<li>Parameterized Test
<li>同値分割・境界値分析
<li><strong>──(入出力の具体性の壁)──</strong>
<li>Property-based Testing
<li><strong>──(網羅性の壁)──</strong>
<li>可能なら入力空間の制限
<li>モデル検査
<li><strong>──(扱える入力空間の大きさの壁)──</strong>
<li>定理証明支援系による形式検証
</ol>

要するに、**下の方の手段である形式手法（8と9）は膨大な量のテストケースを現実的な記述量で表現するための方法です**。そのため抽象度が上がってしまい捉えづらくなってしまうということなのでしょう。

このような事情も相まって、形式手法を上手に扱うのにはかなりの知識が必要です。実際に取り組んでみるとわかるのですが、まず人間は意図通りの論理式やモデルを書けません（必要な条件を忘れていたりそもそも意図が間違ってたりする）。当たり前の話ですが、**従来のコードでさえ正しく書けないのに、より抽象度の高い論理式やモデルを最初から正しく書けるはずがないのです**。

したがって形式手法においても自分の記述したモデルや論理式が自分の意図通りになっているか確かめる作業は避けて通れません。だからこそ、Isabelle や他の形式手法系のツールが何を言っているのかを理解するための数理論理学の学習や基礎理論への理解がとても重要になります。さらに、このような知識とは別に TDD のようにこまめに論理式やモデルをこまめに確認できるよう準備しておくといった進め方のノウハウも重要になります（[ノウハウの例](https://www.slideshare.net/dena_tech/dena-techcon-2020-230372486/119)）。

私もまだまだ知識は足らないですが、以前とは異なり今は次のステップが見えるようになりました。あとは一歩づつ進んでくだけだと思っていて、今も形式手法を学びつつ実践に取り組んでいます。



# まとめ

この記事では、以下の3点を説明しました：

1. テストケースの増加につれ従来の自動テストに限界が訪れる
2. 現実の設計で頻出する状態機械の合成はこの限界を超えてくる
3. これに対応できる手段が形式手法である

この記事をきっかけに、私のように形式手法に興味をもつテストマンが増えるといいなあぁと思っています。


[^1]: 実際は1つのテストケースで複数の入力を連続して試すコードも多く見受けられますが、これは [Eager Test](http://xunitpatterns.com/Assertion%20Roulette.html)と呼ばれるアンチパターンです。2つの点で最初の方で assertion が失敗すると後続の検証が実行されず、テスト失敗の情報量が少なくなるからです。他にも、複数の入力を1つのテストケースでまとめてしまうとテストケースの名前が曖昧になります（テストの意図を推測する上で重要な情報が失われる）。なので、この記事のように1つの試したい入力に対して1つのテストーケースが対応するようにしましょう。
[^2]: [Andoni, Alexandr; Daniliuc, Dumitru; Khurshid, Sarfraz; Marinov, Darko (2002). "Evaluating the small scope hypothesis"](https://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.8.7702)
[^3]: ここで厳密な対応への言及を避けたのは JavaScript の形式化された意味論が必要だからです。意味論が形式的に定められた処理系（例えば [KJS](https://github.com/kframework/javascript-semantics)）以外では、Isabelle での表現と本当に対応しているのかどうかを検証（証明）するのはとても大変です。
[^4]: 元の JavaScript のコードは末尾再帰の最適化がなければ 1000 程度の自然数で stack overflow でエラーになりえます。重要なのは JavaScript のコードと Isabelle のコードの対応関係で、このように再帰が深くなる場合に対応関係が崩れるため証明の結果と実際の JavaScript での実行結果が一致しません。もしこれを含めた検証をしたければ、このような JavaScript の振る舞いを形式的に定義した意味論に踏み込む必要がありますが、今回は説明を簡単にするためにこれを避けています。
[^5]: モデル検査の定義を説明するのはとても大変なので、定義を知りたい方は「[モデル検査入門](http://www.kurims.kyoto-u.ac.jp/~cs/lecture2009/lecture09ModelChecking.pdf)」などを読むといいかもしれません。
