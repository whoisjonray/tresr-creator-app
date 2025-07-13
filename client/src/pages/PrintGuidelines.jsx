import React from 'react';
import { Link } from 'react-router-dom';
import './PrintGuidelines.css';

function PrintGuidelines() {
  return (
    <div className="print-guidelines-page">
      <div className="guidelines-header">
        <h1>🖨️ TRESR.com Creator Guide</h1>
        <h2>DTG vs. DTF Printing + NFC Integration</h2>
      </div>

      <div className="tab-navigation">
        <Link to="/print-guidelines" className="tab-button active">
          Print Guidelines
        </Link>
        <Link to="/garment-details" className="tab-button">
          Garment Details
        </Link>
        <Link to="/design-tools" className="tab-button">
          Design Tools
        </Link>
      </div>

      <div className="guidelines-container">
        <section className="guidelines-section">
          <h2>🧭 Choosing the Right Print Method</h2>
          <p>TRESR offers two professional-grade print options for your artwork:</p>

          <div className="print-method">
            <h3>✅ 1. Use What's Best (Recommended – Default Option)</h3>
            <p>Let our expert print team select the best method (DTG or DTF) based on:</p>
            <ul>
              <li>Your artwork's detail, color type, and texture</li>
              <li>The selected garment material and color</li>
              <li>Optimal quality, longevity, and vibrancy</li>
            </ul>
            <div className="highlight-box">
              <p><strong>💡 Why we recommend it:</strong></p>
              <p>Some designs look best on cotton with DTG. Others pop more with DTF on blends or synthetics. Instead of guessing, let us ensure the best possible print for every order.</p>
            </div>
            <p className="note">📌 This is the default option in the Creator Tool. We strongly encourage you to keep it selected.</p>
          </div>

          <div className="print-method">
            <h3>🎨 2. Direct-to-Garment (DTG)</h3>
            <p>Great for soft, blended, vintage-style prints on cotton.</p>
          </div>

          <div className="print-method">
            <h3>🎨 3. Direct-to-Film (DTF)</h3>
            <p>Ideal for bold, crisp, vibrant artwork on nearly any fabric.</p>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>🧪 Quick Comparison of DTG vs. DTF</h2>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>DTG (Direct-to-Garment)</th>
                <th>DTF (Direct-to-Film)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Best for</td>
                <td>Cotton shirts and hoodies</td>
                <td>Polyester, blends, synthetics</td>
              </tr>
              <tr>
                <td>Print feel</td>
                <td>Soft, blends into fabric</td>
                <td>Slightly raised, sits on surface</td>
              </tr>
              <tr>
                <td>Color vibrancy</td>
                <td>Good on white/light, average on dark</td>
                <td>High on any fabric</td>
              </tr>
              <tr>
                <td>Transparency</td>
                <td>Limited support</td>
                <td>Not supported</td>
              </tr>
              <tr>
                <td>Detail</td>
                <td>Great for halftones and gradients</td>
                <td>Excellent for sharp lines and bold art</td>
              </tr>
              <tr>
                <td>Durability</td>
                <td>Good with care</td>
                <td>Exceptional, high-wash resistance</td>
              </tr>
            </tbody>
          </table>
          <p className="tip">🧠 <strong>Not sure?</strong> Choose <strong>Use What's Best</strong> — our system will optimize it for you.</p>
        </section>

        <section className="guidelines-section">
          <h2>✔️ DTG Design Guidelines (If selected manually)</h2>
          <ul className="guidelines-list">
            <li><strong>File Type:</strong> PNG with transparent background</li>
            <li><strong>Resolution:</strong> 150 PPI or higher</li>
            <li><strong>Minimum Size:</strong> 1500 x 1995 px</li>
            <li><strong>Color Mode:</strong> RGB</li>
            <li><strong>Avoid:</strong> Fluorescent or neon colors</li>
            <li><strong>Use:</strong> Rich, saturated colors for best results</li>
            <li><strong>Transparency:</strong> Semi-transparent elements work well</li>
            <li><strong>Garment Compatibility:</strong> Best on cotton and cotton blends</li>
          </ul>
        </section>

        <section className="guidelines-section">
          <h2>✔️ DTF Design Guidelines (If selected manually)</h2>
          <ul className="guidelines-list">
            <li><strong>File Type:</strong> PNG (no transparency—fill all areas)</li>
            <li><strong>Resolution:</strong> 150 PPI or higher</li>
            <li><strong>Minimum Size:</strong> 1500 px wide</li>
            <li><strong>Color Mode:</strong> RGB</li>
            <li><strong>Avoid:</strong> Semi-transparent layers or halftone gradients</li>
            <li><strong>Use:</strong> Clean, bold shapes with full opacity</li>
            <li><strong>Spacing:</strong> Avoid ultra-fine lines or tight overlaps</li>
            <li><strong>Garment Compatibility:</strong> Prints well on all materials</li>
          </ul>
        </section>

        <section className="guidelines-section">
          <h2>🛠 Helpful Tools (for all methods)</h2>
          <div className="tools-list">
            <a href="https://imageupscaler.com/upscale-image-4x/" target="_blank" rel="noopener noreferrer" className="tool-link">
              🔼 Image Upscaler – Make your artwork 1500px+
            </a>
            <a href="https://imgonline.tools/remove-color" target="_blank" rel="noopener noreferrer" className="tool-link">
              🧹 Remove Background or Colors
            </a>
          </div>
        </section>

        <section className="guidelines-section community-section">
          <h2>🔥 Join the TRESR Creator Community</h2>
          <p>Get access to exclusive design resources, AI workflows, and pro tips:</p>
          <ul className="community-benefits">
            <li>✅ Curated list of the <strong>best design tools</strong> (with tutorials)</li>
            <li>✅ Learn to design <strong>better than pros</strong>, even with zero experience</li>
            <li>✅ Full AI workflows for fast, high-quality design output</li>
            <li>✅ Exclusive templates, prompts, and scaling strategies</li>
            <li>✅ Access to <strong>custom NFC programming</strong> and smart product playbooks</li>
            <li>✅ Private support, content drops, and merch tactics</li>
          </ul>
          <p className="cta">🎯 Level up at <a href="https://TRESR.com" target="_blank" rel="noopener noreferrer">TRESR.com</a></p>
        </section>
      </div>
    </div>
  );
}

export default PrintGuidelines;