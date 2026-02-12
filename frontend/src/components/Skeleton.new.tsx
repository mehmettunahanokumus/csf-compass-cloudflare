/**
 * Skeleton - Simple reusable skeleton loader
 */

interface SkeletonProps {
  w: string;
  h: string;
  rounded?: string;
}

export default function Skeleton({ w, h, rounded = 'var(--radius-sm)' }: SkeletonProps) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: rounded }} />;
}
