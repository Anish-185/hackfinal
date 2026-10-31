// Seed challenges. Every challenge is a stdin/stdout program: the starter code
// already contains the input/output harness, the candidate implements one function.

/** Deterministic large input for performance tests. */
function largeArrayTest(n, seed) {
  let x = seed;
  const values = [];
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    values.push((x % 2000000001) - 1000000000);
  }
  return { values, input: `${n}\n${values.join(" ")}` };
}

const bigMax = largeArrayTest(100000, 42);
const bigAvg = largeArrayTest(100000, 7);
const bigAvgValues = bigAvg.values.map((v) => Math.abs(v));

export const challenges = [
  {
    slug: "find-maximum",
    title: "Find Maximum",
    difficulty: "Easy",
    category: "algorithm",
    skillTags: ["arrays", "python", "javascript"],
    timeLimit: 2,
    memoryLimit: 128,
    description: `Given an array of integers, return the **largest** element.

Implement \`find_max\` / \`findMax\`. The input/output handling is already written for you.

### Input format
- Line 1: an integer \`n\`, the number of elements.
- Line 2: \`n\` space-separated integers.

### Output format
A single integer: the maximum element.

### Constraints
- \`1 ≤ n ≤ 10^5\`
- \`-10^9 ≤ arr[i] ≤ 10^9\`

### Example
\`\`\`
Input:
3
1 5 3

Output:
5
\`\`\``,
    evaluationCriteria: ["Correct on negative numbers", "Linear time", "Handles single-element arrays"],
    supportedLanguages: ["python", "javascript", "java", "cpp"],
    starterCode: {
      python: `import sys


def find_max(arr):
    # Write your code here
    pass


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    arr = list(map(int, data[1:1 + n]))
    print(find_max(arr))


if __name__ == "__main__":
    main()
`,
      javascript: `const data = require("fs").readFileSync(0, "utf8").split(/\\s+/).filter(Boolean).map(Number);

function findMax(arr) {
  // Write your code here
}

const n = data[0];
console.log(String(findMax(data.slice(1, 1 + n))));
`,
      java: `import java.io.*;
import java.util.*;

public class Main {
    static long findMax(long[] arr) {
        // Write your code here
        return 0;
    }

    public static void main(String[] args) throws IOException {
        StreamTokenizer in = new StreamTokenizer(new BufferedInputStream(System.in));
        in.nextToken();
        int n = (int) in.nval;
        long[] arr = new long[n];
        for (int i = 0; i < n; i++) {
            in.nextToken();
            arr[i] = (long) in.nval;
        }
        System.out.println(findMax(arr));
    }
}
`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

long long findMax(const vector<long long>& arr) {
    // Write your code here
    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> arr(n);
    for (auto& x : arr) cin >> x;
    cout << findMax(arr) << "\\n";
    return 0;
}
`,
    },
    referenceSolutions: {
      python: `import sys


def find_max(arr):
    best = arr[0]
    for value in arr:
        if value > best:
            best = value
    return best


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    arr = list(map(int, data[1:1 + n]))
    print(find_max(arr))


if __name__ == "__main__":
    main()
`,
      javascript: `const data = require("fs").readFileSync(0, "utf8").split(/\\s+/).filter(Boolean).map(Number);

function findMax(arr) {
  let best = arr[0];
  for (const v of arr) if (v > best) best = v;
  return best;
}

const n = data[0];
console.log(String(findMax(data.slice(1, 1 + n))));
`,
    },
    publicTests: [
      { input: "3\n1 5 3", expectedOutput: "5", explanation: "5 is the largest of 1, 5 and 3." },
      { input: "3\n10 20 30", expectedOutput: "30", explanation: "The maximum is the last element." },
    ],
    hiddenTests: [
      { input: "3\n-1 -5 -2", expectedOutput: "-1" },
      { input: "3\n4 4 4", expectedOutput: "4" },
      { input: "1\n-1000000000", expectedOutput: "-1000000000" },
      { input: "5\n7 2 9 9 1", expectedOutput: "9" },
      { input: bigMax.input, expectedOutput: String(bigMax.values.reduce((a, b) => Math.max(a, b))), group: "performance" },
    ],
  },

  {
    slug: "balanced-brackets",
    title: "Balanced Brackets",
    difficulty: "Medium",
    category: "algorithm",
    skillTags: ["stacks", "strings"],
    timeLimit: 2,
    memoryLimit: 128,
    description: `A string made of the characters \`()[]{}\` is **balanced** if every opening bracket is closed by the same type of bracket, in the correct order.

Implement \`is_balanced\` / \`isBalanced\` and return whether the string is balanced.

### Input format
A single line containing the bracket string \`s\`.

### Output format
\`YES\` if the string is balanced, otherwise \`NO\`.

### Constraints
- \`1 ≤ |s| ≤ 10^5\`
- \`s\` contains only \`()[]{}\`

### Example
\`\`\`
Input:
{[()]}

Output:
YES
\`\`\``,
    evaluationCriteria: ["Uses a stack correctly", "Rejects unmatched closing brackets", "Rejects leftover opening brackets"],
    supportedLanguages: ["python", "javascript", "java", "cpp"],
    starterCode: {
      python: `import sys


def is_balanced(s):
    # Write your code here
    return False


def main():
    s = sys.stdin.readline().strip()
    print("YES" if is_balanced(s) else "NO")


if __name__ == "__main__":
    main()
`,
      javascript: `const s = require("fs").readFileSync(0, "utf8").trim();

function isBalanced(s) {
  // Write your code here
  return false;
}

console.log(isBalanced(s) ? "YES" : "NO");
`,
      java: `import java.io.*;
import java.util.*;

public class Main {
    static boolean isBalanced(String s) {
        // Write your code here
        return false;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        String s = line == null ? "" : line.trim();
        System.out.println(isBalanced(s) ? "YES" : "NO");
    }
}
`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

bool isBalanced(const string& s) {
    // Write your code here
    return false;
}

int main() {
    string s;
    getline(cin, s);
    while (!s.empty() && isspace((unsigned char)s.back())) s.pop_back();
    cout << (isBalanced(s) ? "YES" : "NO") << "\\n";
    return 0;
}
`,
    },
    referenceSolutions: {
      python: `import sys


def is_balanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]:
            return False
    return not stack


def main():
    s = sys.stdin.readline().strip()
    print("YES" if is_balanced(s) else "NO")


if __name__ == "__main__":
    main()
`,
      javascript: `const s = require("fs").readFileSync(0, "utf8").trim();

function isBalanced(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of s) {
    if ("([{".includes(ch)) stack.push(ch);
    else if (stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}

console.log(isBalanced(s) ? "YES" : "NO");
`,
    },
    publicTests: [
      { input: "{[()]}", expectedOutput: "YES", explanation: "Each bracket closes in the right order." },
      { input: "([)]", expectedOutput: "NO", explanation: "`]` closes `(`, which is the wrong type." },
    ],
    hiddenTests: [
      { input: "(", expectedOutput: "NO" },
      { input: ")", expectedOutput: "NO" },
      { input: "()[]{}", expectedOutput: "YES" },
      { input: "{}", expectedOutput: "YES" },
      { input: "[({})]{}()", expectedOutput: "YES" },
      { input: "((((", expectedOutput: "NO" },
      { input: "{[]}()}", expectedOutput: "NO" },
      { input: "(((())))", expectedOutput: "YES" },
      { input: `${"(".repeat(50000)}${")".repeat(50000)}`, expectedOutput: "YES", group: "performance" },
    ],
  },

  {
    slug: "fix-the-average",
    title: "Fix the Average",
    difficulty: "Easy",
    category: "debugging",
    skillTags: ["debugging", "edge cases", "integer overflow"],
    timeLimit: 2,
    memoryLimit: 128,
    description: `This is a **debugging** challenge. The starter code already contains an implementation of \`average\`, but it has bugs. Find and fix them.

\`average\` must return the average of the numbers, **rounded down** to an integer. If the list is empty, it must return \`0\`.

### Input format
- Line 1: an integer \`n\`.
- Line 2: \`n\` space-separated integers (omitted when \`n = 0\`).

### Output format
A single integer: the floor of the average, or \`0\` when \`n = 0\`.

### Constraints
- \`0 ≤ n ≤ 10^5\`
- \`0 ≤ nums[i] ≤ 10^9\`

### Example
\`\`\`
Input:
4
1 2 3 4

Output:
2
\`\`\``,
    evaluationCriteria: ["Includes every element", "Handles the empty list", "Avoids integer overflow"],
    supportedLanguages: ["python", "javascript", "java", "cpp"],
    starterCode: {
      python: `import sys


def average(nums):
    total = 0
    for i in range(1, len(nums)):
        total += nums[i]
    return total // len(nums)


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    print(average(nums))


if __name__ == "__main__":
    main()
`,
      javascript: `const data = require("fs").readFileSync(0, "utf8").split(/\\s+/).filter(Boolean).map(Number);

function average(nums) {
  let total = 0;
  for (let i = 1; i <= nums.length; i++) {
    total += nums[i];
  }
  return Math.floor(total / nums.length);
}

const n = data[0];
console.log(String(average(data.slice(1, 1 + n))));
`,
      java: `import java.io.*;
import java.util.*;

public class Main {
    static long average(int[] nums) {
        int total = 0;
        for (int i = 1; i < nums.length; i++) {
            total += nums[i];
        }
        return total / nums.length;
    }

    public static void main(String[] args) throws IOException {
        StreamTokenizer in = new StreamTokenizer(new BufferedInputStream(System.in));
        in.nextToken();
        int n = (int) in.nval;
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            in.nextToken();
            nums[i] = (int) in.nval;
        }
        System.out.println(average(nums));
    }
}
`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

long long average(const vector<int>& nums) {
    int total = 0;
    for (size_t i = 1; i < nums.size(); i++) {
        total += nums[i];
    }
    return total / (int)nums.size();
}

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (auto& x : nums) cin >> x;
    cout << average(nums) << "\\n";
    return 0;
}
`,
    },
    referenceSolutions: {
      python: `import sys


def average(nums):
    if not nums:
        return 0
    return sum(nums) // len(nums)


def main():
    data = sys.stdin.read().split()
    n = int(data[0])
    nums = list(map(int, data[1:1 + n]))
    print(average(nums))


if __name__ == "__main__":
    main()
`,
      javascript: `const data = require("fs").readFileSync(0, "utf8").split(/\\s+/).filter(Boolean).map(Number);

function average(nums) {
  if (nums.length === 0) return 0;
  let total = 0n;
  for (const v of nums) total += BigInt(v);
  return total / BigInt(nums.length);
}

const n = data[0];
console.log(String(average(data.slice(1, 1 + n))));
`,
    },
    publicTests: [
      { input: "4\n1 2 3 4", expectedOutput: "2", explanation: "(1+2+3+4)/4 = 2.5, rounded down to 2." },
      { input: "1\n7", expectedOutput: "7", explanation: "A single element is its own average." },
    ],
    hiddenTests: [
      { input: "0\n", expectedOutput: "0" },
      { input: "3\n10 0 0", expectedOutput: "3" },
      { input: "3\n1000000000 1000000000 1000000000", expectedOutput: "1000000000" },
      { input: "2\n5 6", expectedOutput: "5" },
      {
        input: `${bigAvgValues.length}\n${bigAvgValues.join(" ")}`,
        expectedOutput: String(bigAvgValues.reduce((a, b) => a + BigInt(b), 0n) / BigInt(bigAvgValues.length)),
        group: "performance",
      },
    ],
  },
];
