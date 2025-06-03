// utils/iosKeyboardFix.js
// Add this to any component with input fields

export const iosKeyboardFix = () => {
  // Check if we're on iOS in PWA mode
  const isIOSPWA = window.navigator.standalone === true && 
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isIOSPWA) {
    // Force focus with delay
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      input.addEventListener('touchstart', function(e) {
        // Force focus on touch
        setTimeout(() => {
          this.focus();
          this.click();
        }, 100);
      });
      
      input.addEventListener('click', function(e) {
        // Double focus attempt
        setTimeout(() => {
          this.focus();
        }, 50);
      });
    });
  }
};

/// Conceptual refinement for iosKeyboardFix using event delegation
export const iosKeyboardFixDelegated = () => {
    const isIOSPWA = window.navigator.standalone === true && 
        /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOSPWA) {
        const handleTouchStart = function(e) {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                setTimeout(() => {
                    e.target.focus();
                    // e.target.click(); // Re-evaluate if click() is always needed
                }, 100);
            }
        };

        const handleClick = function(e) {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
                setTimeout(() => {
                    e.target.focus();
                }, 50);
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { capture: true }); // Use capture if needed, or bubble
        document.addEventListener('click', handleClick, { capture: true }); // Use capture if needed

        // Note: You'd need a way to remove these listeners if this function could be "undone"
        // For a one-time call, it might be acceptable, but less ideal than the hook's cleanup.
    }
};