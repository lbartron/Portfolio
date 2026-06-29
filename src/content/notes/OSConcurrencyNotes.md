---
title: "OSConcurrencyNotes"
description: "A better note page about my OS class final"
date: 2026-06-28
---

# **🖥️ Operating Systems: Concurrency & File Systems**

**Comprehensive Study Notes & Reference Sheet**

## **Chapter 26: Concurrency An Introduction**

**Thread**: A separate point of execution within the same process.  
Threads share the same address space (Code, Heap) and file descriptors, but they maintain their own isolated state.  
graph LR  
    subgraph Process Memory Space  
        Code  
        Heap  
        FD\[File Descriptors\]  
          
        subgraph Thread 1  
            PC1\[Program Counter\]  
            Reg1\[Registers\]  
            Stack1\[Stack Memory\]  
        end  
          
        subgraph Thread 2  
            PC2\[Program Counter\]  
            Reg2\[Registers\]  
            Stack2\[Stack Memory\]  
        end  
    end  
    Code \-.-\> Thread1  
    Code \-.-\> Thread2  
    Heap \-.-\> Thread1  
    Heap \-.-\> Thread2

* **Thread Control Block (TCB)**: Used to save/restore registers during a context switch.  
* **Use Cases**:  
  * *Parallelism*: Processing an array with multiple threads.  
  * *Latency Hiding*: One thread waits for I/O while another uses the CPU.  
* **Critical Section**: A piece of code that accesses a shared resource or variable.  
* **Race Condition**: Occurs when multiple threads enter a critical section at the same time. Assembly instructions do not execute atomically, meaning a context switch can happen mid-instruction.  
* **Indeterminate**: A program with one or more race conditions resulting in unpredictable outputs.  
* **Synchronization Primitives**: Require both **Hardware support** (atomic instructions) and **OS support** (putting threads to sleep / waking them up).

## **Chapter 27: Thread API**

Linux uses the **POSIX Thread Library (pthreads)**.

### **Creating and Joining Threads**

\#include \<pthread.h\>

// Thread creation  
pthread\_t p1;  
// pthread\_create(\&thread, attr, start\_routine, arg)  
pthread\_create(\&p1, NULL, myfunction, arg);   
// NULL gives default behavior. myfunction must return void\* and accept void\* arg.

// Thread joining  
void \*result;  
pthread\_join(p1, \&result); // Waits for thread to finish and captures return value

*Tip: Since pthread\_create only takes one void\* argument, create a struct to pass multiple arguments to a thread.*

### **Mutexes & Condition Variables**

* **Mutex**: Wraps critical sections with lock/unlock.  
  * pthread\_mutex\_init(\&lock, NULL);  
  * pthread\_mutex\_trylock(mutex): Returns failure immediately if the lock is held.  
  * timedlock(mutex, time): Returns after a timeout if the lock cannot be acquired.  
* **Condition Variables**: Used for signaling between threads.  
  * pthread\_cond\_wait(\&cond, \&lock): Puts calling thread to sleep. Automatically releases the lock when sleeping, and re-acquires it before returning.  
  * pthread\_cond\_signal(\&cond): Wakes up a sleeping thread.

⚠️ **Spurious Wakeup Alert**: Always use a while loop (not an if statement) when waiting for a condition variable. A thread may wake up even if a signal wasn't explicitly sent.  
**General Guidelines**: Keep it simple, minimize thread interactions, always check return codes, and initialize everything\!

## **Chapter 28: Locks**

A lock is a variable that holds the state of a critical section: available or acquired.  
A good lock provides: **Mutual exclusion**, **No thread starvation** (fairness), and **Good performance**.

### **Locking Mechanisms Evaluated**

