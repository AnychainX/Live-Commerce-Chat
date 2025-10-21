/**
 * useAutoScroll Hook
 * 
 * Manages intelligent auto-scrolling behavior for chat messages.
 * Automatically scrolls to the latest message when new messages arrive,
 * but respects when users scroll up to read history.
 * 
 * Key Features:
 * - Auto-scrolls to bottom when new messages arrive
 * - Detects when user manually scrolls up (to read history)
 * - Prevents auto-scroll from triggering "user scrolling" detection
 * - Provides manual scroll-to-bottom function
 * - Uses 100px threshold for "at bottom" detection (allows for minor scroll variations)
 * 
 * Common Use Case:
 * ```tsx
 * const { scrollRef, isUserScrolling, scrollToBottom } = useAutoScroll([messages.length]);
 * 
 * <div ref={scrollRef} className="overflow-y-scroll">
 *   {messages.map(msg => <Message key={msg.id} {...msg} />)}
 * </div>
 * 
 * {isUserScrolling && <button onClick={scrollToBottom}>New messages ↓</button>}
 * ```
 */

import { useEffect, useRef, useState } from "react";

/**
 * Return type for useAutoScroll hook
 */
interface UseAutoScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement>;  // Attach to scrollable container
  isUserScrolling: boolean;                    // True if user has scrolled up from bottom
  scrollToBottom: () => void;                  // Function to manually scroll to bottom
}

/**
 * Custom hook for managing auto-scroll behavior in chat interfaces
 * 
 * @param dependencies - Array of values that trigger auto-scroll when changed (typically [messages.length])
 * @returns Object containing scrollRef, isUserScrolling state, and scrollToBottom function
 */
export function useAutoScroll(dependencies: any[]): UseAutoScrollReturn {
  // Ref for the scrollable container (attach this to your div)
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // State to track if user is manually scrolling (viewing history)
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  // Flag to prevent auto-scroll from triggering "user scrolling" detection
  // This solves the problem where programmatic scrolling would incorrectly
  // mark the user as "scrolling"
  const isAutoScrollingRef = useRef(false);

  /**
   * Scrolls the container to the very bottom
   * Used both automatically (on new messages) and manually (via button click)
   */
  const scrollToBottom = () => {
    if (scrollRef.current) {
      // Mark that we're programmatically scrolling
      isAutoScrollingRef.current = true;
      
      // Instant scroll to bottom (no smooth animation for better UX in fast chat)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      
      // Reset flag and update state after scroll completes
      setTimeout(() => {
        isAutoScrollingRef.current = false;
        // Since we just scrolled to bottom, user is no longer "scrolling up"
        setIsUserScrolling(false);
      }, 100);
    }
  };

  /**
   * Handles scroll events to detect if user is manually scrolling
   * Ignores scroll events triggered by our own scrollToBottom function
   */
  const handleScroll = () => {
    // Ignore if element doesn't exist or if we're auto-scrolling
    if (!scrollRef.current || isAutoScrollingRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Check if user is "at bottom" with 100px threshold
    // This allows for minor scroll variations and smooth UX
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    // If not at bottom, user must be reading history
    setIsUserScrolling(!isAtBottom);
  };

  /**
   * Set up scroll event listener on mount
   * Uses passive listener for better scroll performance
   */
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      
      // Cleanup: remove listener on unmount
      return () => {
        scrollElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  /**
   * Auto-scroll effect triggered by dependency changes (new messages)
   * Uses setTimeout(0) to ensure DOM has updated before scrolling
   * 
   * IMPORTANT: Only auto-scrolls if user is NOT reading history
   * If user has scrolled up to read old messages, we respect that and don't force them down
   */
  useEffect(() => {
    // Only auto-scroll if user is NOT reading history (not manually scrolled up)
    if (!isUserScrolling) {
      // setTimeout ensures the DOM has rendered the new messages first
      setTimeout(() => {
        scrollToBottom();
      }, 0);
    }
    // If user IS scrolling (reading history), do nothing - let them read in peace
  }, dependencies); // Re-run when dependencies change (e.g., messages.length increases)

  return {
    scrollRef,        // Attach to your scrollable div
    isUserScrolling,  // Use to show/hide "new messages" button
    scrollToBottom,   // Call to manually scroll to bottom
  };
}


