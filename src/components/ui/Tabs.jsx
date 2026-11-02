/**
 * Tabs — Tab navigation component for Ilm Essentials LMS.
 *
 * Supports both a children‑pattern (render matching child by index)
 * and a renderContent prop for dynamic tab content.
 *
 * @module components/ui/Tabs
 *
 * @example
 * const tabs = [
 *   { label: 'Overview', icon: <BookOpen /> },
 *   { label: 'Curriculum', icon: <List />, count: 12 },
 *   { label: 'Reviews', count: 48 },
 * ];
 *
 * // Children pattern
 * <Tabs tabs={tabs}>
 *   <OverviewPanel />
 *   <CurriculumPanel />
 *   <ReviewsPanel />
 * </Tabs>
 *
 * // Render prop pattern
 * <Tabs tabs={tabs} renderContent={(index) => <DynamicPanel index={index} />} />
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import clsx from 'clsx';

/**
 * @typedef {object} TabItem
 * @property {string} label — Tab display label
 * @property {React.ReactNode} [icon] — Optional leading icon
 * @property {number} [count] — Optional count badge
 */

/**
 * @param {object} props
 * @param {TabItem[]} props.tabs — Array of tab definitions
 * @param {number} [props.defaultIndex=0] — Initially active tab index
 * @param {number} [props.activeIndex] — Controlled active tab index
 * @param {function} [props.onChange] — Called with new index on tab change
 * @param {function} [props.renderContent] — Render prop: (activeIndex) => ReactNode
 * @param {string} [props.className] — Additional CSS classes for root container
 * @param {React.ReactNode} [props.children] — Tab panels (matched by index)
 */
function Tabs({
  tabs = [],
  defaultIndex = 0,
  activeIndex: controlledIndex,
  onChange,
  renderContent,
  className,
  children,
  ...rest
}) {
  /** Internal state for uncontrolled mode */
  const [internalIndex, setInternalIndex] = useState(defaultIndex);
  const activeIndex = controlledIndex ?? internalIndex;

  /** Refs for measuring the active tab (sliding indicator) */
  const tabRefs = useRef([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  /** Recalculate indicator position */
  const updateIndicator = useCallback(() => {
    const el = tabRefs.current[activeIndex];
    if (el) {
      const parent = el.parentElement;
      setIndicator({
        left: el.offsetLeft - (parent?.scrollLeft ?? 0),
        width: el.offsetWidth,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  /** Handle tab click */
  const selectTab = (index) => {
    if (controlledIndex === undefined) setInternalIndex(index);
    onChange?.(index);
  };

  /** Resolve content to display */
  const content = renderContent
    ? renderContent(activeIndex)
    : React.Children.toArray(children)[activeIndex] ?? null;

  return (
    <div className={clsx('w-full', className)} {...rest}>
      {/* Tab bar */}
      <div className="relative overflow-x-auto" role="tablist">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={tab.label}
                ref={(el) => (tabRefs.current[i] = el)}
                role="tab"
                type="button"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectTab(i)}
                className={clsx(
                  'relative flex items-center gap-2 px-4 py-3 text-sm font-medium font-body whitespace-nowrap rounded-t-lg transition-colors duration-200 cursor-pointer',
                  isActive
                    ? 'text-primary-900'
                    : 'text-ink-500 hover:text-ink-800 hover:bg-sand-100'
                )}
              >
                {tab.icon && <span className="h-4 w-4 shrink-0">{tab.icon}</span>}
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={clsx(
                      'ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold',
                      isActive
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-sand-200 text-ink-600'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sliding underline indicator */}
        <div className="relative h-0.5 bg-sand-200">
          <div
            className="absolute top-0 h-0.5 bg-primary-900 rounded-full transition-all duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
        </div>
      </div>

      {/* Active panel */}
      <div role="tabpanel" className="pt-5 animate-fade-in">
        {content}
      </div>
    </div>
  );
}

Tabs.displayName = 'Tabs';

export { Tabs };
export default Tabs;
