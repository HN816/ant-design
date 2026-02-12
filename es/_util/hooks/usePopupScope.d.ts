import React from 'react';
type RenderFunction<T extends unknown[]> = (...args: T) => React.ReactNode;
export interface UsePopupScopeOptions<T extends [React.ReactElement, ...unknown[]]> {
    popupRender?: RenderFunction<T>;
    getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}
export interface UsePopupScopeResult<T extends [React.ReactElement, ...unknown[]]> {
    popupRender: ((...args: T) => React.ReactElement) | undefined;
    getPopupContainer: ((triggerNode: HTMLElement) => HTMLElement) | undefined;
    open: boolean | undefined;
    onPopupVisibleChange: ((open: boolean) => void) | undefined;
}
/**
 * With popupRender/dropdownRender: keeps dropdown open when focus moves to a child popup (e.g. DatePicker).
 * Returns open, getPopupContainer, onPopupVisibleChange for rc components.
 */
export declare const usePopupScope: <T extends [React.ReactElement, ...unknown[]]>(options?: UsePopupScopeOptions<T>) => UsePopupScopeResult<T>;
export {};
