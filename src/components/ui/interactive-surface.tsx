'use client';

import { HTMLAttributes, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import clsx from 'clsx';

type InteractiveSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  enableHover?: boolean;
};

export const InteractiveSurface = ({
  className,
  children,
  onMouseMove,
  onMouseLeave,
  enableHover = true,
  ...rest
}: InteractiveSurfaceProps) => {
  const handleMouseMove = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (enableHover) {
        const target = event.currentTarget;
        const rect = target.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        target.style.setProperty('--hover-x', `${x}%`);
        target.style.setProperty('--hover-y', `${y}%`);
      }
      onMouseMove?.(event);
    },
    [enableHover, onMouseMove]
  );

  const handleMouseLeave = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (enableHover) {
        const target = event.currentTarget;
        target.style.removeProperty('--hover-x');
        target.style.removeProperty('--hover-y');
      }
      onMouseLeave?.(event);
    },
    [enableHover, onMouseLeave]
  );

  return (
    <div
      {...rest}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx('card-surface backdrop-blur', className)}
    >
      {children}
    </div>
  );
};
