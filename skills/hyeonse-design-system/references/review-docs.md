# Review or document

For review, inspect the rendered screen and its actual interactions. Rank findings by impact on task completion, readability, access, and consistency. Give an element, trigger, observed effect, and actionable correction. Distinguish an observed defect from a code-only suspicion and do not invent browser proof.

For component documentation, read the installed version's implementation and real call sites first. State purpose, when to use, public API, meaningful states, keyboard behavior, responsive behavior, and known limits. Include an example that compiles against that version's exported API. `v0.3.0` adds `Button`, `TextField`, `Checkbox`, and `Badge`; `v0.2.0` does not include them. Show native attributes and refs from the full declarations, since catalog `entry.props` lists only component-declared props. If an element is showcase markup or a local app pattern, label it accordingly.
