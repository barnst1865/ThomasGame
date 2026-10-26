// Small vector helpers for animal movement (fleeing, flocking, wandering).

export function length(x, y) {
  return Math.hypot(x, y);
}

export function normalize(x, y) {
  const len = Math.hypot(x, y);
  return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

// Points away from `from`. Strength is 1 when touching and fades to 0 at `radius`.
export function flee(self, from, radius) {
  const dx = self.x - from.x;
  const dy = self.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist >= radius) return { x: 0, y: 0, strength: 0 };
  const strength = 1 - dist / radius;
  if (dist === 0) return { x: 1, y: 0, strength: 1 };
  return { x: dx / dist, y: dy / dist, strength };
}

// Keeps animals from bunching on top of each other.
export function separation(self, others, radius) {
  let x = 0;
  let y = 0;
  for (const other of others) {
    if (other === self) continue;
    const dx = self.x - other.x;
    const dy = self.y - other.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0 && dist < radius) {
      x += (dx / dist) * (1 - dist / radius);
      y += (dy / dist) * (1 - dist / radius);
    }
  }
  return { x, y };
}

// Pulls an animal gently toward the middle of its nearby flock.
export function cohesion(self, others, radius) {
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const other of others) {
    if (other === self) continue;
    const dist = Math.hypot(other.x - self.x, other.y - self.y);
    if (dist < radius) {
      sx += other.x;
      sy += other.y;
      n += 1;
    }
  }
  if (n === 0) return { x: 0, y: 0 };
  return normalize(sx / n - self.x, sy / n - self.y);
}

export function insideRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

export function clampToRect(point, rect) {
  return {
    x: Math.min(rect.x + rect.w, Math.max(rect.x, point.x)),
    y: Math.min(rect.y + rect.h, Math.max(rect.y, point.y)),
  };
}
