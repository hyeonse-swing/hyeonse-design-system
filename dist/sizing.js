'use client';
import { createContext, useContext } from 'react';
export const SizeContext = createContext('md');
export function useHdsSize(size) {
    const inherited = useContext(SizeContext);
    return size ?? inherited;
}
