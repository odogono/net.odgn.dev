import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref
} from 'react';

import { easings, useSpring } from '@react-spring/three';

import type { EntityRef } from '../types';

export interface UseMountedProps {
  mountDuration?: number;
  mountOnEnter?: boolean;
  onMount?: () => Promise<boolean>;
  onUnmount?: () => Promise<boolean>;
  ref?: Ref<EntityRef>;
}

export const useMounted = ({
  mountDuration = 500,
  mountOnEnter = true,
  onMount,
  onUnmount,
  ref
}: UseMountedProps) => {
  const isMounted = useRef(false);

  const [springs, api] = useSpring(() => ({
    opacity: isMounted.current ? 1 : 0
  }));

  const startTransitionAnimation = useCallback(
    (enter: boolean) =>
      Promise.all([
        enter ? onMount?.() : onUnmount?.(),
        new Promise<boolean>(resolve => {
          if (isMounted.current === enter) {
            resolve(isMounted.current);
            return;
          }

          const duration = enter ? mountDuration : mountDuration / 2;

          api.start({
            config: { duration, easing: easings.easeInOutSine },
            onRest: async () => {
              isMounted.current = enter;

              resolve(true);
            },
            opacity: enter ? 1 : 0
          });
        })
      ]).then(() => true),
    [api, isMounted, mountDuration, onMount, onUnmount]
  );

  useImperativeHandle(ref, () => ({
    mount: () => startTransitionAnimation(true),
    unmount: () => startTransitionAnimation(false)
  }));

  useEffect(() => {
    if (!isMounted.current && mountOnEnter) {
      startTransitionAnimation(true);
    }
  }, [startTransitionAnimation, mountOnEnter]);

  return { isMounted, springs };
};
