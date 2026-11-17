export type HdsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export declare const SizeContext: import("react").Context<HdsSize>;
export declare function useHdsSize(size?: HdsSize): HdsSize;
