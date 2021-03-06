theory NatJS imports Main begin

datatype nat = Zero | Succ nat


primrec add :: "nat \<Rightarrow> nat \<Rightarrow> nat" where
  "add a Zero = a"
| "add a (Succ b) = add (Succ a) b"


lemma [simp]: "x = add x Zero"
  by auto


theorem "\<forall>x. add x Zero = x"
  by auto


lemma [simp]: "\<forall>x. add (Succ x) y = Succ (add x y)"
  apply(induct_tac y)
  by auto


lemma add_assoc: "\<forall> x y. add (add x y) z = add x (add y z)"
  apply(induct_tac z)
  by auto


lemma add_comm: "add a b = add b a"
  apply(induct_tac b)
  apply(auto)
  apply(induct_tac a)
  by auto


theorem "\<forall> x y. add x y = add y x"
  apply(intro allI)
  by (rule add_comm)


theorem "\<forall> x y z. add (add x y) z = add x (add y z)"
  apply(intro allI)
  by (rule add_assoc[rule_format])