| Mechanism | Description | Verdict |
| :---- | :---- | :---- |
| **Disable Interrupts** | Turn off hardware interrupts to prevent context switches. | ❌ Bad. Requires kernel mode, dangerous for user code, fails on multiprocessors (CPU 1 disabling doesn't stop CPU 2). |
| **Simple Flag** | A simple boolean variable. | ❌ Bad. Suffers from race conditions on the flag itself. |
| **TestAndSet** | Hardware atomic instruction to read/write memory. Returns old value, sets new. | ✅ Good baseline. Used to build Spin Locks. |
| **Compare-and-Swap** | Hardware instruction: updates location only if it holds the expected value. | ✅ Powerful atomic hardware primitive. |
| **Fetch & Add** | Atomically increment a value and return old. Used for Ticket Locks. | ✅ **Fair**. Guarantees FIFO access via "turns". |

### **Managing Waiting Threads**

* **Spinning**: Wasteful. The thread loops continuously checking the lock (while(testAndSet(\&lock-\>flag, 1\) \== 1);).  
* **Yielding**: Give up the CPU (sched\_yield()). Better, but still expensive.  
* **Sleep & Queues**: Put thread to sleep and use a queue to track waiting threads.  
* **Two-Phase Lock**:  
  1. Spin for a short time (if lock is released quickly, avoids sleep context-switch cost).  
  2. If lock is not acquired, go to sleep. *Optimizes for both low and high contention.*

## **Chapter 29: Lock-based Concurrent Data Structures**

Adding locks to data structures to make them thread-safe involves balancing safety and performance.

* **Simple Counter**: Create one lock around incrementing a value. *Result: Terrible performance on multi-core.*  
* **Sloppy Counters**:  
  * *Local*: Increment a local counter (one per CPU core).  
  * *Global*: One shared counter. Local counters push their values to the global counter periodically based on a threshold S.  
* **Concurrent Linked List**:  
  * *Coarse-grained*: One lock for the whole list. No parallelism.  
  * *Hand-over-Hand*: Add a lock to every node. Acquire next node's lock before releasing current. *Result: Massive overhead.*  
* **Concurrent Queues**: Use a **Head Lock** (protects dequeue) and **Tail Lock** (protects enqueue).  
  * *Michael & Scott Queue*: Add a dummy node at initialization so head and tail never point to the exact same node when empty. Separates enqueue/dequeue so they rarely conflict.  
* **Concurrent Hash Table**: An array of linked lists (buckets). **Lock each bucket individually**. Scales incredibly well.

## **Chapter 30: Condition Variables**

**Condition Variable**: An explicit queue that threads can put themselves on when some state of execution (condition) is not desired.  
// Requires a lock\!  
wait(cond\_t \*c, mutex\_t \*m);   
signal(cond\_t \*c); // wake thread

**Wait Semantics**:

1. Assume lock m is held when calling wait.  
2. Atomically release the lock and go to sleep.  
3. When woken, re-acquire lock before returning.

### **Bounded Buffer (Producer/Consumer)**

* Problem: Shared memory buffer. One consumer takes data, but if empty, it causes an underflow.  
* Solution: Use empty and fill variables. Producer waits on empty, Consumer waits on fill (space available).  
* **Thundering Herd**: pthread\_cond\_broadcast() wakes *all* waiting threads. High cost, but sometimes necessary to prevent deadlocks.

**Hoare vs. Mesa Semantics**:

* *Hoare*: Producer immediately yields CPU to consumer.  
* *Mesa*: Signal puts waiting thread on the ready queue. The signal is a *hint*, not a guarantee. This is why we MUST use a while loop.

## **Chapter 31: Semaphores**

A **Semaphore** is an object with an integer value manipulated by two routines: P() (wait) and V() (post).

* sem\_wait(\&s): Decrement value by 1\. If result is negative, sleep.  
* sem\_post(\&s): Increment value by 1\. If there are waiting threads, wake one.

**Types & Uses:**

1. **Binary Semaphore**: Acts as a simple Mutex Lock (Initialized at 1).  
2. **Semaphore for Ordering**: Acts like a condition variable (Initialized at 0). E.g., Parent waits for child to finish.  
3. **Reader/Writer Locks**: Supports many readers, but only one writer. First reader acquires write lock, last reader releases it. *Warning: Writer may starve if there are infinite readers.*

### **The Dining Philosophers Problem**

* 5 philosophers, 5 chopsticks. Need 2 to eat.  
* If everyone grabs their left chopstick simultaneously ![][image1] **Deadlock** (cycle of dependency).  
* *Solution*: Change the order for one philosopher. Philosophers 0-3 grab left then right; Philosopher 4 grabs right then left.

## **Chapter 32: Concurrency Bugs**

**Bug Types:**

* **Non-Deadlock (Majority)**:  
  * *Atomicity Violations (65%)*: Atomic code region not enforced. *Fix: Use Mutex Locks.*  
  * *Order Violations (30%)*: Order between two memory accesses is flipped. *Fix: Use Condition Variables or Semaphores to enforce state change order.*

### **Deadlocks and The Coffman Conditions**

A deadlock **ONLY** occurs if ALL FOUR of these conditions hold:

1. **Mutual Exclusion**: Threads claim exclusive control of resources. *(Fix: Lock-free/wait-free structures using atomic hardware instructions).*  
2. **Hold and Wait**: Threads hold resources while waiting for additional ones. *(Fix: Require threads to acquire all locks atomically at once).*  
3. **No Preemption**: Resources cannot be forcibly removed. *(Fix: Allow threads to voluntarily give up a lock if they can't get what they need. Watch out for Livelocks; fix livelocks by adding random delays).*  
4. **Circular Wait**: A circular chain of threads waiting for one another. *(Fix: Lock ordering. Always acquire locks in a strict, predefined order).*

### **Handling Deadlocks in the OS**

* **Deadlock Avoidance (Banker's Algorithm)**: Analyze resource requests dynamically. Only grant a request if the resulting state is "safe" (there is a valid execution path for everyone to finish). Requires global knowledge of future needs.  
* **Detect & Recover (The Ostrich Algorithm)**: Just let deadlocks happen. Periodically run a detector, then recover by killing a thread, rolling back a transaction, or rebooting. (Often used in practice because deadlocks are rare).

## **Chapter 33: Event-based Concurrency**

**Goal**: Concurrency without the headaches of threads (e.g., deadlocks).  
**Basic Idea**: The Event Loop.  
while (1) {  
    events \= getEvents(); // e.g., select() or poll()  
    for (e in events) {  
        processEvent(e);   
    }  
}

* Uses select() or poll() to check sets of file descriptors for I/O readiness.  
* **No locks needed**: Event loop runs in a single thread. One event processed at a time.

**Challenges**:

1. **Blocking System Calls**: If one event blocks (e.g., page fault), the *entire* event loop blocks.  
   * *Solution*: **Asynchronous I/O**. Issue I/O request, return immediately, OS does work in background, check later.  
2. **State Management**: In threads, the stack implicitly holds program state. In events, an async call destroys the stack when it returns.  
   * *Solution*: **Continuations**. Manual stack management bundling the FD, buffer pointer, bytes read, and program state into a structure to resume execution later.  
3. **CPU Utilization**: A single loop only uses one CPU core. Using multiple loops re-introduces thread synchronization issues.

## **Chapter 36: I/O Devices**

### **The Canonical I/O Protocol (Polling)**

1. Wait until device is ready (read status register).  
2. Write data to data register; write command to command register.  
3. Start the device.  
4. While status \== busy, wait. *(Polling)*

*Problem*: Polling wastes CPU cycles.  
*Solution*: **Interrupts**. Put calling process to sleep, context switch, and let the device send an interrupt when finished.  
*Exception*: Interrupts are actually worse for very fast devices (overhead) or during a network storm (livelock).

### **Data Movement**

* **PIO (Programmed I/O)**: CPU manually copies data word-by-word. Wasteful.  
* **DMA (Direct Memory Access)**: Hardware engine orchestrates transfers without CPU intervention.  
  1. CPU tells DMA to write.  
  2. CPU does other work.  
  3. DMA handles the copy and raises an interrupt when done.

**Device Drivers**: Software that encapsulates device-specific protocols and presents a standard interface to the OS (e.g., IDE Disk Driver).

## **Chapter 37: Hard Disk Drives**

**HDD Geometry**:

* *Platter*: Circular hard surface coated with magnetic material.  
* *Spindle*: Motor that spins platters.  
* *Surface*: Each platter has 2 sides.  
* *Track*: Concentric circles on the surface storing data.  
* *Cylinder*: Stack of tracks at the same diameter across all surfaces.  
* *Disk Head*: Attached to an arm, reads/writes magnetic patterns.

**HDD Latency Components**:

1. ![][image2]**Seek Time**: Moving the arm to the correct track (slowest).  
2. **Rotational Delay**: Waiting for the sector to rotate under the head (Avg \= time for half rotation).  
3. **Transfer Time**: Actual reading/writing of data.

### **Disk Scheduling Algorithms**

OS tries to reorder I/O requests to minimize delay.

| Algorithm | Description | Pros/Cons |
| :---- | :---- | :---- |
| **FIFO** | First In, First Out | ❌ Terrible random performance. Head jumps wildly. |
| **SSTF** | Shortest Seek Time First | ⚠️ Good performance, but can starve outer track requests. |
| **CSCAN** | Sweep outer to inner, jump back instantly | ✅ Fair. Provides consistent service times for all tracks. |
| **SPTF** | Shortest Positioning Time First | ✅ Best performance. Considers both seek & rotation. Must be implemented in disk controller hardware. |

## **Chapter 38: RAID**

RAID makes multiple disks look like a single, large, reliable disk to the OS.  
*(Assumes ![][image3] \= disk count, ![][image4] \= sequential bandwidth, ![][image5] \= random bandwidth, ![][image6] \= disk capacity).*

| RAID Level | Strategy | Capacity | Reliability | Seq. Read | Seq. Write | Rand. Read | Rand. Write |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **RAID-0** | Striping (No parity) | ![][image7] | 0 (None) | ![][image8] | ![][image8] | ![][image9] | ![][image9] |
| **RAID-1** | Mirroring | ![][image10] | 1 disk (guaranteed) | ![][image11] | ![][image11] | ![][image9] | ![][image12] |
| **RAID-4** | Block Striping \+ Parity Disk | ![][image13] | 1 disk | ![][image14] | ![][image14] | ![][image15] | ![][image16] (Bottleneck) |
| **RAID-5** | Rotating Parity | ![][image13] | 1 disk | ![][image14] | ![][image14] | ![][image9] | ![][image17] |

*Note on RAID-4/5 Random Writes: Requires 4 I/Os (Read old data, Read old parity, Write new data, Write new parity). RAID 5 distributes the parity to avoid the single-disk bottleneck of RAID 4\.*

## **Chapter 39: Files and Directories**

* **Directory**: A list of (user-readable name, inode number) pairs. Creates human-readable hierarchy.  
* **System Calls**:  
  * open(): Creates/accesses a file, returns an integer file descriptor (FD).  
  * read() / write(): Sequential access. Advances current offset.  
  * lseek(): Changes current offset for random access.  
  * fsync(): Forces buffered writes from RAM to persistent storage (critical for durability).

**Links:**

* **Hard Link** (link()): Creates a new name pointing to the *same* inode number. Reference counting prevents file deletion until all links are unlink()ed. Cannot link directories (prevents infinite loops) and cannot cross file systems.  
* **Symbolic Link** (Soft Link): A file containing the pathname of another file. Can point to directories and cross file systems. Can result in a "dangling reference" if target is deleted.

## **Chapter 40: File System Implementation**

* **Blocks**: Disk is divided into fixed-size blocks (e.g., 4KB). The unit of I/O.  
* **On-Disk Regions**:  
  * *Data Region*: Stores user file data.  
  * *Inode Table*: Stores inodes.  
  * *Bitmaps*: Tracks free/allocated blocks and inodes.  
  * *Superblock*: Global FS info (type, block count, magic number).

### **Multi-Level Index (The Inode)**

Inodes hold metadata (permissions, timestamps, size) and pointers to data blocks.  
To accommodate large files without wasting space on small files, it uses an imbalanced tree structure:  
graph TD  
    Inode\[Inode Metadata\] \--\> D1\[Direct Pointers (12)\]  
    Inode \--\> Ind\[Single Indirect Pointer\]  
    Inode \--\> DInd\[Double Indirect Pointer\]  
    Inode \--\> TInd\[Triple Indirect Pointer\]  
      
    D1 \--\> B1\[(Data Blocks)\]  
    Ind \--\> BlockPtrs\[Block of Pointers\] \--\> B2\[(Data Blocks)\]  
    DInd \--\> BlockPtrs2\[Pointers\] \--\> BlockPtrs3\[Pointers\] \--\> B3\[(Data Blocks)\]

* **File System Caching**: OS caches blocks in RAM (Unified Page Cache) for performance. Writes are buffered and batched. *Risk: Crashing before flushing loses data.*

## **Chapter 41: Fast File System (FFS)**

* **Problem with Original Unix FS**: Scattered data randomly, leading to massive seek times.  
* **FFS Solution**: **Cylinder Groups** (Block Groups). Disk is divided into groups, each containing its own Superblock copy, bitmaps, inodes, and data blocks.

**Placement Policies:**

* *Directories*: Place in a group with a low directory count and high free inodes.  
* *Files*: Place file data blocks in the same group as the file's inode. Place files in the same group as their parent directory.

**Large File Exception**:

* *Problem*: A single large file could fill an entire cylinder group, ruining locality for everything else.  
* *Fix*: Split large files across multiple groups (e.g., a new group every few megabytes). Amortizes the seek cost while preserving local space for small files.

## **Chapter 42: Crash Consistency: FSCK and Journaling**

* **Crash Consistency Problem**: FS updates require multiple writes (Inode, Bitmap, Data). Crashing mid-update leaves the FS corrupted/inconsistent.

### **Approaches to Consistency**

1. **FSCK (File System Checker)**:  
   * Offline tool run post-crash. Scans the *entire* disk to verify/fix metadata.  
   * *Verdict*: Way too slow for modern, massive disks. Doesn't prevent data loss.  
2. **Journaling (Write-Ahead Logging)**:  
   * Before updating the actual FS, write a sequential "transaction" to a log area on disk.  
   * *Benefit*: Instant recovery. Just read the log and replay valid transactions.

sequenceDiagram  
    participant Mem as Memory (OS)  
    participant Log as Journal (Disk)  
    participant FS as Actual File System  
      
    Mem-\>\>Log: 1\. Journal Write (TxBegin, Metadata, Data)  
    Mem-\>\>Log: 2\. Journal Commit (TxEnd Block \- Atomic)  
    Note over Log: Transaction is now safely logged.  
    Mem-\>\>FS: 3\. Checkpoint (Write to actual location)  
    Mem-\>\>Log: 4\. Free (Reclaim log space)

**Journaling Modes**:

* **Data Journaling**: Logs BOTH metadata and user data. *Maximum safety, but slow (writes everything twice).*  
* **Ordered (Metadata) Journaling**: Logs ONLY metadata. Forces user data to be written to its final location *before* committing the metadata transaction to the log. *Faster, ensures file pointers never point to garbage, but recent user data might be lost.*

## **Chapter 43: Log-structured File System (LFS)**

* **Motivation**: Since memory caches absorb most reads, disk traffic is mostly writes. Random writes are terrible for HDDs.  
* **LFS Concept**: Write *everything* (data \+ metadata) sequentially to the disk in large segments. Turn random writes into sequential writes\! Never overwrite in place.

**The Inode Map (imap)**:  
Because inodes constantly move (appended to the log), we can't find them at fixed locations. LFS uses an imap (indirection layer) mapping Inode numbers to their current disk address. The Checkpoint Region (CR) points to the latest imap blocks.  
**Garbage Collection**:  
Writing sequentially creates garbage (old versions of files). A background Cleaner reads old segments, identifies live data via a Segment Summary, copies live data to new segments, and frees the old ones.

## **Chapter 44: Flash-based SSDs**

**Flash Properties**:

* *Read*: Fast, random access.  
* *Program (Write)*: Can only change 1s to 0s on a Page.  
* *Erase*: Can only reset an ENTIRE BLOCK (multiple pages) back to 1s.  
* *Constraint*: Cannot overwrite a page without erasing the entire block first. Blocks wear out after thousands of cycles.

### **FTL (Flash Translation Layer)**

Firmware inside the SSD that emulates a standard block device for the OS. It uses Log Structuring (writes new data to the next available page rather than overwriting in place) to avoid the erase-before-write penalty.  
**Mapping Strategies**:

| Strategy | Mechanism | Pros & Cons |
| :---- | :---- | :---- |
| **Page-level Mapping** | Map every logical page to physical page | ✅ Max flexibility/performance. ❌ Requires massive RAM for the map. |
| **Block-level Mapping** | Map logical blocks to physical blocks | ✅ Saves RAM. ❌ Terrible for small random writes. |
| **Hybrid Mapping** | Log blocks (page-mapped) \+ Data blocks (block-mapped) | 🏆 **Industry Standard**. Balances memory and performance perfectly. |

**Wear Leveling**: The FTL moves static, unchanging data around periodically to ensure all physical blocks are erased/written evenly, preventing premature drive failure.

## **Chapter 45: Data Integrity and Protection**

Failures go beyond full disk crashes:

1. **Latent Sector Errors (LSEs)**: Inaccessible/dead blocks.  
2. **Data Corruption**: Silent errors where the drive returns the wrong data.

**Defenses:**

* **Checksums**: (XOR, Fletcher, CRC). Compute a summary of data and store it. Re-compute on read. Mismatch \= Corruption.  
* **Misdirected Writes**: Disk writes data to the wrong location. *Fix: Add physical ID (sector number) into the checksum itself.*  
* **Lost Writes**: Disk reports success but didn't write it. *Fix: Read-after-write verification (slow), or embed the checksum in the parent inode (ZFS approach).*  
* **Scrubbing**: A periodic background operation (weekly/monthly) that scans the entire disk verifying all checksums to fix bit-rot before it propagates.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAZCAYAAADe1WXtAAAAVUlEQVR4XmNgGAWjYFAAU3QBaoCZ6ALUAhnoAtQAz4BYCF2QGmAlECujC8JAFwX4PwPEcAyArpAUjNNQcgDIoOvogpQCqkdUOLoANQDNEv8oGAVYAADYrxnffIDeEgAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA3CAYAAACxQxY4AAAE5ElEQVR4Xu3cAXHjRhQGYGMohWI4CqVQCqVQCsegEArhGJRBGRyBAmjzT/Kub95ItizHsWN/34wm9lpr6a10s3/WvhwOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwh/5+235/2X552f592/L4t5ft+8v29cfe9y3nPWv54+3xZ6rl15ftn8PrueZxttSSn6nlz7fnz+Snw2vNGZOMQa5l3afZcp2fbUwAeCKZ+LoKPV0mxHuXkDYtTeC3quWcoJiw1qXvrOWv8fwzmjUd8208rzA+2wDg4fx8eF25KBUMspJTbhVwzjUn66WQc8tazglsS0FkhuilgPrZzOuzJqujs/707fduzFAHAA9pKRh8VvdWyzmBbZoh+lFsDWxTfdwNAE9p6WOmj1LfRTq2ffmx92m3rGXJpYFtriY9gr2ha2n1FACext5JMB+t3pu9tVzL3sD2yKtJe+tKv3v5Dl8+rgWAD3MqGOS12qb53aEEuHwcmcksX6D/6EntVC17fZ8NK7ISmIDWtwSM2bZl1Sz9Lq1ly0fDOU7/2PXSY075zt2sP8eYbVs++k2/te8jbqn1vaz9ewCAqzkVDBK6MqEu6cEj+82AtiXo5PinthkM15yqZa9L3nNt7I6p4Lmnb7clxOQ4WwLke9o7nsf6ban1vRw7DwC4ikw+x77ztRa6Zp+lSSwBam1F5BqO1ZLVrwTKXk8CUVaA+mSf12db6qjVs/mnN07ZE7py7LUglXPLOeSc6lxybqk7wTZ9M+b5ma1WrvJeeb0CcJ7ncerNz+jvGdUnNeQYea/sk2Plb8LtDUlL98opOeZSv1lr9ksNOb9c77r/ahUv7VVj1Zsae3ukb/ZPW78ONWb9l4iMTY1T1C8OOZdcr6XrCACbZEJZ2qaltshk1B/351F/8PTa33OryXFu87hpy+SdCbSe1zlXiOu1Vlsm7tovfSsAbXVOYJs1zGuSYJC6qq1q6cGpXqsQFtmv2jMGVUPObYaJqnv+kd4arx545zXfqr/vKXMsss1fInqtuV7ZJzXXf1apQFv64wppGZNZb4X8rofAUv0yZpF+1f/c+wUAdlmbXPv/3MyEOSemmjjvRQW7moDzOG3fDv+HlqW2TMIJCLO+rc4JbFvMcc3zCm4VkqPvk/OvYNJDWg86kfY63/TPOJS1993jve+L+X4VlkquYT3vgTWqxrnClsfzfWJezwToWqXsQe7clVgA2C2T0ZzUY646zMkqKvzcg76yVhPpnOTjWFv9PPdjwLmCdamEgx6keoDooaPOt1aOehAr9biuXdVWK0TV3leVev8ca173LWYIulSvNfr4RL9m/Z6cdeVxxrCvzs33mkEsfZZCXN1vAHB1mayWJuQ5iSWU9NWWTJDvHVQukQk0H4P1yTrPc56ZoKvGtGXy7W01Qde+t65radUnY99XkSLnXfWmvYJe6qj22qf69dcSftInY9JXpHoQyf4zvN9CrzXXbY5PrlnqqK3u334/5D3yWqTe3AdL4Xwp1Gecsn/1nwEOAG5iLbRkMl8KePDZJfQnnNb31ADgrtUqAjyTBLa5sgwAd6t/JAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMDD+Q/+V2/7NQ2pUQAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAAAv0lEQVR4Xu2SURHCMAyGowELaJgFLGABC1jAARKQgAMc4AADEwD91gXS0GV94Inrd5db17TJnzQinV+x8RuGyFewTbZL9pztUbon8O+TjclOku+EEOg6f7lcg0BN6EFV6LOjrBlVo8HOxgfNqo5mfZFPQIv/X4ReKZTng6Ga5q8yyHdW+sMeKuEupfpFOHTzm5JHRB+CL0lXQX5tFBhUnTvbhhBfokV711QiRE9O+VGyNwfJhymDdQ19iE7nf3gBAM0uVdPoT+0AAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAaCAYAAACHD21cAAAAqElEQVR4Xu2RUQ3DMAxEjaEUhqEUSmEURqEUyqAQCqEMxmAMRqAAWj8pVqzMXve97UmnSE7Ojs4iv82guqtW1aXUlnr9Sq96ltOYVLucGB9SJ3hodmuLBiY6RzA1BVNmnNuCh++YmekE9BFXqUavzj96B5MsSZNP+RQmsUeMYTjEn4UC3IWroJgZmcpdtNt0f5i2coZYAGNTZz0YUywxOvNtggjD+PNdHIP6KzR3ttOZAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAAApklEQVR4XmNgGAVUB8pA7AbE/6EYxIbhcCRxggCXwpUMCIPxAlwGdDFAxHeiS6ADkKIT6IIMEI0guUp0CWSQwYDdmUJQ8eto4hgA5k8YMGWA2PiMAeIFkEE4ASgWQJpBCpEBrjDBALicj+4qnADkTGwKQQGKTRwD4HIqLnEMgEshuvhnBrTABPkZ5n+QJIgPClAYQDcAWxohCEDRCYod9BgaBaOAAQDugjPg2vaHbAAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAaCAYAAABRqrc5AAAAoklEQVR4XmNgGAWkACF0AWKBMhC7AfF/KAaxkXE4khxBgE8hPjkUAFL0GV0QCkDiIHmC3gUp2okuCAVEuSSDAaLIFE0cFF7XoRjExgtWMkAM6ULD+FyHAkA2wAxAByCXgcIDZAleAPMKKDqxgZkMEHmQOpzgGQP+QKtkgMjjdQ2hkD/BQIRL8BlCMH2AwgAWHqAoRE7qIHGYC4iKnVEwCmgGAFDnNETWxNjLAAAAAElFTkSuQmCC>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAXCAYAAABwOa1vAAAA20lEQVR4Xu2WYQ3CQAyFqwELaMACFrCABSzgAAlIwAEOcICBCYB92V7omhvwA+iF3Jc0Wdole9fru51Zo/GfLGLC8ayWwrqPYx+3MbbTsi3tUd/Y8H46pzEQdQ41QCi1apAYdTly6WMfk5moq1cbBMe5JbcKuVQ0l8wr4hDuYVyqIXbOG0zs3HM6UQzd9uZjPOKiUuliwqbmO/jCC+ZM+zHoXOkDLELm44R4l68LZttLx5XMR5R2IA0Ezf25ZL4qTghEMpsIQhgdLUG9CsNpuxXx/iCqGodGo/ED7kgsOBlCXTpaAAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAXCAYAAAB9J90oAAAA2ElEQVR4Xu2VAQ3CQAxFqwELaMACFrCABSzgAAlIwAEOcIABBMC9bA3dzw1IFlZI7iVNlnZZ/v71b2aNxn+y0Ebg1WxW1qWOpe59bYdjW9pzvrHu/jROfSHmLDNAILN0XIS7qlxK7bWZgbt4tU6o7iW9lfRS8L1jHxGF4AhrkY46FYPj7MJ1GioCd2OoWAN9mRRu2rBhqA5x8IaxME4Gp2oPRryHisR/yteEcry1z46Hiqo5PjsIGfvTeKhSE484dg8hCMLBGsxTg+TH6qX/d+cnjr3RaEzgAUGROBmVtCNVAAAAAElFTkSuQmCC>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAWCAYAAAC7ZX7KAAAA1UlEQVR4Xu2VYQ2DQAyFq2EWpgELWJiFWcACDiYBCXMwB3MwAxMw7oW90DV3BBIuJUu/pCHX8uOl99oTCYL/5GQTiqWaC22KIcXnG9ffspxlrl9k+t+dt0xCKNpyS/GwSU8osiT4maK3SU8oBl8I7lQN4AYOBX0Jv0LwS9XA3Zxdsd2kl+lZbIlmLvuT6572MjbDWrBhqg4nOpcbMngWeXQXA7eW0tDuBuyQ64gevi0C0OHcje0GxJQeAj4WVQVsZal7HD47lC7Qawz7HJPD7d8gCCozAn16M5NxV2BHAAAAAElFTkSuQmCC>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE0AAAAXCAYAAABOHMIhAAABJUlEQVR4Xu2YYQ0CMQxGpwELaMACFrCABSzgAAlIwAEOcIABBMBeoEnTdHe7hD/X9SUNpLuS9EvX9iglSZKVsav2tM5kmle1g3UqNtahmDoLy620E99W21d7/8yrRs4RHeM7MaERQebgGcTlkxjLo9rZOqMiYswhgkjFWTxfWEj2ZJ0OUl0t0XqED4MngEWLei3fmKPyAdN3CGjYXmO36CoiBtHoYYLX48JCsnfrdGAqaojRA+GizsLTIxpX03tGehurSs8VF1o9cTWwzHqCaLia3iohyfMbthKnWL1oPZXWSlAGAtYzfcPQ877ZElUGAjbM5BRaSbNSIBii2vVC4GoOtZ8J3vWS5q6thY0dAlkfkgX0vrAnBq7jUAvqv5j7EzJJlvEBNR1NH+JKu24AAAAASUVORK5CYII=>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEoAAAAXCAYAAACswNlYAAAB80lEQVR4Xu2XYVEDMRCFowELaMACFrCABSzgAAlIwAEOcIABBEA/2p1ZHrvJttdr+uO+mcx0cnfJ5mX3JW1tY2PjinjctQ/tXIkn7Rhwu2sP2jmLr7YPKONGOw5k/T1O2ZDvNlksFvqpnY67Xbtv+0Bpr38f/35vzxmH3z3xXtr/Mciw90OzeSJ6ca7Oc8sD87AIso4WCcEYiDSC731mIBJ9BkJGGwLYA20KBFXxDESgNC1zFISsgBCeKIMQMhNrWgkyMeXVwz+PFgYVsclEnSsaz0o5Ej8TcFUIKApGeXO/ySaC9cZfKTmozAWUVyaIzX9RCCgKRvEeYovwJYTPjbCyrWCmHp3C9uyisMDRIikVHxjlo6ZeOe4pzcp7VnZZXFcrFGWn73hTx1h9xmXwfnRaKpqtSuWUts2txFWCgFQEhckiDyIQW5T3sIzKO9jA6PifIlQlozIDNlOl6UmmVI5zFuXHsUuoMqX0CGZk5pmQZuqVXRvNgUAqNt9Ec08RCqKF4iWISNYQWJYRlN3o/oSg0QXVYH7LTG1ZyffGW42odOxm7FsEpq7fKgjdE1Pn8S0yf/pHGboK7Gjl2D6VyGeWMCWboHKKLGF0ih0DY51zvKPBCzIfWkLvPnQsbGjkpxeHIKK/DEs4Z5mQ9Wts5sZSfgBHb6ImHSbWkwAAAABJRU5ErkJggg==>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEwAAAAXCAYAAACh3qkfAAAB9ElEQVR4Xu2XgU0DMQxFMwMrMAMrsAIrsAIrsAEjMAIbsAEbsAADQB/FkvnYidvrNUW6J0WqcneJ82P/pK1tbGz8A+537U07V+JBOwZc79qdds7mo+0Dy7jSjh+y/h7HbMxnuxDRWPC7djpudu227QOmPf9+/P29PWccfvdEfGp/xyDjXn+azRPRi/NsPLY8QA+LIQtpkSCMgVgj+N5nCmLRZyBotDGAbdCmQnAVT0EMStYySUHQCgjiiTIKQTPRppcmAVB2PfzzaIFQEZ3M1Lmi8azEo03IhDwLBBYFpby432QXQfsDolKKUJkLKLtMGJt/CgQWBaV4j7HF+NLCB0dYOVcw849ObXs2BRY6Wiwl5AOkrNT8K9cESrbynpVjFtfFC0Y56jve/DFgn4EZvB+dropmr1I51W2TK3EdBIGpGAqTRh5FQLY473EZlXewh9G1YapglQzLjNrMl6Ynn1K5BrA4P45dZpWpJUlQI9PPBDXzr+ziaA6EUtH5Jpp7qmAQLRivQUyyiACzDKEcR/cvhI0uugbzW6Zqy6ygN97qRCVlN23fIjB//VZB8J6oOo9v0SFB/yhjV4Udrhz3xxL50BKmZhdUTp0ljE69Q2CsU453NHhF5lNL6N2nDoWNjfx2GgQT/RVZwinLhypYY1M3Ts0XIYWiJhHOvH8AAAAASUVORK5CYII=>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAAAXCAYAAACLbliwAAABs0lEQVR4Xu2YgU3EMAxFMwMrMMOtwAqswAqscBswAiOwARuwAQvcAMADrDNWUrviEkOUJ0W6S9rU/f2x05ayWCwWF+Pw0V5t5wRwT7e2M5NT2Q7oynZ80+r/K2CgN9uZxVNpC0agN+UrWNrjz+HP82Qc9/C7NVcvRMxnO6B4sR2jEZE8uAlcT6sJyRzMNZK7cjaAJzTjHJ8GAeBoD0S8LmfnWrZucgSe0A8lZqhucPF722lgaQriHos3R288oak/tbiHEbm4djxu5hzcLYxOGTU8oYHYa2mvO4hVSwMW8rIgeZGlKBzV7ywiQjOeYgou6gVnt0c4whbF9Ipe4kKnFMSI0KQN61hdFMl92vEezBVte5Z5RGiZd4tWDfoViOQFh4i15SYBkUIiuxbBirnVphE64ujWuBRFmt6VZBEROi11RL5vtBwgRXFP2uhJVOja6hxCzZEsWfbFPASCa30DIW1k7p/l9V8eOvHyvyYmx148JeyBi1uxZHOvWw2Kon1II0FQG2cr3vQXFhybGsAgSHFemuyKuGJ2uMeUQqghf+k3vdmgoOtPBql4H/7/K/bNdjEb7+ocj4DF1Vb5AAAAAElFTkSuQmCC>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFcAAAAXCAYAAAB+kNMAAAABpElEQVR4Xu2YAVEEMQxFqwELaMACFrCAhbOAAyQgAQc4wAEGEHDsGzZDJrSbANf06O2b6cxdtrNNf9M03VJ2dnZ2Qtwv7dUaJ+BuaTfWmM370q6tMcCVNZwhv53bn0GcN2tU3K7tuDYiXIPT8vxl/Z0N0cnYD/bBCj7iXzo4FBn4uXwJWCPyjlPzWD6jksb4LXHhqQyIXpw6WKNBchZRS38ctWxNLANPXKBPahpjQC/ha/ElPVi8d/QmKq5Na90gP7a2uYZtJ9TE9SaVQVTctIqIVaxtcQ0RqcWkP/85RITIAvUmKq4NjG7gjOcQKUGLpysDIIelObzBvxSXlGDLK32wcWJTSURgIWRMr3mHrCUiLgHhiStV0U/H/wbCeA61nMGO8OSwqCMXJa5MZIvWc9li+rAbSUTc1LTA6ngHmk0Jghxs0ZTQm7MTF2qRx01Gbj+I2BKYlDCyvpWrN6IiGtueKqblL328YDopDGgFQlhZ5a3VTivIG4iotVYDe6rPcijNDgGUGrUgqz87Qz7cADlK37hmg1w8dHcO+6CcwMxzuxw+AOIdkK1brltYAAAAAElFTkSuQmCC>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFkAAAAXCAYAAABgWeOzAAABpUlEQVR4Xu2YgU3EMAxFOwMrMAMrsAIrsAIr3AaMwAhswAZswAIMAH2iFpaV1NZdE/dyfVKkuzRqnG/HTjpNBwcHBxfxPLdP2zkAT3N7sJ1ZfM/t3nYGuLMdO+TctW0GIn3ZTsXj0n6WRsRrMF6efyy/e0O0MvfJPljARuxLA8MiBrxP/0KWiLxja16nvyilMX9NZHibEqMZ415sp0FyGlHMeAy2rC2wB57IwJiU9MbEXmHQTpC0YfHe0ZqoyDbdNYf8Wdv+GrajUBLZW1wPoiJ3P0Hh1dLW1xChWlTG859iI0Qc1ZqoyDZAmoNRnmGkCi2iPkkAOa674QWuWmRShT2W6QJIhefkEQGHyJxe84qxJSIygeGJzLyMia7JBYE8w2pG0Y8DyHFRQW5SZFnQGrXnsvV0UcwkInJKusBrXuGzqUKQAriZxy9ktyJDKRK5GcltCjFrQpMqMs/HcqVHXMQjHXDqqdnLGC+omsDEVigEFq+veb/7wd4g4pZaCfpTbJbiNToEUkoUg0TD6KR+IAJymL7BjQa5ehe7Nf3DdkNGXtvt8gu3QpCtSqQwRAAAAABJRU5ErkJggg==>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAAXCAYAAABAtbxOAAABBklEQVR4Xu2W0Q3CIBCGmcEVnMEVXMEVXMEV3MARHMEN3MANXKADKF8iEf/UcjwUSsOX3MMd9HI/lAPnOp1V8dTAWrhqYGlsvZ29vXRggoMGPIO3x8fIdfe2+ZlRiJ37FkFROcJu4pPrGPkIJx/5q5KzYwjQgsPisPtxzJpzNnKEIeoksSBiPxKrSo4w/Q3/0Zyw+CxN0ZQwmoSl0zGHfHTGqliF0SBScP7IZVmA0I1ZsFmwCKOFW4SRx3p5L0JYqgDGVPjU/CJYhKXehoxrY1G/GNw7/GLhBcL5IBZftICvsZjw/ZhVQYsIxg7GqK/o99WFWRg7O6vg4uxdrilSTaNZ2LFOTd78elrF9GrgeAAAAABJRU5ErkJggg==>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAAXCAYAAABTYvy6AAABc0lEQVR4Xu2WAW3DQAxFD0MpDEMplMIojMIolMEgFMIYjMEYjMAAbHlSLbme7VhT01hRnnRS5Escf9vnZIydnZ07crGGzhys4Upkz3ixho4cp/U6rZ/rstVCuOwj6HS7/Yc3azA8T+vDGtcCYQSDuG+zB4hnr4L3vIAf9tsIJxgqKVW3UMVKsHRLVvGvUff1EEQsgXNNO2oIlK6Yg2c5Oh5UG7/n0Ug4wQhUBQFPypa1ryZKDoLFRyvhemAxwBCuW/ZdXUeQKJ0sDaKli9oIt60pg0xXOaqkJrtHJ66NcK+aesjZ8+5B8ryhSBI5OpqKcPFXPWL/wnNOMngxRyCb0gL3eAn07C2EZ0HIkPMqaYkCxL9d+GVxPfcztBiI1hNdI0MuEqWxf3sZvDNK9uKQaYYRwgjCDjiB/WxoAQmqwMRnXlBtkslz0VdgMaSFZUUVYy9KilCtHp1l3xt1W3vohqrwTfE56q2+KaIjsnkqPzc7a/IL1odp39linEkAAAAASUVORK5CYII=>