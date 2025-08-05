import { WorkerMessage, WorkerResponse } from '../workers/dataProcessor.worker';
import { CrimeRecord, CityStats, TimeAnalysis, ProcessingProgress } from '../types/crime';

export interface WorkerTask<T = any> {
  id: string;
  type: WorkerMessage['type'];
  data: any;
  resolve: (result: T) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: ProcessingProgress) => void;
}

export class WorkerManager {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeTasks = new Map<string, WorkerTask>();
  private maxWorkers: number;

  constructor(maxWorkers: number = 2) {
    this.maxWorkers = Math.min(maxWorkers, navigator.hardwareConcurrency || 2);
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker(
        new URL('../workers/dataProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      worker.onmessage = this.handleWorkerMessage.bind(this);
      worker.onerror = this.handleWorkerError.bind(this);
      
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const { type, requestId, data, error, progress } = event.data;
    const task = this.activeTasks.get(requestId);

    if (!task) {
      console.warn('Received response for unknown task:', requestId);
      return;
    }

    switch (type) {
      case 'PROGRESS':
        if (task.onProgress && typeof progress === 'number') {
          task.onProgress({
            current: progress,
            total: 100,
            stage: data || 'Processing...',
          });
        }
        break;

      case 'RESULT':
        this.completeTask(requestId, data);
        break;

      case 'ERROR':
        this.rejectTask(requestId, new Error(error || 'Worker error'));
        break;
    }
  }

  private handleWorkerError(event: ErrorEvent) {
    console.error('Worker error:', event);
    // Find tasks using this worker and reject them
    for (const [requestId, task] of this.activeTasks.entries()) {
      this.rejectTask(requestId, new Error(`Worker crashed: ${event.message}`));
    }
  }

  private completeTask(requestId: string, result: any) {
    const task = this.activeTasks.get(requestId);
    if (task) {
      task.resolve(result);
      this.finishTask(requestId);
    }
  }

  private rejectTask(requestId: string, error: Error) {
    const task = this.activeTasks.get(requestId);
    if (task) {
      task.reject(error);
      this.finishTask(requestId);
    }
  }

  private finishTask(requestId: string) {
    const task = this.activeTasks.get(requestId);
    if (task) {
      this.activeTasks.delete(requestId);
      // Return worker to available pool
      const worker = this.workers.find(w => 
        Array.from(this.activeTasks.values()).every(t => t.id !== requestId)
      );
      if (worker && !this.availableWorkers.includes(worker)) {
        this.availableWorkers.push(worker);
      }
      this.processQueue();
    }
  }

  private processQueue() {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;
      
      this.activeTasks.set(task.id, task);
      
      const message: WorkerMessage = {
        type: task.type,
        data: task.data,
        requestId: task.id,
      };
      
      worker.postMessage(message);
    }
  }

  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public async analyzeCitySafety(
    data: CrimeRecord[],
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<CityStats[]> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<CityStats[]> = {
        id: this.generateTaskId(),
        type: 'ANALYZE_CITY_SAFETY',
        data,
        resolve,
        reject,
        onProgress,
      };

      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.shift()!;
        this.activeTasks.set(task.id, task);
        
        const message: WorkerMessage = {
          type: task.type,
          data: task.data,
          requestId: task.id,
        };
        
        worker.postMessage(message);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  public async analyzeTimePatterns(
    data: CrimeRecord[],
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<TimeAnalysis[]> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<TimeAnalysis[]> = {
        id: this.generateTaskId(),
        type: 'ANALYZE_TIME_PATTERNS',
        data,
        resolve,
        reject,
        onProgress,
      };

      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.shift()!;
        this.activeTasks.set(task.id, task);
        
        const message: WorkerMessage = {
          type: task.type,
          data: task.data,
          requestId: task.id,
        };
        
        worker.postMessage(message);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  public async processLargeDataset(
    records: CrimeRecord[],
    chunkSize: number = 1000,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: this.generateTaskId(),
        type: 'PROCESS_LARGE_DATASET',
        data: { records, chunkSize },
        resolve,
        reject,
        onProgress,
      };

      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.shift()!;
        this.activeTasks.set(task.id, task);
        
        const message: WorkerMessage = {
          type: task.type,
          data: task.data,
          requestId: task.id,
        };
        
        worker.postMessage(message);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  public getStatus() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
    };
  }

  public terminate() {
    // Cancel all active tasks
    for (const [requestId, task] of this.activeTasks.entries()) {
      task.reject(new Error('Worker manager terminated'));
    }

    // Clear queue
    for (const task of this.taskQueue) {
      task.reject(new Error('Worker manager terminated'));
    }

    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers.length = 0;
    this.availableWorkers.length = 0;
    this.taskQueue.length = 0;
    this.activeTasks.clear();
  }
}

// Singleton instance
let workerManager: WorkerManager | null = null;

export const getWorkerManager = (): WorkerManager => {
  if (!workerManager) {
    workerManager = new WorkerManager();
  }
  return workerManager;
};

export const terminateWorkerManager = () => {
  if (workerManager) {
    workerManager.terminate();
    workerManager = null;
  }
};
