# DATA STRUCTURES AND ALGORITHMS – ECCI 3104

## ANSWERS IN ACRONYM & MNEMONIC FORMAT

---

### **QUESTION ONE – QUICK REFERENCE GUIDE**

**1a) Algorithm Complexity (Importance: PEC)**

- **P**erformance Prediction
- **E**fficiency Comparison
- **C**omputational Resource Management

**1b) PUSH Flowchart (Steps: C-I-P-C)**

1.  **C**heck if stack is full (Overflow?).
2.  **I**ncrement the TOP pointer.
3.  **P**lace new element at `S[TOP]`.
4.  **C**onfirm operation success.

**1c) Binary Tree (Distinctions: DH / CB)**

- **D**epth: Distance from **R**oot.
- **H**eight: Longest path to a **L**eaf.
- **C**omplete Tree: All levels full, last level **L**eft-packed.
- **B**alanced Tree (e.g., AVL): **H**eight difference ≤ 1 for **A**ny node.

**1d) Data Structure Selection (Factors: NORT)**

1.  **N**ature of the data (Linear, Hierarchical, Networked).
2.  **O**perations required (Search, Insert, Delete, Traverse).
3.  **R**untime constraints (Time Complexity: Best/Avg/Worst-case).
4.  **T**hroughput & Memory (Space Efficiency).

**1e) BFS vs. DFS (Memory Use & Structure)**

- **BFS**: Uses a **Q**ueue. **L**evel order. High memory (**W**ide).
- **DFS**: Uses a **S**tack. **D**epth first. Lower memory (**D**eep).

**1f) Find Largest Program (Steps: I-D-F)**

1.  **I**nput 10 values into array.
2.  **D**isplay the entered values.
3.  **F**ind largest via linear scan.

---

### **QUESTION TWO – SORTING SNAPSHOT**

**2a) In-Place vs. Out-of-Place (Keywords)**

- **In-Place**: **M**odifies original, **L**ow extra space (Bubble, Selection, Heap).
- **Out-of-Place**: **C**reates copy, **H**igh extra space (Merge, Bucket).

**2b) Time Complexity Cases (What they show)**

- **W**orst-Case: **U**pper bound / Guarantee.
- **A**verage-Case: **E**xpected performance.
- **B**est-Case: **L**ower bound / Ideal scenario.

**2c) Bubble vs. Selection Sort (Core Action)**

- **Bubble Sort**: **A**djacent **S**wap (repeatedly).
- **Selection Sort**: **S**elect **M**in & **S**wap (once per pass).

**2d) Bubble Sort Program (Phases: I-S-O)**

1.  **I**nput array.
2.  **S**ort using nested loops & swaps.
3.  **O**utput before & after.

---

### **QUESTION THREE – HEAP & BST ESSENTIALS**

**3a) Heap Properties (The 3 C's)**

1.  **C**omplete Binary Tree.
2.  **C**orrect Order (Max/Min).
3.  **C**ompact Array Representation.

**3b) BST vs. MAX Heap (Rules)**

- **BST Rule**: **L**eft < Parent < **R**ight.
- **MAX Heap Rule**: **P**arent ≥ **C**hildren & **C**omplete tree.

**3c) BST Traversals (Order of L, R, N)**

- **IN**order: **L**eft, **N**ode, **R**ight → **S**orted output.
- **PRE**order: **N**ode, **L**eft, **R**ight.
- **POST**order: **L**eft, **R**ight, **N**ode.
- **LEVEL** order: **B**y **L**evel (BFS).

**3d) Heap Applications (Key Uses: PQ-HS)**

1.  **P**riority **Q**ueues (Scheduling, Dijkstra's).
2.  **H**eap**S**ort (In-place O(n log n) sorting).

---

### **QUESTION FOUR – SEARCH & ANALYSIS**

**4a) Big O Purpose (What it does: CUP)**

- **C**ompare algorithms.
- **U**pper bound on growth.
- **P**redict scalability.

**4b) Complexity Cases (Focus)**

- **B**est-Case → **L**ower bound.
- **W**orst-Case → **G**uarantee.
- **A**verage-Case → **E**xpected.

**4d) Linear Search Complexity (Best/Worst/Avg)**

- **B**est: O(1) (First element).
- **W**orst/Avg: O(n) (Scan up to n elements).

**4e) Linear Search Program (Flow: G-S-R)**

1.  **G**enerate random array.
2.  **S**earch for key linearly.
3.  **R**eport found/index or not found.

---

### **QUESTION FIVE – GRAPHS & APPLICATIONS**

**5a) Social Media Graphs (Model & Propagate)**

- **Modeling (VERTICES & EDGES)**:
  - **V**ertices = Users.
  - **E**dges = Follows/Friendships.
  - Enables: **R**ecommendations, **I**nfluencer ID, **C**ommunity detection.
- **Propagation (CASCADE)**:
  - **C**ontent flows along edges.
  - **A**nalyzed via BFS/DFS.
  - **S**hares = Cascades.
  - **C**rucial for ads & **E**pidemiology models.

**5b) Graph Representations (Two Ways: M & L)**

- **M**atrix: 2D array, `1` = edge.
- **L**inked List: Array of lists, each list = neighbors.

**5c) Heap for SJF (Why: EES)**

- **E**fficient `O(log n)` inserts.
- **E**fficient `O(log n)` extract-min.
- **S**upports core SJF operation (always get shortest job).

---

## **MNEMONIC SUMMARY CHEAT SHEET**

- **Algorithm Analysis**: Think **PEC** (Predict, Compare, Conserve).
- **Data Structure Choice**: Ask **NORT** (Nature, Ops, Runtime, Throughput).
- **Tree Height vs. Depth**: **D**own from **R**oot vs. **L**ong to **L**eaf.
- **BFS vs. DFS**: **B**FS = **Q**ueue, **W**ide. **D**FS = **S**tack, **D**eep.
- **Sorting Types**: **In**-Place = **M**odify. **Out**-of-Place = **C**opy.
- **Heap Properties**: The **3 C's** (Complete, Correct Order, Compact Array).
- **BST Traversal**: **IN** = **LNR** (Sorted). **PRE** = **NLR**. **POST** = **LRN**.
- **Linear Search**: **B**est = 1st, **W**orst/**A**vg = Scan **A**ll.
- **Graphs in Social Media**: **V**ertices, **E**dges, **C**ascades.
- **SJF with Heap**: **L**og **n** for **I**nsert & **E**xtract.
