// Deployment detection utility for Vercel
// This helps detect new deployments without causing refresh loops

interface DeploymentInfo {
  isNewDeployment: boolean;
  deploymentId?: string;
  timestamp?: number;
}

class DeploymentDetector {
  private static instance: DeploymentDetector;
  private currentDeploymentId: string | null = null;
  private lastCheck: number = 0;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.initialize();
  }

  static getInstance(): DeploymentDetector {
    if (!DeploymentDetector.instance) {
      DeploymentDetector.instance = new DeploymentDetector();
    }
    return DeploymentDetector.instance;
  }

  private initialize() {
    // Try to get deployment ID from various sources
    this.currentDeploymentId = this.getDeploymentId();
    
    // Store in localStorage for comparison
    if (this.currentDeploymentId) {
      const stored = localStorage.getItem('pullupclub-deployment-id');
      if (stored !== this.currentDeploymentId) {
        // New deployment detected
        localStorage.setItem('pullupclub-deployment-id', this.currentDeploymentId);
        localStorage.setItem('pullupclub-deployment-timestamp', Date.now().toString());
      }
    }
  }

  private getDeploymentId(): string | null {
    // Try to get deployment ID from Vercel environment variables
    if (typeof window !== 'undefined') {
      // Check for Vercel deployment ID in meta tags or other sources
      const metaDeployment = document.querySelector('meta[name="vercel-deployment-id"]');
      if (metaDeployment) {
        return metaDeployment.getAttribute('content') || null;
      }

      // Check for build ID in Next.js
      const buildId = (window as any).__NEXT_DATA__?.buildId;
      if (buildId) {
        return buildId;
      }

      // Fallback to timestamp-based ID
      return `deploy-${Date.now()}`;
    }
    return null;
  }

  public checkForNewDeployment(): DeploymentInfo {
    const now = Date.now();
    
    // Don't check too frequently
    if (now - this.lastCheck < this.CHECK_INTERVAL) {
      return { isNewDeployment: false };
    }
    
    this.lastCheck = now;
    
    const newDeploymentId = this.getDeploymentId();
    const storedDeploymentId = localStorage.getItem('pullupclub-deployment-id');
    
    if (newDeploymentId && storedDeploymentId && newDeploymentId !== storedDeploymentId) {
      // New deployment detected
      this.currentDeploymentId = newDeploymentId;
      localStorage.setItem('pullupclub-deployment-id', newDeploymentId);
      localStorage.setItem('pullupclub-deployment-timestamp', now.toString());
      
      return {
        isNewDeployment: true,
        deploymentId: newDeploymentId,
        timestamp: now
      };
    }
    
    return { isNewDeployment: false };
  }

  public getCurrentDeploymentInfo(): DeploymentInfo {
    const deploymentId = localStorage.getItem('pullupclub-deployment-id');
    const timestamp = localStorage.getItem('pullupclub-deployment-timestamp');
    
    return {
      isNewDeployment: false,
      deploymentId: deploymentId || undefined,
      timestamp: timestamp ? parseInt(timestamp) : undefined
    };
  }

  public clearDeploymentInfo() {
    localStorage.removeItem('pullupclub-deployment-id');
    localStorage.removeItem('pullupclub-deployment-timestamp');
  }
}

// Export singleton instance
export const deploymentDetector = DeploymentDetector.getInstance();

// Helper function to check for new deployments
export function checkForNewDeployment(): DeploymentInfo {
  return deploymentDetector.checkForNewDeployment();
}

// Helper function to get current deployment info
export function getCurrentDeploymentInfo(): DeploymentInfo {
  return deploymentDetector.getCurrentDeploymentInfo();
}

// Helper function to clear deployment info (useful for testing)
export function clearDeploymentInfo() {
  deploymentDetector.clearDeploymentInfo();
}
