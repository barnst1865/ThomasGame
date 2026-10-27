// Walks through the parts of the day (see src/data/day.js). Each part puts
// its jobs on the task board; when they're all finished, the day can move on.

export class DayPlan {
  constructor(board, parts, targets = {}) {
    this.board = board;
    this.parts = parts;
    this.targets = targets; // how many of each job, e.g. { collectEggs: 3 }
    this.index = -1;
  }

  get part() {
    return this.parts[this.index] ?? null;
  }

  get isLastPart() {
    return this.index === this.parts.length - 1;
  }

  begin() {
    return this.advance();
  }

  // Moves to the next part and gives out its jobs. Returns the new part.
  advance() {
    if (this.index >= this.parts.length - 1) return null;
    this.index += 1;
    const part = this.part;
    for (const job of part.jobs) this.board.add(job, this.targets[job] ?? 1, part.id);
    return part;
  }

  jobs() {
    return this.part ? this.board.forPart(this.part.id) : [];
  }

  // True when every job in this part is done (or failed).
  partDone() {
    const jobs = this.jobs();
    return jobs.length > 0 && jobs.every((t) => t.status !== 'active');
  }

  // 0 to 1: how much of this part's work is done.
  progress() {
    const jobs = this.jobs();
    if (jobs.length === 0) return 0;
    let done = 0;
    let total = 0;
    for (const t of jobs) {
      total += t.target;
      done += t.status === 'active' ? t.progress : t.target;
    }
    return total > 0 ? done / total : 0;
  }

  // The time of day the sky should show right now, in minutes.
  skyTime() {
    const part = this.part;
    if (!part) return 0;
    const [from, to] = part.sky;
    return from + (to - from) * this.progress();
  }
}
