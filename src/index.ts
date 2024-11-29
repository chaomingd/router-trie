class TrieNode {
  static readonly PATH_VAR = ':PATH_VAR';
  children: Map<string, TrieNode>;
  isEndOfRoute: boolean;
  isExactMatch: boolean;
  path: string | undefined;
  params: string[] | undefined;

  constructor(path?: string) {
    this.children = new Map<string, TrieNode>();
    this.isEndOfRoute = false;
    this.isExactMatch = true;
    this.path = path;
  }
}


interface RouteInfo {
  path: string;
  params: Record<string, string>;
}

class RouterTrie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  // 增加路由信息
  insert(route: string): void {
    let node: TrieNode | undefined = this.root;
    const parts = route.split('/').filter((part) => part.length > 0);
    const params: string[] = [];
    for (const part of parts) {
      const parent = node;
      const isPathVar = part[0] === ':';
      if (isPathVar) {
        params.push(part.slice(1));
      }
      const key = isPathVar ? TrieNode.PATH_VAR : part;
      node = node.children.get(key)
      if (node === undefined) {
        const newNode = new TrieNode(key);
        parent!.children.set(key, newNode);
        node = newNode;
      }
      if (isPathVar) {
        node.isExactMatch = false;
      }
    }
    node.isEndOfRoute = true;
    if (params.length > 0) {
      node.params = params;
    }
  }

  // 查找路由信息
  search(route: string): RouteInfo | null {
    let node: TrieNode | undefined = this.root;
    const parts = route.split('/').filter((part) => part.length > 0);
    let index = 0;
    const nodes: TrieNode[] = [];
    while (node && index < parts.length) {
      const part = parts[index];
      const parent: TrieNode = node;
      node = node.children.get(part);
      if (!node) {
        node = parent.children.get(TrieNode.PATH_VAR);
      }
      if (node) {
        nodes.push(node);
      }
      index++
    }

    const isFind = node && node.isEndOfRoute;
    if (!isFind) return null;

    const params: Record<string, string> = {};
    if (node!.params) {
      let paramIndex = 0;
      nodes.forEach((pathNode, index) => {
        if (pathNode.path && pathNode.path[0] === ':') {
          params[node!.params![paramIndex++]] = parts[index];
        }
      });
    }
    
    return { path: route, params };
  }

  // 删除路由信息
  delete(route: string): boolean {
    return this.deleteHelper(
      this.root,
      route.split('/').filter((part) => part.length > 0),
      0
    );
  }

  private deleteHelper(
    node: TrieNode,
    parts: string[],
    index: number
  ): boolean {
    if (index === parts.length) {
      if (!node.isEndOfRoute) {
        return false;
      }
      node.isEndOfRoute = false;
      return node.children.size === 0;
    }

    const part = parts[index];
    const isPathVar = part[0] === ':';
    const key = isPathVar ? TrieNode.PATH_VAR : part;
    const childNode = node.children.get(key);
    if (!childNode) {
      return false;
    }
    
    const shouldDeleteChild = this.deleteHelper(childNode, parts, index + 1);
    
    if (shouldDeleteChild) {
      node.children.delete(key);
      return true;
    }

    return false;
  }
}

const router = new RouterTrie();

// Insert routes
router.insert("/home");
router.insert("/about");
router.insert("/users/:userId");
router.insert("/users/:id/posts/:postId");

// Search routes
console.log(router.search("/home")); // Output: true
console.log(router.search("/about")); // Output: true
console.log(router.search("/users/123")); // Output: true
console.log(router.search("/users/123/posts/2")); // Output: true
console.log(router.search("/users/123/comments")); // Output: false

// // Delete routes
console.log(router.delete("/home")); // Output: true
console.log(router.delete("/about")); // Output: true
console.log(router.delete("/users/:id")); // Output: false

// // // Search routes after deletion
console.log(router.search("/home")); // Output: false
console.log(router.search("/about")); // Output: false
console.log(router.search("/users/123")); // Output: false
console.log(router.search("/users/123/posts/1")); // Output: true
console.log(router.search("/users/123/comments")); // Output: false
