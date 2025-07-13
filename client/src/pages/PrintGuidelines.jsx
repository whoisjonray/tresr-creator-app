import React, { useState } from 'react';
import './PrintGuidelines.css';

function PrintGuidelines() {
  const [activeTab, setActiveTab] = useState('print');

  return (
    <div className="print-guidelines-page">
      <div className="guidelines-header">
        <h1>🖨️ TRESR.com Creator Guide</h1>
        <h2>{activeTab === 'print' ? 'DTG vs. DTF Printing + NFC Integration' : 'Garment Details & Specifications'}</h2>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'print' ? 'active' : ''}`}
          onClick={() => setActiveTab('print')}
        >
          Print Guidelines
        </button>
        <button 
          className={`tab-button ${activeTab === 'garments' ? 'active' : ''}`}
          onClick={() => setActiveTab('garments')}
        >
          Garment Details
        </button>
      </div>

      {activeTab === 'print' ? (
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
      ) : (
      <div className="guidelines-container">
        <section className="garments-section">
          <h2>📏 Garment Specifications</h2>
          
          <div className="garment-grid">
            {/* T-Shirts */}
            <div className="garment-card">
              <h3>Medium Weight T-Shirt</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/tshirt-front-black.jpg" alt="T-Shirt Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/tshirt-back-black.jpg" alt="T-Shirt Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 100% Cotton, 6.1 oz</p>
                <p><strong>Fit:</strong> Classic unisex fit</p>
                <p><strong>Print Area:</strong> 12" x 16" (front/back)</p>
                <p><strong>Available Colors:</strong> Black, White, Navy, Light Grey, Natural, Cardinal Red</p>
              </div>
            </div>

            {/* Oversized Drop Shoulder */}
            <div className="garment-card">
              <h3>Oversized Drop Shoulder</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/oversized-front-black.jpg" alt="Oversized Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/oversized-back-black.jpg" alt="Oversized Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 100% Cotton, 6.5 oz</p>
                <p><strong>Fit:</strong> Oversized boxy fit</p>
                <p><strong>Print Area:</strong> 14" x 18" (front/back)</p>
                <p><strong>Available Colors:</strong> Black, Natural</p>
              </div>
            </div>

            {/* Hoodies */}
            <div className="garment-card">
              <h3>Medium Weight Hoodie</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/hoodie-front-black.jpg" alt="Hoodie Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/hoodie-back-black.jpg" alt="Hoodie Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 80/20 Cotton/Poly blend, 8.5 oz</p>
                <p><strong>Fit:</strong> Regular fit with kangaroo pocket</p>
                <p><strong>Print Area:</strong> 11" x 14" (front), 12" x 16" (back)</p>
                <p><strong>Available Colors:</strong> Black, Gold, Light Grey, Cardinal Red, Alpine Green</p>
              </div>
            </div>

            {/* Women's Hoodie */}
            <div className="garment-card">
              <h3>Women's Independent Hoodie</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/womens-hoodie-front-black.jpg" alt="Women's Hoodie Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/womens-hoodie-back-black.jpg" alt="Women's Hoodie Back" />
                  <span>Back</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 80/20 Cotton/Poly blend, 7.5 oz</p>
                <p><strong>Fit:</strong> Slim fit with split kangaroo pocket</p>
                <p><strong>Print Area:</strong> 10" x 13" (front), 11" x 15" (back)</p>
                <p><strong>Available Colors:</strong> Black, Dark Grey, Pink, Natural, Cotton Candy, Light Grey, Mint, White</p>
              </div>
            </div>

            {/* Hats */}
            <div className="garment-card">
              <h3>Patch Hat - Curved</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/hat-curved-front-black.jpg" alt="Curved Hat Front" />
                  <span>Front</span>
                </div>
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/hat-curved-side-black.jpg" alt="Curved Hat Side" />
                  <span>Side</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> 100% Cotton twill</p>
                <p><strong>Style:</strong> 6-panel structured with curved visor</p>
                <p><strong>Print Area:</strong> 4" x 2.25" (front patch)</p>
                <p><strong>Available Colors:</strong> Black, Light Grey</p>
              </div>
            </div>

            {/* Canvas */}
            <div className="garment-card">
              <h3>Art Canvas</h3>
              <div className="garment-images">
                <div className="garment-image">
                  <img src="https://cdn.tresr.com/garments/canvas-preview.jpg" alt="Canvas Preview" />
                  <span>Canvas</span>
                </div>
              </div>
              <div className="garment-details">
                <p><strong>Material:</strong> Premium poly-cotton canvas</p>
                <p><strong>Frame:</strong> 1.5" deep wooden stretcher bars</p>
                <p><strong>Sizes:</strong> 12x12", 16x16", 24x24"</p>
                <p><strong>Finish:</strong> Gallery-wrapped edges</p>
              </div>
            </div>
          </div>
        </section>

        <section className="guidelines-section">
          <h2>📋 Size Charts</h2>
          <p>All measurements are in inches. Garments are measured flat from armpit to armpit (width) and from shoulder to hem (length).</p>
          
          <div className="size-chart">
            <h3>Unisex T-Shirts & Hoodies</h3>
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>S</th>
                  <th>M</th>
                  <th>L</th>
                  <th>XL</th>
                  <th>2XL</th>
                  <th>3XL</th>
                  <th>4XL</th>
                  <th>5XL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Chest Width</td>
                  <td>18</td>
                  <td>20</td>
                  <td>22</td>
                  <td>24</td>
                  <td>26</td>
                  <td>28</td>
                  <td>30</td>
                  <td>32</td>
                </tr>
                <tr>
                  <td>Body Length</td>
                  <td>28</td>
                  <td>29</td>
                  <td>30</td>
                  <td>31</td>
                  <td>32</td>
                  <td>33</td>
                  <td>34</td>
                  <td>35</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
      )}
    </div>
  );
}

export default PrintGuidelines;