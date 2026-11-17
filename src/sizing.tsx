'use client';

import { createContext, useContext } from 'react';

export type HdsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export const SizeContext = createContext<HdsSize>('md');

export function useHdsSize(size?: HdsSize): HdsSize {
  const inherited = useContext(SizeContext);
  return size ?? inherited;
}
