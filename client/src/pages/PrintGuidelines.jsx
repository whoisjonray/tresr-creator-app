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
        <Link to="/docs/print-guidelines" className="tab-button active">
          Print Guidelines
        </Link>
        <Link to="/docs/garment-details" className="tab-button">
          Garment Details
        </Link>
        <Link to="/docs/design-tools" className="tab-button">
          Design Tools
        </Link>
      </div>

      <div className="guidelines-container">
        <section className="guidelines-section">
          <h2>🧭 Choosing the Right Print Method</h2>
          <p>TRESR offers three professional-grade print options for your artwork:</p>

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
            <li><strong>Avoid:</strong> Fluorescent/neon colors</li>
            <li><strong>Opacity Rule:</strong> No elements under 40% opacity</li>
            <li><strong>Shading:</strong> Use solid fills—not soft gradients or glows</li>
            <li><strong>Halftones:</strong> Use 25–35 LPI, disable anti-aliasing</li>
            <li><strong>Garment Color:</strong> Choose defaults wisely, disable bad combinations</li>
            <li><strong>Knockouts:</strong> Use carefully—limits garment color flexibility</li>
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

        <section className="guidelines-section">
          <h2>📲 Smart NFC Labels — Built Into Every Garment</h2>
          <p>Every TRESR garment includes a <strong>scannable NFC chip</strong> under a <strong>PVC vinyl label on the left sleeve</strong>.</p>
          <p>This turns physical products into digital experiences.</p>
          
          <div className="nfc-section">
            <h3>🛡️ Default NFC Features:</h3>
            <ul>
              <li>Tap-to-scan with any smartphone</li>
              <li>Verifies the garment is authentic</li>
              <li>Unlocks a <strong>Digital Twin Certificate of Authenticity</strong> <strong>minted to the blockchain</strong></li>
            </ul>
          </div>

          <div className="nfc-section">
            <h3>🚀 Advanced NFC Options (For Community Members)</h3>
            <p>With custom NFC programming, your merch can:</p>
            <ul>
              <li>🎥 Link to exclusive media, audio, or behind-the-scenes drops</li>
              <li>🎟️ Grant access to private content or fan experiences</li>
              <li>🛠️ Enable loyalty programs, registration, or digital unlocks</li>
              <li>🧠 Add value to products even <strong>after they're delivered</strong></li>
            </ul>
            <p>All experiences can be added retroactively.</p>
            <p>👉 Select <strong>"Default Authentication"</strong> in the Creator Tool to start.</p>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>💡 Why NFC = More Value = Higher Earnings</h2>
          <p>Most print-on-demand platforms struggle with razor-thin profit margins. Creators are often stuck earning just <strong>10–20%</strong> per sale—on low-priced items with zero real value.</p>
          <p>TRESR is different.</p>
          <p>Because every garment includes <strong>NFC smart tech</strong>, customers get more than a shirt—they get a connected experience, a collectible, and access to a world.</p>
          <ul>
            <li>This creates <strong>perceived and real value</strong></li>
            <li>You can <strong>charge more per item</strong></li>
            <li>And we can afford to pay you <strong>up to 40% per sale (on a higher retail rate)</strong></li>
          </ul>
          <p>🧠 No middlemen. No guesswork. Just premium merch, connected.</p>
        </section>

        <section className="guidelines-section">
          <h2>✅ Final Checklist</h2>
          <ul className="checklist">
            <li>✔ Choose <strong>"Use What's Best"</strong> to let our print shop optimize your results</li>
            <li>✔ PNG format, 150 PPI+, min 1500px wide</li>
            <li>✔ Avoid transparency below 40%</li>
            <li>✔ Use solid fills and bold, contrast-friendly colors</li>
            <li>✔ Use mockups to preview on light and dark garments</li>
            <li>✔ Start with Default Authentication for NFC</li>
            <li>✔ Join the TRESR Creator Community to unlock everything else</li>
          </ul>
        </section>

        <section className="guidelines-section">
          <h2>⚡ The TRESR Difference</h2>
          <ul className="tresr-difference">
            <li>🌟 DTG + DTF + Auto-Optimization</li>
            <li>📲 NFC-backed, scannable, smart garments</li>
            <li>💸 Up to 40% commissions per sale (on higher-priced goods)</li>
            <li>🧠 Creator-first tools, AI workflows, and community resources</li>
            <li>🔓 The only POD platform that helps you build something real</li>
          </ul>
          <p>🎨 Make products that connect.</p>
          <p>🔗 Join now at <a href="https://TRESR.com" target="_blank" rel="noopener noreferrer">TRESR.com</a></p>
        </section>

        <section className="guidelines-section community-section">
          <h2>🔥 Join the TRESR Creator Community</h2>
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