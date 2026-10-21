export interface TopicItem {
  id: string;
  name: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  subtopics: string[];
  icon: string;
  sampleQuestion: string;
  isCustom?: boolean;
}

export const INITIAL_TOPICS: TopicItem[] = [
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    category: 'Core Computer Science',
    difficulty: 'Intermediate',
    subtopics: ['Arrays & Hash Maps', 'Linked Lists & Trees', 'Dynamic Programming', 'Graph Algorithms', 'Sorting & Searching'],
    icon: 'terminal',
    sampleQuestion: 'Could you explain the difference between separate chaining and open addressing in hash tables, and how each handles clustering?'
  },
  {
    id: 'java',
    name: 'Java & Object-Oriented Design',
    category: 'Programming Languages',
    difficulty: 'Intermediate',
    subtopics: ['JVM Memory Model', 'Polymorphism & Abstraction', 'Multithreading & Concurrency', 'Garbage Collection', 'Collections Framework'],
    icon: 'code',
    sampleQuestion: 'How does garbage collection work in the JVM, and what is the difference between minor and major GC cycles?'
  },
  {
    id: 'c',
    name: 'C & Systems Programming',
    category: 'Systems & Low Level',
    difficulty: 'Advanced',
    subtopics: ['Pointers & Memory Allocation', 'Structs & Unions', 'Memory Leaks & Buffer Overflows', 'Stack vs Heap'],
    icon: 'memory',
    sampleQuestion: 'Explain the difference between stack and heap memory allocation in C, and what happens during a stack overflow.'
  },
  {
    id: 'databases',
    name: 'Databases & Indexing',
    category: 'Infrastructure & Data',
    difficulty: 'Intermediate',
    subtopics: ['B-Tree Indexes', 'ACID Properties', 'SQL vs NoSQL', 'Normalization (1NF-3NF)', 'Transactions & Locking'],
    icon: 'database',
    sampleQuestion: 'How does a B-Tree index accelerate search operations in relational databases, and what are the trade-offs on write performance?'
  },
  {
    id: 'os',
    name: 'Operating Systems & Concurrency',
    category: 'Systems & Architecture',
    difficulty: 'Advanced',
    subtopics: ['Process vs Thread', 'Virtual Memory & Paging', 'Deadlocks & Mutexes', 'CPU Scheduling', 'Context Switching'],
    icon: 'memory',
    sampleQuestion: 'What is the difference between a process and a thread, and what happens under the hood during an OS context switch?'
  },
  {
    id: 'networks',
    name: 'Computer Networks & Protocols',
    category: 'Infrastructure & Protocols',
    difficulty: 'Intermediate',
    subtopics: ['TCP vs UDP', 'HTTP/1.1 vs HTTP/2 vs HTTP/3', 'DNS Resolution', 'OSI 7-Layer Model', 'TLS/SSL Handshake'],
    icon: 'lan',
    sampleQuestion: 'Walk me through the steps of a TCP three-way handshake and explain why two steps are insufficient.'
  },
  {
    id: 'aiml',
    name: 'AI & Machine Learning Foundations',
    category: 'Emerging Tech',
    difficulty: 'Intermediate',
    subtopics: ['Supervised vs Unsupervised', 'Bias-Variance Tradeoff', 'Neural Network Backpropagation', 'Embeddings & Vectors', 'Transformers & Attention'],
    icon: 'psychology',
    sampleQuestion: 'Explain the intuition behind self-attention in Transformer architectures and how it differs from traditional RNNs.'
  },
  {
    id: 'hr',
    name: 'HR & Behavioral Communication',
    category: 'Interview Readiness',
    difficulty: 'Beginner',
    subtopics: ['Tell Me About Yourself', 'Handling Merge Conflicts & Disagreements', 'Failure & Learning', 'Leadership & Teamwork', 'Salary & Career Goals'],
    icon: 'record_voice_over',
    sampleQuestion: 'Tell me about a challenging technical conflict you had with a teammate and how you arrived at a collaborative resolution.'
  },
  {
    id: 'custom',
    name: 'Custom Topic Practice',
    category: 'Personal Rehearsal',
    difficulty: 'Intermediate',
    subtopics: ['Type any subject or interview question'],
    icon: 'edit_note',
    sampleQuestion: 'Tell the AI what you want to practice and it will evaluate your verbal explanation.',
    isCustom: true
  }
];
