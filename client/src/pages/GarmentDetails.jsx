import React from 'react';
import { Link } from 'react-router-dom';
import './PrintGuidelines.css';

function GarmentDetails() {
  return (
    <div className="print-guidelines-page">
      <div className="guidelines-header">
        <h1>🖨️ TRESR.com Creator Guide</h1>
        <h2>Garment Details & Specifications</h2>
      </div>

      <div className="tab-navigation">
        <Link to="/docs/print-guidelines" className="tab-button">
          Print Guidelines
        </Link>
        <Link to="/docs/garment-details" className="tab-button active">
          Garment Details
        </Link>
        <Link to="/docs/design-tools" className="tab-button">
          Design Tools
        </Link>
      </div>

      <div className="guidelines-container">
        <section className="guidelines-section">
          <h2>📏 Garment Specifications & Size Charts</h2>
          <p>Complete details for all TRESR products including materials, sizing, and care instructions.</p>
          
          <div className="info-box">
            <p><strong>Note:</strong> Detailed garment specifications will be loaded from our product database. This page will be updated with exact sizing charts, materials, and care instructions for each product type.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default GarmentDetails;