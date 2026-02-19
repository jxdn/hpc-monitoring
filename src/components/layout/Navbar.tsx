import React, { useState } from 'react';
import './Navbar.css';

const Navbar: React.FC = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const currentUrl = window.location.href;
      const response = await fetch(`/api/download-pdf?url=${encodeURIComponent(currentUrl)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();

      if (blob.type === 'application/json') {
        const text = await blob.text();
        const error = JSON.parse(text);
        throw new Error(error.error || 'Failed to generate PDF');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hpc-dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">HPC Monitor</span>
            <span className="brand-subtitle">PBS Pro Cluster</span>
          </div>
        </div>

        <div className="navbar-actions">
          <button
            className="download-btn"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <div className="btn-spinner"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Export PDF</span>
              </>
            )}
          </button>
          
          <div className="status-pill">
            <div className="status-dot"></div>
            <span>Live</span>
          </div>
        </div>
      </div>
      <div className="navbar-glow"></div>
    </nav>
  );
};

export default Navbar;
