import React, { useState } from 'react';
import './Navbar.css';

const Navbar: React.FC = () => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);

      // Get the current URL (where the user is viewing the dashboard)
      const currentUrl = window.location.href;

      // Call the backend API to generate PDF with the current URL
      const response = await fetch(`/api/download-pdf?url=${encodeURIComponent(currentUrl)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Verify it's a PDF and not an error JSON
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const error = JSON.parse(text);
        throw new Error(error.error || 'Failed to generate PDF');
      }

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hpc-dashboard-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>HPC Monitoring</h1>
        <span className="navbar-subtitle">PBS Pro Dashboard</span>
      </div>
      <div className="navbar-actions">
        <button
          className="pdf-download-btn"
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? '⏳ Generating...' : '📄 Download PDF'}
        </button>
        <div className="status-indicator">
          <span className="status-dot active"></span>
          <span>Connected</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
