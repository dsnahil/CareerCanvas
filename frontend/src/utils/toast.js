/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
export const showToast = (message, type = 'info', duration = 3000) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return;
  
  // Check if we have a toast container
  let toastContainer = document.getElementById('toast-container');
  
  // Create toast container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.style.minWidth = '250px';
  toast.style.margin = '10px';
  toast.style.padding = '15px';
  toast.style.borderRadius = '4px';
  toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  toast.style.transition = 'all 0.3s ease';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(-20px)';
  toast.innerText = message;
  
  // Set toast type styles
  switch (type) {
    case 'success':
      toast.style.backgroundColor = '#4CAF50';
      toast.style.color = 'white';
      break;
    case 'error':
      toast.style.backgroundColor = '#F44336';
      toast.style.color = 'white';
      break;
    case 'warning':
      toast.style.backgroundColor = '#FF9800';
      toast.style.color = 'white';
      break;
    default:
      toast.style.backgroundColor = '#2196F3';
      toast.style.color = 'white';
  }
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      
      // Remove container if empty
      if (toastContainer.children.length === 0) {
        document.body.removeChild(toastContainer);
      }
    }, 300);
  }, duration);
};

// Also export as default for backward compatibility
export default showToast;
