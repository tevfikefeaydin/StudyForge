import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hash(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Seeding database...");

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@studyforge.dev" },
    update: {},
    create: {
      email: "demo@studyforge.dev",
      name: "Demo User",
      passwordHash: hash("demo1234"),
      xp: 150,
      streak: 3,
      lastActiveAt: new Date(),
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create demo course
  const course = await prisma.course.upsert({
    where: { id: "demo-course-dsa" },
    update: {},
    create: {
      id: "demo-course-dsa",
      userId: user.id,
      title: "Data Structures & Algorithms",
      description: "Fundamental DSA concepts with code examples in Python and JavaScript",
    },
  });

  console.log(`Created course: ${course.title}`);

  // Create sections
  const sections = [
    { id: "sec-arrays", title: "Arrays & Lists", level: 1, order: 0, parentId: null },
    { id: "sec-arrays-basics", title: "Array Basics", level: 2, order: 0, parentId: "sec-arrays" },
    { id: "sec-arrays-ops", title: "Array Operations", level: 2, order: 1, parentId: "sec-arrays" },
    { id: "sec-sorting", title: "Sorting Algorithms", level: 1, order: 1, parentId: null },
    { id: "sec-sorting-bubble", title: "Bubble Sort", level: 2, order: 0, parentId: "sec-sorting" },
    { id: "sec-sorting-merge", title: "Merge Sort", level: 2, order: 1, parentId: "sec-sorting" },
    { id: "sec-sorting-quick", title: "Quick Sort", level: 2, order: 2, parentId: "sec-sorting" },
    { id: "sec-trees", title: "Trees", level: 1, order: 2, parentId: null },
    { id: "sec-trees-bst", title: "Binary Search Trees", level: 2, order: 0, parentId: "sec-trees" },
    { id: "sec-trees-traversal", title: "Tree Traversals", level: 2, order: 1, parentId: "sec-trees" },
  ];

  for (const sec of sections) {
    await prisma.section.upsert({
      where: { id: sec.id },
      update: {},
      create: { ...sec, courseId: course.id },
    });
  }

  console.log(`Created ${sections.length} sections`);

  // Create text chunks (without embeddings - those require API key)
  const textChunks = [
    {
      id: "chunk-arrays-1",
      sectionId: "sec-arrays-basics",
      type: "text",
      content: `# Arrays

An array is a data structure that stores a collection of elements, each identified by an index. Arrays are one of the most fundamental data structures in computer science.

## Key Properties
- **Fixed size** (in most languages) or **dynamic** (like Python lists, JavaScript arrays)
- **Contiguous memory** allocation
- **O(1)** random access by index
- **O(n)** search for unsorted arrays
- **O(log n)** search for sorted arrays (binary search)

## Memory Layout
Elements are stored in contiguous memory locations. If the base address is B and each element takes S bytes, the address of element at index i is: B + i * S`,
    },
    {
      id: "chunk-arrays-2",
      sectionId: "sec-arrays-ops",
      type: "text",
      content: `## Array Operations Complexity

| Operation | Array | Dynamic Array |
|-----------|-------|--------------|
| Access    | O(1)  | O(1)         |
| Search    | O(n)  | O(n)         |
| Insert    | O(n)  | O(n) amortized O(1) at end |
| Delete    | O(n)  | O(n)         |

### Insertion
To insert an element at position i, all elements from i to n-1 must be shifted right by one position. This takes O(n) time in the worst case.

### Deletion
Similar to insertion, deletion requires shifting elements left to fill the gap. Time complexity is O(n) in the worst case.`,
    },
    {
      id: "chunk-sorting-bubble",
      sectionId: "sec-sorting-bubble",
      type: "text",
      content: `# Bubble Sort

Bubble sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.

## Algorithm
1. Start from the first element
2. Compare adjacent elements
3. Swap if they are in wrong order
4. Repeat until no swaps needed

## Complexity
- **Time**: O(n^2) worst and average case, O(n) best case (already sorted)
- **Space**: O(1) - in-place sorting
- **Stable**: Yes

## When to use
- Small datasets
- Nearly sorted data (best case O(n))
- Educational purposes`,
    },
    {
      id: "chunk-sorting-merge",
      sectionId: "sec-sorting-merge",
      type: "text",
      content: `# Merge Sort

Merge sort is a divide-and-conquer algorithm. It divides the input array into two halves, recursively sorts them, and then merges the sorted halves.

## Algorithm
1. If the array has 0 or 1 elements, it's already sorted
2. Divide the array into two halves
3. Recursively sort each half
4. Merge the two sorted halves

## Complexity
- **Time**: O(n log n) in all cases
- **Space**: O(n) - requires additional space for merging
- **Stable**: Yes

## Advantages
- Guaranteed O(n log n) performance
- Stable sort
- Well-suited for linked lists
- Good for external sorting (large datasets that don't fit in memory)`,
    },
    {
      id: "chunk-bst",
      sectionId: "sec-trees-bst",
      type: "text",
      content: `# Binary Search Trees (BST)

A Binary Search Tree is a binary tree where for each node:
- All values in the left subtree are less than the node's value
- All values in the right subtree are greater than the node's value

## Operations Complexity
| Operation | Average | Worst (unbalanced) |
|-----------|---------|-------------------|
| Search    | O(log n)| O(n)              |
| Insert    | O(log n)| O(n)              |
| Delete    | O(log n)| O(n)              |

## Balanced BSTs
To avoid worst-case O(n) operations, self-balancing trees maintain balance:
- **AVL Tree**: Strict balancing (height difference <= 1)
- **Red-Black Tree**: Relaxed balancing (used in most standard libraries)
- **B-Tree**: Used in databases and file systems`,
    },
  ];

  const codeChunks = [
    {
      id: "chunk-code-bubble",
      sectionId: "sec-sorting-bubble",
      type: "code",
      language: "python",
      content: `def bubble_sort(arr):
    """Sort array using bubble sort algorithm."""
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break  # Optimization: stop if no swaps
    return arr

# Example usage
numbers = [64, 34, 25, 12, 22, 11, 90]
print(bubble_sort(numbers))
# Output: [11, 12, 22, 25, 34, 64, 90]`,
    },
    {
      id: "chunk-code-merge",
      sectionId: "sec-sorting-merge",
      type: "code",
      language: "python",
      content: `def merge_sort(arr):
    """Sort array using merge sort algorithm."""
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)

def merge(left, right):
    """Merge two sorted arrays into one sorted array."""
    result = []
    i = j = 0

    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    result.extend(left[i:])
    result.extend(right[j:])
    return result

# Example
data = [38, 27, 43, 3, 9, 82, 10]
print(merge_sort(data))
# Output: [3, 9, 10, 27, 38, 43, 82]`,
    },
    {
      id: "chunk-code-bst-js",
      sectionId: "sec-trees-bst",
      type: "code",
      language: "javascript",
      content: `class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  insert(value) {
    const node = new TreeNode(value);
    if (!this.root) {
      this.root = node;
      return;
    }
    let current = this.root;
    while (true) {
      if (value < current.value) {
        if (!current.left) { current.left = node; return; }
        current = current.left;
      } else {
        if (!current.right) { current.right = node; return; }
        current = current.right;
      }
    }
  }

  search(value) {
    let current = this.root;
    while (current) {
      if (value === current.value) return current;
      current = value < current.value ? current.left : current.right;
    }
    return null;
  }

  inorder(node = this.root, result = []) {
    if (node) {
      this.inorder(node.left, result);
      result.push(node.value);
      this.inorder(node.right, result);
    }
    return result;
  }
}

// Usage
const tree = new BST();
[5, 3, 7, 1, 4, 6, 8].forEach(v => tree.insert(v));
console.log(tree.inorder()); // [1, 3, 4, 5, 6, 7, 8]
console.log(tree.search(4)); // TreeNode { value: 4, ... }`,
    },
    {
      id: "chunk-code-quicksort",
      sectionId: "sec-sorting-quick",
      type: "code",
      language: "python",
      content: `def quick_sort(arr):
    """Sort array using quick sort algorithm."""
    if len(arr) <= 1:
        return arr

    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]

    return quick_sort(left) + middle + quick_sort(right)

# In-place version (more memory efficient)
def quick_sort_inplace(arr, low=0, high=None):
    if high is None:
        high = len(arr) - 1
    if low < high:
        pi = partition(arr, low, high)
        quick_sort_inplace(arr, low, pi - 1)
        quick_sort_inplace(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

# Example
data = [10, 7, 8, 9, 1, 5]
print(quick_sort(data))  # [1, 5, 7, 8, 9, 10]`,
    },
    {
      id: "chunk-code-traversals",
      sectionId: "sec-trees-traversal",
      type: "code",
      language: "python",
      content: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def inorder(root):
    """Left -> Root -> Right"""
    if not root:
        return []
    return inorder(root.left) + [root.val] + inorder(root.right)

def preorder(root):
    """Root -> Left -> Right"""
    if not root:
        return []
    return [root.val] + preorder(root.left) + preorder(root.right)

def postorder(root):
    """Left -> Right -> Root"""
    if not root:
        return []
    return postorder(root.left) + postorder(root.right) + [root.val]

def level_order(root):
    """BFS - level by level"""
    if not root:
        return []
    result = []
    queue = [root]
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.pop(0)
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result

# Build tree:     1
#               /   \\
#              2     3
#             / \\
#            4   5
root = TreeNode(1, TreeNode(2, TreeNode(4), TreeNode(5)), TreeNode(3))
print("Inorder:", inorder(root))      # [4, 2, 5, 1, 3]
print("Preorder:", preorder(root))    # [1, 2, 4, 5, 3]
print("Postorder:", postorder(root))  # [4, 5, 2, 3, 1]
print("Level:", level_order(root))    # [[1], [2, 3], [4, 5]]`,
    },
  ];

  for (const chunk of [...textChunks, ...codeChunks]) {
    await prisma.chunk.upsert({
      where: { id: chunk.id },
      update: {},
      create: {
        id: chunk.id,
        courseId: course.id,
        sectionId: chunk.sectionId,
        type: chunk.type,
        content: chunk.content,
        language: "language" in chunk ? (chunk as { language: string }).language : null,
        tokenCount: Math.ceil(chunk.content.length / 4),
        metadata: {},
      },
    });
  }

  console.log(`Created ${textChunks.length} text chunks and ${codeChunks.length} code chunks`);

  // Create some sample progress
  await prisma.progress.upsert({
    where: { userId_sectionId: { userId: user.id, sectionId: "sec-arrays-basics" } },
    update: {},
    create: { userId: user.id, sectionId: "sec-arrays-basics", mastery: 85, xpEarned: 120 },
  });

  await prisma.progress.upsert({
    where: { userId_sectionId: { userId: user.id, sectionId: "sec-sorting-bubble" } },
    update: {},
    create: { userId: user.id, sectionId: "sec-sorting-bubble", mastery: 60, xpEarned: 80 },
  });

  await prisma.progress.upsert({
    where: { userId_sectionId: { userId: user.id, sectionId: "sec-sorting-merge" } },
    update: {},
    create: { userId: user.id, sectionId: "sec-sorting-merge", mastery: 25, xpEarned: 30 },
  });

  console.log("Created sample progress data");
  console.log("\nSeed complete!");
  console.log("Demo login: demo@studyforge.dev / demo1234");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
