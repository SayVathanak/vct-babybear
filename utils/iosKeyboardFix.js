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

// Alternative approach - use this in your component
export const useIOSKeyboardFix = () => {
  useEffect(() => {
    const isIOSPWA = window.navigator.standalone === true && 
      /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOSPWA) {
      // Add event listeners to force keyboard
      const handleInputFocus = (e) => {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          setTimeout(() => {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      };
      
      document.addEventListener('touchend', handleInputFocus);
      document.addEventListener('click', handleInputFocus);
      
      return () => {
        document.removeEventListener('touchend', handleInputFocus);
        document.removeEventListener('click', handleInputFocus);
      };
    }
  }, []);
};