// Tracks today's jobs and how far along each one is.

export class TaskBoard {
  constructor(definitions) {
    this.definitions = definitions;
    this.tasks = [];
  }

  // `part` is the part of the day the job belongs to (see src/data/day.js).
  // `title` replaces the usual title, e.g. "Find Farmer Hazel's hat".
  add(id, target = 1, part = null, title = null) {
    const def = this.definitions[id];
    if (!def) throw new Error(`Unknown task: ${id}`);
    const existing = this.get(id);
    if (existing) return existing;
    const task = { id, title: title ?? def.title, reward: def.reward, target, part, progress: 0, status: 'active' };
    this.tasks.push(task);
    return task;
  }

  get(id) {
    return this.tasks.find((t) => t.id === id) ?? null;
  }

  isActive(id) {
    return this.get(id)?.status === 'active';
  }

  // Adds to a task's progress. Returns the task if this call completed it.
  advance(id, amount = 1) {
    const task = this.get(id);
    if (!task || task.status !== 'active') return null;
    return this.setProgress(id, task.progress + amount);
  }

  // Sets progress directly (sheep can wander in and out of the pen).
  // Returns the task if this call completed it.
  setProgress(id, value) {
    const task = this.get(id);
    if (!task || task.status !== 'active') return null;
    task.progress = Math.max(0, Math.min(task.target, value));
    if (task.progress >= task.target) {
      task.status = 'done';
      return task;
    }
    return null;
  }

  fail(id) {
    const task = this.get(id);
    if (task && task.status === 'active') task.status = 'failed';
    return task;
  }

  forPart(part) {
    return this.tasks.filter((t) => t.part === part);
  }

  remaining() {
    return this.tasks.filter((t) => t.status === 'active');
  }

  label(task) {
    return task.target > 1 ? `${task.title} (${task.progress}/${task.target})` : task.title;
  }
}
