"use strict";
"use client";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePopupScope = void 0;
var _react = _interopRequireDefault(require("react"));
var _useLayoutEffect = _interopRequireDefault(require("@rc-component/util/lib/hooks/useLayoutEffect"));
var _configProvider = _interopRequireDefault(require("../../config-provider"));
var _ContextIsolator = _interopRequireDefault(require("../ContextIsolator"));
const DATA_PORTAL_OWNER = 'data-portal-owner';
/** Delay before removing portal div so close animation can finish. */
const PORTAL_REMOVE_DELAY = 300;
/**
 * With popupRender/dropdownRender: keeps dropdown open when focus moves to a child popup (e.g. DatePicker).
 * Returns open, getPopupContainer, onPopupVisibleChange for rc components.
 */
const usePopupScope = (options = {}) => {
  const {
    popupRender: renderFn,
    getPopupContainer,
    open: propsOpen,
    onOpenChange
  } = options;
  const portalId = _react.default.useId();
  const portalRef = _react.default.useRef(null);
  const removePortalTimerRef = _react.default.useRef(null);
  const checkAndCloseTimerRef = _react.default.useRef(null);
  const [internalOpen, setInternalOpen] = _react.default.useState(false);
  const mergedOpen = propsOpen !== undefined ? propsOpen : internalOpen;
  const mergedOpenRef = _react.default.useRef(mergedOpen);
  mergedOpenRef.current = mergedOpen; // Deferred callbacks (setTimeout) read latest open state
  const handleOpenChange = _react.default.useCallback(open => {
    if (propsOpen === undefined) setInternalOpen(open);
    onOpenChange?.(open);
  }, [propsOpen, onOpenChange]);
  const cancelAllTimers = _react.default.useCallback(() => {
    if (checkAndCloseTimerRef.current) {
      clearTimeout(checkAndCloseTimerRef.current);
      checkAndCloseTimerRef.current = null;
    }
    if (removePortalTimerRef.current) {
      clearTimeout(removePortalTimerRef.current);
      removePortalTimerRef.current = null;
    }
  }, []);
  const clearPortal = _react.default.useCallback(() => {
    cancelAllTimers();
    portalRef.current?.remove();
    portalRef.current = null;
  }, [cancelAllTimers]);
  (0, _useLayoutEffect.default)(() => () => clearPortal(), [clearPortal]); // Sync cleanup on unmount
  // Div with data-portal-owner so dropdown + child popups (via ConfigProvider below) share one scope
  const mergedGetPopupContainer = _react.default.useCallback(triggerNode => {
    const parent = getPopupContainer?.(triggerNode) ?? document.body;
    if (portalRef.current && portalRef.current.parentNode !== parent) {
      clearPortal(); // Parent changed (e.g. getPopupContainer returns new node)
    }
    if (!portalRef.current) {
      const div = document.createElement('div');
      div.setAttribute(DATA_PORTAL_OWNER, portalId);
      parent.appendChild(div);
      portalRef.current = div;
    }
    return portalRef.current;
  }, [getPopupContainer, portalId, clearPortal]);
  const getPortalContainer = _react.default.useCallback(() => portalRef.current ?? document.body, []);
  // Child popups (DatePicker etc.) use ConfigProvider.getPopupContainer → same portal div. Form/Space isolated.
  const wrappedPopupRender = _react.default.useMemo(() => {
    if (!renderFn) return undefined;
    return (...args) => (/*#__PURE__*/_react.default.createElement(_configProvider.default, {
      getPopupContainer: getPortalContainer
    }, /*#__PURE__*/_react.default.createElement(_ContextIsolator.default, {
      form: true,
      space: true
    }, renderFn.apply(void 0, args))));
  }, [renderFn, getPortalContainer]);
  // On close: defer one tick (blur fires before new focus), then close only if focus left portal scope
  const handlePopupVisibleChange = _react.default.useCallback(open => {
    if (open === false) {
      cancelAllTimers();
      const selector = `[${DATA_PORTAL_OWNER}="${portalId}"]`;
      const checkAndClose = () => {
        checkAndCloseTimerRef.current = null;
        const inPortal = document.activeElement?.closest?.(selector);
        if (inPortal) {
          if (!mergedOpenRef.current) handleOpenChange(true); // Focus still in scope → keep open
          return;
        }
        handleOpenChange(false);
        removePortalTimerRef.current = setTimeout(clearPortal, PORTAL_REMOVE_DELAY);
      };
      checkAndCloseTimerRef.current = setTimeout(checkAndClose, 0);
      return;
    }
    cancelAllTimers();
    handleOpenChange(open);
  }, [portalId, handleOpenChange, clearPortal, cancelAllTimers]);
  if (!renderFn) {
    // No custom popup: pass through and skip scope logic
    return {
      popupRender: undefined,
      getPopupContainer: getPopupContainer ?? undefined,
      open: propsOpen ?? undefined,
      onPopupVisibleChange: onOpenChange ?? undefined
    };
  }
  return {
    popupRender: wrappedPopupRender,
    getPopupContainer: mergedGetPopupContainer,
    open: mergedOpen,
    onPopupVisibleChange: handlePopupVisibleChange
  };
};
exports.usePopupScope = usePopupScope;