theory NatJS imports Main begin

datatype nat = Zero | Succ nat

primrec add :: "nat \<Rightarrow> nat \<Rightarrow> nat" where
  "add a Zero = a"
| "add a (Succ b) = Succ (add a b)"


lemma add_iden [simp]: "x = add x Zero"
  by auto


lemma add_assoc: "add (add x y) z = add x (add y z)"
  apply(induct_tac z)
  by auto


lemma [simp]: "Succ (add x y) = add (Succ x) y"
  apply(induct_tac y)
  by auto


lemma add_comm: "add a b = add b a"
  apply(induct_tac b)
  apply(auto)
  apply(induct_tac a)
  by auto


theorem "add x y = add y x"
  by (rule add_comm)


theorem "add (add x y) z = add x (add y z)"
  by (rule add_assoc)


theorem "add x (Succ Zero) \<noteq> x"
  apply(induct_tac x)
  by auto